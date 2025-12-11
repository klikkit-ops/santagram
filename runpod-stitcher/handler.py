import json
import subprocess
import boto3
import os
import sys
import tempfile
import time
from pathlib import Path

def download_from_r2(key, local_path, r2_config):
    """Download file from R2"""
    s3 = boto3.client(
        's3',
        endpoint_url=f"https://{r2_config['account_id']}.r2.cloudflarestorage.com",
        aws_access_key_id=r2_config['access_key_id'],
        aws_secret_access_key=r2_config['secret_access_key']
    )
    s3.download_file(r2_config['bucket_name'], key, local_path)
    print(f"Downloaded {key} to {local_path}")

def upload_to_r2(local_path, key, r2_config):
    """Upload file to R2"""
    s3 = boto3.client(
        's3',
        endpoint_url=f"https://{r2_config['account_id']}.r2.cloudflarestorage.com",
        aws_access_key_id=r2_config['access_key_id'],
        aws_secret_access_key=r2_config['secret_access_key']
    )
    s3.upload_file(local_path, r2_config['bucket_name'], key)
    print(f"Uploaded {local_path} to {key}")

def split_audio_handler(input_data, r2_config):
    """Handle audio splitting mode"""
    audio_key = input_data['audio_key']
    chunk_duration = input_data.get('chunk_duration', 10)
    
    print(f"Starting audio splitting: {audio_key} into {chunk_duration}s chunks")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir_path = Path(tmpdir)
        
        # Download audio
        print("Downloading audio...")
        audio_path = tmpdir_path / "audio.mp3"
        download_from_r2(audio_key, str(audio_path), r2_config)
        
        # Split audio using ffmpeg
        print(f"Splitting audio into {chunk_duration}s chunks...")
        chunk_paths = []
        chunk_keys = []
        
        # Use ffmpeg segment muxer to split audio
        output_pattern = tmpdir_path / "chunk_%03d.mp3"
        result = subprocess.run([
            'ffmpeg', '-i', str(audio_path),
            '-f', 'segment',
            '-segment_time', str(chunk_duration),
            '-c', 'copy',
            '-reset_timestamps', '1',
            '-y', str(output_pattern)
        ], capture_output=True, text=True, check=True)
        
        # Find all generated chunks
        chunk_files = sorted(tmpdir_path.glob('chunk_*.mp3'))
        print(f"Generated {len(chunk_files)} audio chunks")
        
        # Upload each chunk to R2
        base_key = f"audio/chunks/{int(time.time() * 1000)}"
        for i, chunk_file in enumerate(chunk_files):
            chunk_key = f"{base_key}-chunk-{i + 1}.mp3"
            upload_to_r2(str(chunk_file), chunk_key, r2_config)
            chunk_keys.append(chunk_key)
            
            # Construct public URL
            if r2_config['public_url']:
                chunk_url = f"{r2_config['public_url'].rstrip('/')}/{chunk_key.lstrip('/')}"
            else:
                chunk_url = f"https://pub-{r2_config['account_id']}.r2.dev/{r2_config['bucket_name']}/{chunk_key.lstrip('/')}"
            chunk_paths.append(chunk_url)
        
        print(f"Audio splitting completed successfully: {len(chunk_paths)} chunks")
        
        return {
            'status': 'COMPLETED',
            'output': {
                'chunk_urls': chunk_paths,
                'chunk_keys': chunk_keys
            }
        }

def handler(event):
    """Main handler function"""
    try:
        input_data = event.get('input', {})
        
        # Check mode - default to 'stitch_video' for backward compatibility
        mode = input_data.get('mode', 'stitch_video')
        
        # R2 configuration from input
        r2_config = {
            'account_id': input_data['r2_account_id'],
            'access_key_id': input_data['r2_access_key_id'],
            'secret_access_key': input_data['r2_secret_access_key'],
            'bucket_name': input_data['r2_bucket_name'],
            'public_url': input_data.get('r2_public_url', '')
        }
        
        # Handle audio splitting mode
        if mode == 'split_audio':
            return split_audio_handler(input_data, r2_config)
        
        # Default: video stitching mode
        video_chunks = input_data['video_chunks']  # Array of R2 keys
        audio_key = input_data['audio_key']
        output_key = input_data['output_key']
        
        print(f"Starting video stitching: {len(video_chunks)} chunks")
        print(f"Audio key: {audio_key}")
        print(f"Output key: {output_key}")
        
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_path = Path(tmpdir)
            
            # Download all video chunks
            print("Downloading video chunks...")
            chunk_paths = []
            for i, chunk_key in enumerate(video_chunks):
                chunk_path = tmpdir_path / f"chunk_{i}.mp4"
                download_from_r2(chunk_key, str(chunk_path), r2_config)
                chunk_paths.append(chunk_path)
            
            # Download audio
            print("Downloading audio...")
            audio_path = tmpdir_path / "audio.mp3"
            download_from_r2(audio_key, str(audio_path), r2_config)
            
            # Create concat file for ffmpeg
            concat_file = tmpdir_path / "concat.txt"
            with open(concat_file, 'w') as f:
                for chunk_path in chunk_paths:
                    # Use absolute path and escape single quotes
                    abs_path = chunk_path.resolve()
                    f.write(f"file '{abs_path}'\n")
            
            # Step 1: Concatenate video chunks
            print("Concatenating video chunks...")
            temp_video = tmpdir_path / "temp_video.mp4"
            result = subprocess.run([
                'ffmpeg', '-f', 'concat', '-safe', '0',
                '-i', str(concat_file),
                '-c', 'copy',
                '-y', str(temp_video)
            ], capture_output=True, text=True, check=True)
            print("Video concatenation completed")
            
            # Step 2: Merge video with audio
            print("Merging video with audio...")
            final_video = tmpdir_path / "final.mp4"
            result = subprocess.run([
                'ffmpeg', '-i', str(temp_video),
                '-i', str(audio_path),
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-map', '0:v:0',
                '-map', '1:a:0',
                '-y', str(final_video)
            ], capture_output=True, text=True, check=True)
            print("Video and audio merge completed")
            
            # Upload final video to R2
            print(f"Uploading final video to R2: {output_key}")
            upload_to_r2(str(final_video), output_key, r2_config)
            
            # Construct public URL
            if r2_config['public_url']:
                public_url = f"{r2_config['public_url'].rstrip('/')}/{output_key.lstrip('/')}"
            else:
                public_url = f"https://pub-{r2_config['account_id']}.r2.dev/{r2_config['bucket_name']}/{output_key.lstrip('/')}"
            
            print(f"Video stitching completed successfully: {public_url}")
            
            # Return success
            return {
                'status': 'COMPLETED',
                'output': {
                    'video_url': public_url,
                    'output_key': output_key
                }
            }
    except subprocess.CalledProcessError as e:
        error_msg = f"ffmpeg error: {e.stderr}"
        print(f"ERROR: {error_msg}")
        return {
            'status': 'FAILED',
            'error': error_msg
        }
    except Exception as e:
        error_msg = f"Handler error: {str(e)}"
        print(f"ERROR: {error_msg}")
        return {
            'status': 'FAILED',
            'error': error_msg
        }

# RunPod handler entry point
if __name__ == '__main__':
    try:
        # Read input from stdin (RunPod passes JSON via stdin)
        input_json = sys.stdin.read()
        event = json.loads(input_json)
        
        # Process the event
        result = handler(event)
        
        # Output result to stdout (RunPod reads from stdout)
        print(json.dumps(result))
        sys.exit(0)
    except Exception as e:
        error_result = {
            'status': 'FAILED',
            'error': f"Fatal error: {str(e)}"
        }
        print(json.dumps(error_result))
        sys.exit(1)


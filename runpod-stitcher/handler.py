import json
import subprocess
import boto3
import os
import sys
import tempfile
import time
import requests
from pathlib import Path

# Try to import runpod SDK, fallback to stdin/stdout if not available
try:
    import runpod
    USE_RUNPOD_SDK = True
except ImportError:
    USE_RUNPOD_SDK = False
    print("Warning: runpod SDK not available, using stdin/stdout mode")

def download_from_r2(key, local_path, r2_config):
    """Download file from R2"""
    from botocore.config import Config
    
    # Configure boto3 for R2 with proper SSL settings
    config = Config(
        signature_version='s3v4',
        s3={
            'addressing_style': 'path'
        }
    )
    
    s3 = boto3.client(
        's3',
        endpoint_url=f"https://{r2_config['account_id']}.r2.cloudflarestorage.com",
        aws_access_key_id=r2_config['access_key_id'],
        aws_secret_access_key=r2_config['secret_access_key'],
        config=config
    )
    s3.download_file(r2_config['bucket_name'], key, local_path)
    print(f"Downloaded {key} to {local_path}")

def upload_to_r2(local_path, key, r2_config, content_type='application/octet-stream'):
    """Upload file to R2"""
    from botocore.config import Config
    
    # Configure boto3 for R2 with proper SSL settings
    config = Config(
        signature_version='s3v4',
        s3={
            'addressing_style': 'path'
        }
    )
    
    s3 = boto3.client(
        's3',
        endpoint_url=f"https://{r2_config['account_id']}.r2.cloudflarestorage.com",
        aws_access_key_id=r2_config['access_key_id'],
        aws_secret_access_key=r2_config['secret_access_key'],
        config=config
    )
    s3.upload_file(local_path, r2_config['bucket_name'], key, ExtraArgs={'ContentType': content_type})
    print(f"Uploaded {local_path} to {key}")

def generate_and_stitch_handler(input_data, r2_config):
    """Handle full pipeline: split audio, generate videos via Replicate, stitch together"""
    audio_key = input_data['audio_key']
    video_url = input_data.get('video_url', 'https://blob.santagram.app/hero/hero.mp4')
    chunk_duration = input_data.get('chunk_duration', 25)
    output_key = input_data['output_key']
    replicate_api_token = input_data.get('replicate_api_token')
    
    if not replicate_api_token:
        raise ValueError("Missing replicate_api_token in input")
    
    print(f"Starting full pipeline: split audio, generate videos, stitch")
    print(f"Audio key: {audio_key}, Video URL: {video_url}, Chunk duration: {chunk_duration}s")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir_path = Path(tmpdir)
        
        # Step 1: Download and split audio
        print("Step 1: Downloading and splitting audio...")
        audio_path = tmpdir_path / "audio.mp3"
        download_from_r2(audio_key, str(audio_path), r2_config)
        
        # Split audio using ffmpeg
        output_pattern = tmpdir_path / "chunk_%03d.mp3"
        subprocess.run([
            'ffmpeg', '-i', str(audio_path),
            '-f', 'segment',
            '-segment_time', str(chunk_duration),
            '-c', 'copy',
            '-reset_timestamps', '1',
            '-y', str(output_pattern)
        ], capture_output=True, text=True, check=True)
        
        chunk_files = sorted(tmpdir_path.glob('chunk_*.mp3'))
        print(f"Audio split into {len(chunk_files)} chunks")
        
        # Step 2: Upload audio chunks to R2 and create Replicate predictions
        print("Step 2: Uploading chunks and creating Replicate predictions...")
        base_key = f"audio/chunks/{int(time.time() * 1000)}"
        chunk_urls = []
        prediction_ids = []
        
        for i, chunk_file in enumerate(chunk_files):
            chunk_key = f"{base_key}-chunk-{i + 1}.mp3"
            upload_to_r2(str(chunk_file), chunk_key, r2_config, content_type='audio/mpeg')
            
            # Construct public URL
            if r2_config['public_url']:
                public_url = r2_config['public_url'].rstrip('/')
                if not public_url.startswith('http://') and not public_url.startswith('https://'):
                    public_url = f"https://{public_url}"
                chunk_url = f"{public_url}/{chunk_key.lstrip('/')}"
            else:
                chunk_url = f"https://pub-{r2_config['account_id']}.r2.dev/{r2_config['bucket_name']}/{chunk_key.lstrip('/')}"
            chunk_urls.append(chunk_url)
            
            # Create Replicate prediction
            print(f"Creating Replicate prediction {i+1}/{len(chunk_files)}...")
            prediction_response = requests.post(
                'https://api.replicate.com/v1/predictions',
                headers={
                    'Authorization': f'Token {replicate_api_token}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': 'kwaivgi/kling-lip-sync',
                    'input': {
                        'video_url': video_url,
                        'audio_file': chunk_url,
                    }
                },
                timeout=30
            )
            prediction_response.raise_for_status()
            prediction_data = prediction_response.json()
            prediction_ids.append(prediction_data['id'])
            print(f"Prediction {i+1} created: {prediction_data['id']}")
            
            # Rate limiting: wait between predictions (burst limit is 5)
            if i < len(chunk_files) - 1 and (i + 1) % 5 == 0:
                print("Rate limit: waiting 2 seconds before next batch...")
                time.sleep(2)
        
        # Step 3: Poll for all predictions to complete
        print(f"Step 3: Polling {len(prediction_ids)} predictions for completion...")
        video_urls = []
        max_polls = 120  # 10 minutes max (5 second intervals)
        
        for pred_id in prediction_ids:
            completed = False
            polls = 0
            while not completed and polls < max_polls:
                status_response = requests.get(
                    f'https://api.replicate.com/v1/predictions/{pred_id}',
                    headers={'Authorization': f'Token {replicate_api_token}'},
                    timeout=30
                )
                status_response.raise_for_status()
                status_data = status_response.json()
                
                if status_data['status'] == 'succeeded':
                    output = status_data.get('output')
                    if isinstance(output, str):
                        video_urls.append(output)
                    elif isinstance(output, list) and len(output) > 0:
                        video_urls.append(output[0])
                    else:
                        raise ValueError(f"Unexpected output format from Replicate: {output}")
                    completed = True
                    print(f"Prediction {pred_id[:8]}... completed")
                elif status_data['status'] == 'failed':
                    error = status_data.get('error', 'Unknown error')
                    raise ValueError(f"Replicate prediction {pred_id} failed: {error}")
                elif status_data['status'] == 'canceled':
                    raise ValueError(f"Replicate prediction {pred_id} was canceled")
                else:
                    polls += 1
                    if polls % 12 == 0:  # Log every minute
                        print(f"Prediction {pred_id[:8]}... still processing (status: {status_data['status']})")
                    time.sleep(5)
            
            if not completed:
                raise ValueError(f"Prediction {pred_id} timed out after {max_polls * 5} seconds")
        
        print(f"All {len(video_urls)} predictions completed")
        
        # Step 4: Download video chunks from Replicate
        print("Step 4: Downloading video chunks from Replicate...")
        video_chunk_paths = []
        for i, video_url in enumerate(video_urls):
            chunk_path = tmpdir_path / f"video_chunk_{i}.mp4"
            response = requests.get(video_url, timeout=300, stream=True)
            response.raise_for_status()
            with open(chunk_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            video_chunk_paths.append(chunk_path)
            print(f"Downloaded video chunk {i+1}/{len(video_urls)}")
        
        # Step 5: Stitch video chunks together
        print("Step 5: Stitching video chunks together...")
        concat_file = tmpdir_path / "concat.txt"
        with open(concat_file, 'w') as f:
            for chunk_path in video_chunk_paths:
                abs_path = chunk_path.resolve()
                f.write(f"file '{abs_path}'\n")
        
        temp_video = tmpdir_path / "temp_video.mp4"
        subprocess.run([
            'ffmpeg', '-f', 'concat', '-safe', '0',
            '-i', str(concat_file),
            '-c', 'copy',
            '-y', str(temp_video)
        ], capture_output=True, text=True, check=True)
        
        # Step 6: Merge with original audio
        print("Step 6: Merging with original audio...")
        final_video = tmpdir_path / "final.mp4"
        subprocess.run([
            'ffmpeg', '-i', str(temp_video),
            '-i', str(audio_path),
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-y', str(final_video)
        ], capture_output=True, text=True, check=True)
        
        # Step 7: Upload final video to R2
        print(f"Step 7: Uploading final video to R2: {output_key}")
        upload_to_r2(str(final_video), output_key, r2_config, content_type='video/mp4')
        
        # Construct public URL
        if r2_config['public_url']:
            base_url = r2_config['public_url'].rstrip('/')
            if not base_url.startswith('http://') and not base_url.startswith('https://'):
                base_url = f"https://{base_url}"
            public_url = f"{base_url}/{output_key.lstrip('/')}"
        else:
            public_url = f"https://pub-{r2_config['account_id']}.r2.dev/{r2_config['bucket_name']}/{output_key.lstrip('/')}"
        
        print(f"Full pipeline completed successfully: {public_url}")
        
        return {
            'status': 'COMPLETED',
            'output': {
                'video_url': public_url,
                'output_key': output_key
            }
        }

def split_audio_handler(input_data, r2_config):
    """Handle audio splitting mode"""
    audio_key = input_data['audio_key']
    chunk_duration = input_data.get('chunk_duration', 25)
    
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
            
            # Construct public URL - ensure it has https:// protocol
            if r2_config['public_url']:
                public_url = r2_config['public_url'].rstrip('/')
                # Add https:// if missing
                if not public_url.startswith('http://') and not public_url.startswith('https://'):
                    public_url = f"https://{public_url}"
                chunk_url = f"{public_url}/{chunk_key.lstrip('/')}"
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
        r2_account_id = input_data.get('r2_account_id')
        r2_access_key_id = input_data.get('r2_access_key_id')
        r2_secret_access_key = input_data.get('r2_secret_access_key')
        r2_bucket_name = input_data.get('r2_bucket_name')
        
        # Validate R2 credentials (skip if using test/dummy credentials)
        if not r2_account_id or not r2_access_key_id or not r2_secret_access_key or not r2_bucket_name:
            error_msg = "Missing R2 credentials in job input"
            print(f"ERROR: {error_msg}")
            return {
                'status': 'FAILED',
                'error': error_msg
            }
        
        # Check if using test/dummy credentials
        if 'test' in r2_account_id.lower() or 'test' in r2_bucket_name.lower():
            error_msg = "Invalid R2 credentials: test/dummy credentials detected"
            print(f"ERROR: {error_msg}")
            return {
                'status': 'FAILED',
                'error': error_msg
            }
        
        r2_config = {
            'account_id': r2_account_id,
            'access_key_id': r2_access_key_id,
            'secret_access_key': r2_secret_access_key,
            'bucket_name': r2_bucket_name,
            'public_url': input_data.get('r2_public_url', '')
        }
        
        # Handle different modes
        if mode == 'generate_and_stitch':
            return generate_and_stitch_handler(input_data, r2_config)
        elif mode == 'split_audio':
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
            
            # Construct public URL - ensure it has https:// protocol
            if r2_config['public_url']:
                base_url = r2_config['public_url'].rstrip('/')
                # Add https:// if missing
                if not base_url.startswith('http://') and not base_url.startswith('https://'):
                    base_url = f"https://{base_url}"
                public_url = f"{base_url}/{output_key.lstrip('/')}"
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
def runpod_handler(job):
    """RunPod SDK handler function - this is called by RunPod Serverless"""
    try:
        # RunPod SDK passes job data directly
        # job structure: {'id': '...', 'input': {...}}
        job_input = job.get('input', {})
        
        # Process using our handler function
        # The handler expects event format: {'input': {...}}
        event = {'input': job_input}
        result = handler(event)
        
        # RunPod SDK expects the result to be returned directly
        # If result has 'output', return that, otherwise return the whole result
        if isinstance(result, dict) and 'output' in result:
            return result['output']
        return result
    except Exception as e:
        error_msg = f"Handler error: {str(e)}"
        print(f"ERROR: {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            'error': error_msg
        }

if __name__ == '__main__':
    if USE_RUNPOD_SDK:
        # Use RunPod SDK (recommended for Serverless)
        print("Starting RunPod serverless worker with SDK...")
        runpod.serverless.start({"handler": runpod_handler})
    else:
        # Fallback: stdin/stdout mode (for testing or non-SDK environments)
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
            import traceback
            traceback.print_exc()
            sys.exit(1)


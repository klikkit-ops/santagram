# RunPod Setup Guide for Video Stitching

This guide will help you set up a RunPod endpoint to handle video stitching for long videos (>30 seconds).

## Overview

RunPod is used to stitch multiple video chunks together using ffmpeg. This is cost-effective compared to running ffmpeg in serverless functions.

**What RunPod does:**
1. Downloads video chunks and full audio from Cloudflare R2
2. Concatenates video chunks using ffmpeg
3. Merges the concatenated video with the full audio
4. Uploads the final stitched video back to R2

## Prerequisites

- RunPod account (sign up at https://www.runpod.io/)
- Cloudflare R2 credentials configured
- Basic understanding of Docker/containers (helpful but not required)

## Step 1: Create RunPod Account and Get API Key

1. Go to https://www.runpod.io/ and sign up
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Give it a name (e.g., "Santagram Video Stitching")
5. Copy the API key immediately (you won't see it again)
6. Add to your `.env.local`:
   ```bash
   RUNPOD_API_KEY=your-runpod-api-key-here
   ```

## Step 2: Create a RunPod Serverless Endpoint

### Option A: Import from GitHub (Recommended - Easier)

1. Go to **Serverless** in the left sidebar (you should see "Deploy a New Serverless Endpoint" page)
2. Click **"Connect GitHub"** button in the "Import GitHub Repository" section
3. Authorize RunPod to access your GitHub repositories
4. After connecting, you'll see your repositories listed
5. Select your `santagram` repository (or create a new repo for the stitcher)
6. RunPod will automatically:
   - Detect your `Dockerfile`
   - Build the Docker image
   - Deploy it as a serverless endpoint
7. Configure settings:
   - **Name**: `santagram-video-stitcher`
   - **GPU Type**: Not required for ffmpeg - select CPU-only or the cheapest option
   - **Container Disk**: 10-20 GB should be sufficient
   - **Timeout**: Set to at least 600 seconds (10 minutes) for longer videos
8. Click **Deploy**

**Advantages of GitHub approach:**
- ✅ No need to build/push Docker images manually
- ✅ Automatic builds when you push code
- ✅ Version control built-in
- ✅ Easier to update (just push to GitHub)

### Option B: Import from Docker Registry (If you prefer Docker)

1. Go to **Serverless** in the left sidebar
2. Click on **"Import from Docker Registry"** card (the one with the Docker whale icon)
3. You'll be prompted to configure:
   - **Docker Image**: Enter your Docker image name (e.g., `your-username/santagram-video-stitcher:latest`)
   - **Registry**: Select where your image is hosted (Docker Hub, GitHub Container Registry, etc.)
   - **Name**: `santagram-video-stitcher`
   - **GPU Type**: Not required for ffmpeg - select CPU-only or the cheapest option
   - **Container Disk**: 10-20 GB should be sufficient
   - **Timeout**: Set to at least 600 seconds (10 minutes) for longer videos
4. Click **Deploy**

**Note**: You'll need to build and push your Docker image first (see Step 4 below).

## Step 3: Prepare Your Code for RunPod

### If Using GitHub (Recommended):

1. Create a new directory in your `santagram` repository for the RunPod handler:
   ```bash
   mkdir runpod-stitcher
   cd runpod-stitcher
   ```

2. Create the files below in this directory

3. Commit and push to GitHub:
   ```bash
   git add runpod-stitcher/
   git commit -m "Add RunPod video stitcher handler"
   git push
   ```

### If Using Docker Registry:

Follow the instructions in Step 4 to build and push your image.

---

## Step 3a: Create Docker Image Files

You'll need a Docker image that:
- Has ffmpeg installed
- Can download from R2 (S3-compatible)
- Can upload to R2
- Has Python or Node.js for the handler

### Example Dockerfile:

```dockerfile
FROM python:3.11-slim

# Install ffmpeg and AWS CLI (for S3/R2 access)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    awscli \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install boto3 requests

# Copy handler script
COPY handler.py /handler.py

# Set working directory
WORKDIR /

# Run handler
CMD ["python", "/handler.py"]
```

### Example Handler Script (handler.py):

```python
import json
import subprocess
import boto3
import os
import tempfile
from pathlib import Path

def download_from_r2(key, local_path):
    """Download file from R2"""
    s3 = boto3.client(
        's3',
        endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY']
    )
    s3.download_file(os.environ['R2_BUCKET_NAME'], key, local_path)

def upload_to_r2(local_path, key):
    """Upload file to R2"""
    s3 = boto3.client(
        's3',
        endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY']
    )
    s3.upload_file(local_path, os.environ['R2_BUCKET_NAME'], key)

def handler(event):
    """Main handler function"""
    input_data = event.get('input', {})
    
    video_chunks = input_data['video_chunks']  # Array of R2 keys
    audio_key = input_data['audio_key']
    output_key = input_data['output_key']
    
    # Environment variables from input
    os.environ['R2_ACCOUNT_ID'] = input_data['r2_account_id']
    os.environ['R2_ACCESS_KEY_ID'] = input_data['r2_access_key_id']
    os.environ['R2_SECRET_ACCESS_KEY'] = input_data['r2_secret_access_key']
    os.environ['R2_BUCKET_NAME'] = input_data['r2_bucket_name']
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir_path = Path(tmpdir)
        
        # Download all video chunks
        chunk_paths = []
        for i, chunk_key in enumerate(video_chunks):
            chunk_path = tmpdir_path / f"chunk_{i}.mp4"
            download_from_r2(chunk_key, str(chunk_path))
            chunk_paths.append(chunk_path)
        
        # Download audio
        audio_path = tmpdir_path / "audio.mp3"
        download_from_r2(audio_key, str(audio_path))
        
        # Create concat file for ffmpeg
        concat_file = tmpdir_path / "concat.txt"
        with open(concat_file, 'w') as f:
            for chunk_path in chunk_paths:
                f.write(f"file '{chunk_path}'\n")
        
        # Step 1: Concatenate video chunks
        temp_video = tmpdir_path / "temp_video.mp4"
        subprocess.run([
            'ffmpeg', '-f', 'concat', '-safe', '0',
            '-i', str(concat_file),
            '-c', 'copy',
            '-y', str(temp_video)
        ], check=True)
        
        # Step 2: Merge video with audio
        final_video = tmpdir_path / "final.mp4"
        subprocess.run([
            'ffmpeg', '-i', str(temp_video),
            '-i', str(audio_path),
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-y', str(final_video)
        ], check=True)
        
        # Upload final video to R2
        upload_to_r2(str(final_video), output_key)
        
        # Return success
        return {
            'status': 'COMPLETED',
            'output': {
                'video_url': f"https://{os.environ.get('R2_PUBLIC_URL', 'blob.santagram.app')}/{output_key}"
            }
        }

# RunPod handler entry point
if __name__ == '__main__':
    import sys
    event = json.loads(sys.stdin.read())
    result = handler(event)
    print(json.dumps(result))
```

## Step 4: Build and Deploy Docker Image (Only if using Docker Registry)

**Skip this step if you're using GitHub (Option A in Step 2)**

1. Navigate to your `runpod-stitcher` directory (created in Step 3)

2. Build the Docker image:
   ```bash
   docker build -t santagram-video-stitcher .
   ```

3. Push to a container registry:

   **Option A: Docker Hub**
   ```bash
   docker tag santagram-video-stitcher your-dockerhub-username/santagram-video-stitcher:latest
   docker login
   docker push your-dockerhub-username/santagram-video-stitcher:latest
   ```

   **Option B: GitHub Container Registry**
   ```bash
   docker tag santagram-video-stitcher ghcr.io/your-username/santagram-video-stitcher:latest
   echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin
   docker push ghcr.io/your-username/santagram-video-stitcher:latest
   ```

4. Note the full image path (e.g., `your-username/santagram-video-stitcher:latest`) - you'll need this in Step 2 Option B

## Step 5: Configure RunPod Endpoint (After Deployment)

After deploying your endpoint in Step 2, you can configure additional settings:

1. **Resource Requirements** (set during deployment):
   - **GPU Type**: Select CPU-only or cheapest option (ffmpeg doesn't need GPU)
   - **Container Disk**: 10-20 GB
   - **Timeout**: Set to at least 600 seconds (10 minutes) for longer videos

2. **Environment Variables**:
   - These are passed via the job input from your code, so you don't need to set them in RunPod
   - The handler script receives R2 credentials in the job input

3. **Test the Endpoint**:
   - After deployment, you can test it from the RunPod dashboard
   - Or wait for your first video generation to trigger it

## Step 6: Get Endpoint ID

1. After creating the endpoint, copy the **Endpoint ID**
2. Add to your `.env.local`:
   ```bash
   RUNPOD_ENDPOINT_ID=your-endpoint-id-here
   ```

   **Note**: If using RunPod Serverless, the endpoint ID format is different. Check the RunPod dashboard for the exact ID format.

## Step 7: Update Code if Needed

The code in `lib/runpod-stitcher.ts` should work with RunPod Serverless. If you're using a different RunPod setup, you may need to adjust the API calls.

### For RunPod Serverless:

The endpoint URL format is:
```
https://api.runpod.io/v2/{endpoint_id}/run
```

### For RunPod Pods:

You'll need to use the Pod API instead. Check RunPod documentation for the correct endpoint format.

## Step 8: Test the Setup

1. Create a test order with a long audio file (>30 seconds)
2. Monitor the RunPod dashboard to see jobs being created
3. Check logs in RunPod to debug any issues
4. Verify the final video is uploaded to R2

## Troubleshooting

### Issue: "Endpoint not found"
- **Solution**: Verify `RUNPOD_ENDPOINT_ID` is correct and the endpoint is active

### Issue: "Authentication failed"
- **Solution**: Check `RUNPOD_API_KEY` is correct and has proper permissions

### Issue: "ffmpeg command failed"
- **Solution**: Check RunPod logs for the exact error. Common issues:
  - Missing codecs (install `ffmpeg` with codecs)
  - Insufficient disk space
  - Invalid video format

### Issue: "R2 upload/download failed"
- **Solution**: Verify R2 credentials are passed correctly in the job input

## Alternative: Use RunPod Template

RunPod may have pre-built templates for video processing. Check the **Templates** section in the RunPod dashboard for:
- "Video Processing"
- "ffmpeg"
- "Media Conversion"

These templates can save you from building a custom Docker image.

## Cost Optimization

- **Use RunPod Serverless**: Pay only for execution time
- **Set appropriate timeout**: Don't set it too high to avoid unnecessary costs
- **Monitor usage**: Check RunPod dashboard regularly for unexpected charges
- **Use CPU-only instances**: No need for GPU for ffmpeg operations

## Next Steps

1. Test with a short video first (2-3 chunks)
2. Monitor execution time and costs
3. Optimize ffmpeg parameters if needed
4. Set up alerts for failed jobs

## Support

- RunPod Documentation: https://docs.runpod.io/
- RunPod Discord: Check RunPod website for community support
- Cloudflare R2 Documentation: https://developers.cloudflare.com/r2/


# RunPod Video Stitcher

This is a RunPod serverless endpoint for stitching video chunks together with audio.

## What it does

1. Downloads multiple video chunks from Cloudflare R2
2. Concatenates them using ffmpeg
3. Merges the concatenated video with the full audio track
4. Uploads the final video back to R2

## Usage

This endpoint is called automatically by the main application when processing videos longer than 30 seconds.

## Requirements

- Python 3.11+
- ffmpeg
- boto3 (for R2/S3 access)
- RunPod serverless endpoint

## Environment

The handler receives R2 credentials via the job input, so no environment variables need to be set in RunPod.


#!/bin/bash
# Simple test using the exact format from RunPod dashboard

ENDPOINT_ID="pjb7pubaju2fh8"
API_KEY="${RUNPOD_API_KEY}"

if [ -z "$API_KEY" ]; then
    echo "ERROR: RUNPOD_API_KEY environment variable is not set"
    echo "Set it with: export RUNPOD_API_KEY=your_key_here"
    exit 1
fi

echo "Testing RunPod endpoint: $ENDPOINT_ID"
echo ""

# Test with simple prompt (like RunPod dashboard example)
echo "=== Test 1: Simple Request (RunPod dashboard format) ==="
curl -X POST "https://api.runpod.ai/v2/$ENDPOINT_ID/run" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"input":{"prompt": "test"}}'

echo ""
echo ""

# Test with our audio splitting format
echo "=== Test 2: Audio Splitting Request (our format) ==="
curl -X POST "https://api.runpod.ai/v2/$ENDPOINT_ID/run" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "input": {
      "mode": "split_audio",
      "audio_key": "audio/test.mp3",
      "chunk_duration": 10,
      "r2_account_id": "test",
      "r2_access_key_id": "test",
      "r2_secret_access_key": "test",
      "r2_bucket_name": "test",
      "r2_public_url": "https://blob.santagram.app"
    }
  }'

echo ""

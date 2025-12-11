# Testing RunPod Endpoint

## Quick Test (Local - Recommended First)

Test the RunPod endpoint directly from your terminal:

```bash
# 1. Set your RunPod API key (get it from RunPod Dashboard → Settings → API Keys)
export RUNPOD_API_KEY=your_actual_api_key_here

# 2. Run the test script
./test-runpod-simple.sh
```

**What to look for:**
- ✅ **Success**: You should see a JSON response with a job ID like `{"id": "abc123", ...}`
- ❌ **404 Error**: If you see `{"message":"Not Found"}`, the endpoint isn't accessible

## Test in Production (Full Flow)

1. **Wait for Vercel to redeploy** (usually 1-2 minutes after pushing to GitHub)

2. **Create a test order:**
   - Go to your app: `https://santagram.app` (or your domain)
   - Fill out the form with a child's name
   - Complete the checkout (use Stripe test mode)
   - You'll be redirected to the success page

3. **Check Vercel logs:**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for these log messages:
     - `[splitAudioWithRunPod] Starting audio splitting process`
     - `[splitAudioWithRunPod] Trying domain: api.runpod.ai`
     - `[splitAudioWithRunPod] Trying domain: api.runpod.io`
     - Success: `[splitAudioWithRunPod] Domain X responded (status: 200)`
     - Failure: `[splitAudioWithRunPod] Domain X returned 404`

4. **Check RunPod dashboard:**
   - Go to RunPod Dashboard → Serverless → Your endpoint
   - Click on "Requests" or "Logs" tab
   - You should see incoming requests if the endpoint is accessible

## What Success Looks Like

If everything works, you'll see in Vercel logs:
```
[splitAudioWithRunPod] Trying domain: api.runpod.ai
[splitAudioWithRunPod] Domain api.runpod.ai responded (status: 200)
[splitAudioWithRunPod] RunPod job submitted on api.runpod.ai: abc123
[splitAudioWithRunPod] Job status: PROCESSING (attempt 1/60)
[splitAudioWithRunPod] Job status: COMPLETED (attempt 2/60)
[splitAudioWithRunPod] Audio split into 6 chunks
```

## What Failure Looks Like

If the endpoint isn't accessible:
```
[splitAudioWithRunPod] Trying domain: api.runpod.ai
[splitAudioWithRunPod] Domain api.runpod.ai returned 404, trying next...
[splitAudioWithRunPod] Trying domain: api.runpod.io
[splitAudioWithRunPod] Domain api.runpod.io returned 404, trying next...
Error: RunPod endpoint not accessible on any domain
```

## Troubleshooting

### If you get 404 on both domains:

1. **Check endpoint status in RunPod:**
   - Go to RunPod Dashboard → Serverless → Your endpoint
   - Make sure status is "Ready" (green dot)
   - If it says "Paused" or "Stopped", activate it

2. **Verify endpoint ID:**
   - In RunPod Dashboard, click on your endpoint
   - Look at the URL: `console.runpod.io/serverless/user/endpoint/{ENDPOINT_ID}`
   - The `{ENDPOINT_ID}` should match your `RUNPOD_ENDPOINT_ID` in Vercel

3. **Check API key permissions:**
   - RunPod Dashboard → Settings → API Keys
   - Make sure your API key has "Serverless" permissions
   - Try creating a new API key if needed

4. **Test directly in RunPod dashboard:**
   - Go to your endpoint → "Quick start" tab
   - Copy the cURL command shown
   - Run it in your terminal (replace `YOUR_API_KEY`)
   - If this works, the endpoint is fine - the issue is with our code
   - If this fails, the endpoint itself has an issue

## Manual cURL Test

You can also test manually:

```bash
# Replace YOUR_API_KEY with your actual key
curl -X POST https://api.runpod.ai/v2/pjb7pubaju2fh8/run \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{"input":{"prompt": "test"}}'
```

Or try with `api.runpod.io`:
```bash
curl -X POST https://api.runpod.io/v2/pjb7pubaju2fh8/run \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{"input":{"prompt": "test"}}'
```


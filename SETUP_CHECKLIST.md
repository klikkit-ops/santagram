# Setup Checklist - Video Trunking & R2 Migration

## ✅ Completed Steps

- [x] RunPod endpoint created and configured
- [x] RunPod API key added to Vercel
- [x] RunPod endpoint ID added to Vercel

## 🔧 Required Next Steps

### 1. Database Migration (CRITICAL)

Run this SQL in your Supabase SQL Editor to add the new columns:

```sql
-- Add video_chunks and stitching_status columns to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS video_chunks JSONB,
  ADD COLUMN IF NOT EXISTS stitching_status TEXT;
```

**Why**: These columns are required for chunked video generation tracking.

### 2. Verify All Environment Variables in Vercel

Make sure all these are set in your Vercel project settings:

**Cloudflare R2:**
- ✅ `CLOUDFLARE_R2_ACCOUNT_ID`
- ✅ `CLOUDFLARE_R2_ACCESS_KEY_ID`
- ✅ `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- ✅ `CLOUDFLARE_R2_BUCKET_NAME` (should be `santagram`)
- ✅ `CLOUDFLARE_R2_PUBLIC_URL` (should be `https://blob.santagram.app`)

**RunPod:**
- ✅ `RUNPOD_API_KEY`
- ✅ `RUNPOD_ENDPOINT_ID`

**Other Required:**
- ✅ `REPLICATE_API_TOKEN`
- ✅ `ELEVENLABS_API_KEY`
- ✅ `RESEND_API_KEY`
- ✅ `EMAIL_FROM`
- ✅ Stripe keys
- ✅ Supabase keys

### 3. Test the Setup

#### Option A: Test with Short Video (<30s)
1. Create a test order with a short script
2. Should use single video generation (existing flow)
3. Verify video is stored in R2
4. Check email is sent

#### Option B: Test with Long Video (>30s)
1. Create a test order with a longer script (>30 seconds of audio)
2. Should trigger chunked generation
3. Monitor:
   - Audio chunks created in R2
   - Multiple Replicate predictions started
   - RunPod stitching job triggered
   - Final video in R2
4. Check email with final video link

### 4. Monitor Logs

Watch for errors in:
- **Vercel Function Logs**: Check for R2 upload/download issues
- **RunPod Dashboard**: Check for job failures or errors
- **Supabase Logs**: Check for database errors

### 5. Verify R2 Access

Test that files are accessible:
- Check R2 bucket in Cloudflare dashboard
- Verify public URLs work (e.g., `https://blob.santagram.app/audio/test.mp3`)

## 🐛 Common Issues to Watch For

1. **R2 Authentication Errors**
   - Check R2 credentials are correct
   - Verify bucket name matches

2. **RunPod Job Failures**
   - Check RunPod endpoint is active
   - Verify handler.py is working correctly
   - Check RunPod logs for ffmpeg errors

3. **Audio Duration Detection**
   - Current implementation uses estimation
   - May need adjustment for accuracy

4. **Video Chunking**
   - Audio splitting is currently a placeholder
   - Actual splitting will happen in RunPod or needs implementation

## 📝 Notes

- The `audio-utils.ts` file currently uses estimation for audio duration
- Audio chunking returns placeholder URLs - actual splitting needs to be implemented
- RunPod handler expects R2 keys (not full URLs) in the job input
- Make sure RunPod endpoint has proper timeout (600+ seconds)

## 🚀 Ready to Test?

Once you've completed the database migration and verified environment variables, you can test by creating a new order through your app!


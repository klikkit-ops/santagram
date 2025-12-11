# Environment Variables for Santa Message App

Copy the following variables to your `.env.local` file:

```bash
# Base URL (for redirect URLs)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# HeyGen
HEYGEN_API_KEY=your-heygen-api-key
# Optional: Custom Santa avatar/voice IDs
# HEYGEN_SANTA_AVATAR_ID=your-custom-santa-avatar-id
# HEYGEN_SANTA_VOICE_ID=your-custom-santa-voice-id

# Resend
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=Santa <santa@santagram.app>

# Cloudflare R2 (Storage)
CLOUDFLARE_R2_ACCOUNT_ID=your-r2-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_PUBLIC_URL=https://your-public-r2-domain.com

# RunPod (Video Processing)
RUNPOD_API_KEY=your-runpod-api-key
RUNPOD_ENDPOINT_ID=your-runpod-endpoint-id

# Replicate (Video Generation)
REPLICATE_API_TOKEN=your-replicate-api-token

# ElevenLabs (Audio Generation)
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

## Supabase Table Schema

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_session_id TEXT UNIQUE,
  email TEXT NOT NULL,
  customer_email TEXT,
  child_name TEXT NOT NULL,
  child_age INTEGER,
  child_gender TEXT,
  personalization JSONB,
  message_type TEXT,
  status TEXT DEFAULT 'pending',
  heygen_video_id TEXT,
  replicate_prediction_id TEXT,
  audio_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Allow all for service role" ON orders FOR ALL USING (true);
```

**If you already have the orders table, run this migration to add missing columns:**

```sql
-- Add missing columns if they don't exist
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS replicate_prediction_id TEXT,
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS video_chunks JSONB,
  ADD COLUMN IF NOT EXISTS stitching_status TEXT;
```

## Stripe Webhook

Set up a webhook in Stripe Dashboard pointing to:
`https://your-domain.com/api/webhook`

Events to listen for:
- `checkout.session.completed`

## Email Forwarding

All emails sent through Resend are automatically BCC'd to `jake005588@gmail.com` (configured in `lib/video-storage.ts`).

### Optional: Forward Incoming Emails (if Resend supports receiving)

If you want to forward incoming emails received by Resend to `jake005588@gmail.com`:

1. Go to Resend Dashboard > Settings > Webhooks
2. Add a webhook URL: `https://your-domain.com/api/resend-webhook`
3. Select the event: `email.received` (if available)

The webhook endpoint is already set up at `/api/resend-webhook` and will automatically forward any incoming emails to `jake005588@gmail.com`.

## Cloudflare R2 Storage Migration

**All storage operations now use Cloudflare R2 instead of Vercel Blob.**

### R2 Setup:
1. Create a Cloudflare R2 bucket
2. Generate API tokens with read/write permissions
3. Set up a custom domain (optional) for public access
4. Add all R2 environment variables to your `.env.local`

### Migration Notes:
- All audio files are stored in R2 at `audio/` prefix
- All video files are stored in R2 at `videos/` prefix
- The `@vercel/blob` package has been removed
- R2 is the single source of truth for all storage operations

## Video Trunking (Long Videos > 30 seconds)

For videos longer than 30 seconds:
1. Audio is automatically split into ~30-second chunks
2. Video chunks are generated in parallel using Replicate
3. Chunks are stitched together using RunPod (cost-effective ffmpeg processing)
4. Final video is stored in R2

### Database Schema Updates:
The `orders` table includes:
- `video_chunks` (JSONB): Array of prediction IDs for chunked generation
- `stitching_status` (TEXT): Status of video stitching (pending, processing, completed, failed)

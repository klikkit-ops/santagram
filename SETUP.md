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
  ADD COLUMN IF NOT EXISTS audio_url TEXT;
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

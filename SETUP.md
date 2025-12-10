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
```

## Supabase Table Schema

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_session_id TEXT UNIQUE,
  email TEXT NOT NULL,
  child_name TEXT NOT NULL,
  child_age INTEGER,
  child_gender TEXT,
  personalization JSONB,
  message_type TEXT,
  status TEXT DEFAULT 'pending',
  heygen_video_id TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Allow all for service role" ON orders FOR ALL USING (true);
```

## Stripe Webhook

Set up a webhook in Stripe Dashboard pointing to:
`https://your-domain.com/api/webhook`

Events to listen for:
- `checkout.session.completed`

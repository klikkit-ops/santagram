# Resend Email Receiving Setup Guide

This guide will help you set up email receiving for `*@santagram.app` so that all incoming emails are forwarded to `jake005588@gmail.com`.

## Prerequisites

1. A Resend account with API access
2. Domain `santagram.app` added to your Resend account
3. DNS access to configure MX records for `santagram.app`

## Step-by-Step Setup

### 1. Add Domain to Resend (if not already done)

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter `santagram.app`
4. Follow the DNS configuration instructions to add:
   - **SPF record** (TXT)
   - **DKIM record** (TXT)
   - **DMARC record** (TXT)

### 2. Configure Email Receiving

1. Go to [Resend Dashboard > Receiving](https://resend.com/receiving)
2. Click **"Add Inbound Domain"** or **"Configure Receiving"**
3. Select `santagram.app` as the domain
4. Resend will provide **MX records** that you need to add to your DNS

### 3. Add MX Records to Your DNS

Add the MX records provided by Resend to your domain's DNS settings. These typically look like:

```
Type: MX
Name: @ (or santagram.app)
Priority: 10
Value: mx.resend.com (or similar - use the exact value from Resend)
```

**Where to add DNS records:**
- If using Cloudflare: Go to your domain's DNS settings in Cloudflare
- If using another DNS provider: Go to your domain registrar's DNS settings

### 4. Set Up Webhook

1. Go to [Resend Dashboard > Webhooks](https://resend.com/webhooks)
2. Click **"Add Webhook"**
3. Enter the webhook URL: `https://santagram.app/api/resend-webhook`
4. Select the event: **`email.received`**
5. Save the webhook

### 5. Verify Setup

1. Wait for DNS propagation (can take up to 48 hours, usually much faster)
2. Check Resend Dashboard > Receiving to see if the domain is verified
3. Send a test email to `test@santagram.app` from an external email address
4. Check your Vercel logs to see if the webhook is being called
5. Check `jake005588@gmail.com` to see if the email was forwarded

## Troubleshooting

### Emails Not Being Received

1. **Check DNS Records:**
   - Verify MX records are correctly configured
   - Use a DNS checker tool like [MXToolbox](https://mxtoolbox.com/) to verify MX records
   - Ensure DNS has propagated (can take up to 48 hours)

2. **Check Resend Dashboard:**
   - Go to Resend Dashboard > Receiving
   - Verify the domain shows as "Active" or "Verified"
   - Check for any error messages

3. **Check Webhook:**
   - Go to Resend Dashboard > Webhooks
   - Verify the webhook URL is correct: `https://santagram.app/api/resend-webhook`
   - Check webhook logs for any errors
   - Test the webhook endpoint: `curl https://santagram.app/api/resend-webhook` (should return 200)

4. **Check Vercel Logs:**
   - Go to Vercel Dashboard > Your Project > Logs
   - Look for `[resend-webhook]` log entries
   - Check for any errors in webhook processing

5. **Test Webhook Manually:**
   ```bash
   curl -X POST https://santagram.app/api/resend-webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"email.received","data":{"from":"test@example.com","to":"test@santagram.app","subject":"Test","text":"Test email"}}'
   ```

### Webhook Not Being Called

1. Verify the webhook URL is accessible (should return 200 on GET request)
2. Check that the webhook is enabled in Resend dashboard
3. Ensure the event type `email.received` is selected
4. Check Resend webhook logs for delivery attempts

### Emails Not Being Forwarded

1. Check Vercel logs for `[resend-webhook]` entries
2. Verify `RESEND_API_KEY` environment variable is set correctly
3. Check that the email forwarding logic is working (see logs)
4. Verify `jake005588@gmail.com` is the correct forwarding address

## Current Implementation

The webhook endpoint at `/api/resend-webhook` will:
1. Receive incoming email events from Resend
2. Extract email content (from, to, subject, body)
3. Forward the email to `jake005588@gmail.com` with `[Forwarded from ...]` prefix
4. Preserve the original sender in the `replyTo` field

## Support

If you continue to have issues:
1. Check [Resend Receiving Documentation](https://resend.com/docs/receiving/introduction)
2. Contact Resend Support: [resend.com/support](https://resend.com/support)
3. Review Vercel logs for detailed error messages


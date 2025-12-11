# Stripe Production Mode Setup Checklist

This checklist will guide you through moving from Stripe test/sandbox mode to production mode.

## Prerequisites

- ✅ Your app is fully tested in test mode
- ✅ All features work correctly (payment, webhooks, video generation)
- ✅ You have a Stripe account with production access enabled
- ✅ Your domain is live and accessible (santagram.app)

---

## Step 1: Activate Stripe Account (if not already done)

- [ ] Log in to [Stripe Dashboard](https://dashboard.stripe.com)
- [ ] Complete account activation if prompted
- [ ] Verify your business information
- [ ] Add bank account details for payouts
- [ ] Complete identity verification (KYC) if required

---

## Step 2: Get Production API Keys

- [ ] Go to [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)
- [ ] Switch to **"Live mode"** (toggle in top right)
- [ ] Copy your **Live publishable key** (starts with `pk_live_...`)
- [ ] Reveal and copy your **Live secret key** (starts with `sk_live_...`)
- [ ] **IMPORTANT**: Keep these keys secure! Never commit them to Git.

---

## Step 3: Update Environment Variables in Vercel

- [ ] Go to [Vercel Dashboard > Your Project > Settings > Environment Variables](https://vercel.com/dashboard)
- [ ] Update `STRIPE_SECRET_KEY`:
  - Remove the old test key (`sk_test_...`)
  - Add your live secret key (`sk_live_...`)
  - Ensure it's set for **Production** environment
- [ ] Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`:
  - Remove the old test key (`pk_test_...`)
  - Add your live publishable key (`pk_live_...`)
  - Ensure it's set for **Production** environment
- [ ] **Keep test keys for Preview/Development environments** (optional but recommended for testing)

---

## Step 4: Set Up Production Webhook

- [ ] Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
- [ ] Make sure you're in **"Live mode"** (toggle in top right)
- [ ] Click **"Add endpoint"**
- [ ] Enter endpoint URL: `https://santagram.app/api/webhook`
- [ ] Select events to listen to:
  - ✅ `checkout.session.completed`
- [ ] Click **"Add endpoint"**
- [ ] Copy the **Signing secret** (starts with `whsec_...`)
- [ ] Update `STRIPE_WEBHOOK_SECRET` in Vercel:
  - Go to Vercel Dashboard > Environment Variables
  - Update `STRIPE_WEBHOOK_SECRET` with the new live webhook secret
  - Ensure it's set for **Production** environment

---

## Step 5: Test Webhook Endpoint

- [ ] In Stripe Dashboard > Webhooks, click on your production webhook
- [ ] Click **"Send test webhook"**
- [ ] Select `checkout.session.completed` event
- [ ] Click **"Send test webhook"**
- [ ] Check Vercel logs to verify the webhook is received and processed correctly
- [ ] Verify no errors appear in the webhook logs

---

## Step 6: Update Base URL (if needed)

- [ ] Verify `NEXT_PUBLIC_BASE_URL` in Vercel is set to `https://santagram.app`
- [ ] This ensures redirect URLs in Stripe checkout are correct
- [ ] Go to Vercel Dashboard > Environment Variables
- [ ] Update if needed (should already be correct)

---

## Step 7: Configure Stripe Checkout Settings

- [ ] Go to [Stripe Dashboard > Settings > Branding](https://dashboard.stripe.com/settings/branding)
- [ ] Upload your logo (optional but recommended)
- [ ] Set brand colors to match your site
- [ ] Go to [Stripe Dashboard > Settings > Payment methods](https://dashboard.stripe.com/settings/payment_methods)
- [ ] Enable payment methods you want to accept (Card is default)
- [ ] Configure any regional payment methods if needed

---

## Step 8: Set Up Email Receipts (Optional)

- [ ] Go to [Stripe Dashboard > Settings > Emails](https://dashboard.stripe.com/settings/emails)
- [ ] Configure receipt emails
- [ ] Customize email templates if desired
- [ ] Note: Your app already sends custom video emails via Resend, but Stripe receipts can be a backup

---

## Step 9: Configure Tax Settings (if applicable)

- [ ] Go to [Stripe Dashboard > Settings > Tax](https://dashboard.stripe.com/settings/tax)
- [ ] Review the "Multi-Currency Pricing Configuration" section below for detailed tax setup
- [ ] Enable Stripe Tax for automatic tax calculation (recommended for EU and US)
- [ ] Configure your business location and tax registration numbers
- [ ] Set up VAT registration if selling to EU customers
- [ ] Configure US sales tax nexus if applicable
- [ ] **Important**: Consult with a tax professional about your obligations

---

## Step 10: Set Up Payout Schedule

- [ ] Go to [Stripe Dashboard > Settings > Payouts](https://dashboard.stripe.com/settings/payouts)
- [ ] Configure payout schedule (daily, weekly, monthly, or manual)
- [ ] Verify bank account details are correct
- [ ] Set up email notifications for payouts

---

## Step 11: Enable Fraud Prevention

- [ ] Go to [Stripe Dashboard > Settings > Radar](https://dashboard.stripe.com/settings/radar)
- [ ] Review fraud prevention rules
- [ ] Configure rules based on your risk tolerance
- [ ] Enable 3D Secure (recommended for European customers)

---

## Step 12: Test a Real Payment (Small Amount)

- [ ] Use a real credit card (your own) to make a small test purchase
- [ ] Verify:
  - ✅ Payment processes successfully
  - ✅ Webhook fires and order is created
  - ✅ Video generation starts
  - ✅ Email is sent with video link
  - ✅ Video is accessible and plays correctly
- [ ] **Refund the test payment** after verification (if desired)

---

## Step 13: Monitor and Verify

- [ ] Go to [Stripe Dashboard > Payments](https://dashboard.stripe.com/payments)
- [ ] Verify payments are showing up correctly
- [ ] Check [Stripe Dashboard > Events](https://dashboard.stripe.com/events) for webhook events
- [ ] Monitor Vercel logs for any errors
- [ ] Set up Stripe email notifications for:
  - Failed payments
  - Disputes/chargebacks
  - Payouts

---

## Step 14: Update Code (if needed)

Review your code to ensure it handles production mode correctly:

- [ ] Verify `lib/stripe.ts` uses the environment variable correctly (already done)
- [ ] Check that webhook signature verification is enabled (already done in `app/api/webhook/route.ts`)
- [ ] Ensure error handling is in place for failed payments
- [ ] Verify redirect URLs use `NEXT_PUBLIC_BASE_URL` (already done)

---

## Step 15: Security Checklist

- [ ] ✅ Never commit API keys to Git (already in `.gitignore`)
- [ ] ✅ Use environment variables for all secrets
- [ ] ✅ Enable webhook signature verification (already implemented)
- [ ] ✅ Use HTTPS for all webhook endpoints (Vercel handles this)
- [ ] ✅ Regularly rotate API keys (best practice: every 90 days)
- [ ] ✅ Monitor for suspicious activity in Stripe Dashboard

---

## Step 16: Legal and Compliance

- [ ] Review and update Terms of Service
- [ ] Review and update Privacy Policy
- [ ] Ensure refund policy is clear
- [ ] Add business address and contact information
- [ ] Verify compliance with local payment regulations
- [ ] Set up proper business entity if required

---

## Step 17: Documentation

- [ ] Document your Stripe account details (securely)
- [ ] Save webhook endpoint URL and signing secret (securely)
- [ ] Note your payout schedule
- [ ] Document any custom configurations

---

## Post-Launch Monitoring

After going live, monitor:

- [ ] Payment success rate
- [ ] Webhook delivery success rate
- [ ] Failed payment reasons
- [ ] Chargeback/dispute rate
- [ ] Video generation success rate
- [ ] Customer support inquiries

---

## Rollback Plan

If something goes wrong:

1. **Immediate**: Switch environment variables back to test keys in Vercel
2. **Redeploy**: Trigger a new deployment in Vercel
3. **Investigate**: Check logs and Stripe Dashboard for errors
4. **Fix**: Address any issues before switching back to production

---

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe Status](https://status.stripe.com)
- [Stripe Dashboard](https://dashboard.stripe.com)

---

## Multi-Currency Pricing Configuration

Your app supports automatic currency detection and pricing for multiple countries. Here's the complete pricing structure:

### Supported Countries and Prices

| Country | Currency | Price | Stripe Amount (cents) |
|---------|----------|-------|----------------------|
| 🇬🇧 United Kingdom | GBP | £2.99 | 299 |
| 🇺🇸 United States | USD | $3.99 | 399 |
| 🇪🇺 Eurozone* | EUR | €3.49 | 349 |
| 🇨🇦 Canada | CAD | CA$4.99 | 499 |
| 🇦🇺 Australia | AUD | A$5.99 | 599 |
| 🇳🇿 New Zealand | NZD | NZ$6.49 | 649 |
| 🇨🇭 Switzerland | CHF | CHF 3.49 | 349 |
| 🇸🇪 Sweden | SEK | 39.99 kr | 3999 |
| 🇳🇴 Norway | NOK | 39.99 kr | 3999 |
| 🇩🇰 Denmark | DKK | 24.99 kr | 2499 |
| 🇵🇱 Poland | PLN | 14.99 zł | 1499 |
| 🇮🇳 India | INR | ₹299 | 29900 |
| 🇯🇵 Japan | JPY | ¥599 | 599 |
| 🇸🇬 Singapore | SGD | S$4.99 | 499 |
| 🇭🇰 Hong Kong | HKD | HK$29.99 | 2999 |
| 🇲🇽 Mexico | MXN | MX$69.99 | 6999 |
| 🇧🇷 Brazil | BRL | R$19.99 | 1999 |
| 🇿🇦 South Africa | ZAR | R69.99 | 6999 |

*Eurozone countries: Germany (DE), France (FR), Italy (IT), Spain (ES), Netherlands (NL), Belgium (BE), Austria (AT), Ireland (IE), Portugal (PT), Finland (FI), Greece (GR)

**Default currency**: GBP (£2.99) - used for countries not in the list above

### Stripe Multi-Currency Setup

- [ ] **Verify Stripe Account Supports All Currencies**
  - Go to [Stripe Dashboard > Settings > Business settings](https://dashboard.stripe.com/settings/business)
  - Check that your account can accept payments in all supported currencies
  - Some currencies may require additional verification or account setup

- [ ] **Enable Required Payment Methods**
  - Go to [Stripe Dashboard > Settings > Payment methods](https://dashboard.stripe.com/settings/payment_methods)
  - Ensure Cards are enabled (required for all currencies)
  - Consider enabling local payment methods for better conversion:
    - **Europe**: SEPA Direct Debit, iDEAL (Netherlands), Bancontact (Belgium)
    - **Asia**: Alipay, WeChat Pay (if applicable)
    - **Latin America**: OXXO (Mexico), Boleto (Brazil)

- [ ] **Configure Currency Conversion (if needed)**
  - Stripe automatically handles currency conversion
  - Review [Stripe's currency conversion documentation](https://stripe.com/docs/currencies/conversion)
  - Consider if you want to accept payments in customer's local currency or convert to your base currency

### Tax and VAT Considerations by Region

- [ ] **European Union (EU) - VAT**
  - If you're based in the EU or selling to EU customers, you may need to:
    - Register for VAT in applicable countries
    - Enable Stripe Tax for automatic VAT calculation
    - Display VAT-inclusive prices where required
  - Go to [Stripe Dashboard > Settings > Tax](https://dashboard.stripe.com/settings/tax)
  - Enable "Stripe Tax" for automatic tax calculation
  - Configure your business location and tax registration numbers

- [ ] **United States - Sales Tax**
  - If you have nexus in US states, enable Stripe Tax
  - Stripe can automatically calculate and collect sales tax
  - Configure your business address and nexus states

- [ ] **Other Countries**
  - Review tax obligations for each country you're selling to
  - Consult with a tax professional about international tax requirements
  - Consider using Stripe Tax for automatic calculation

### Testing Multi-Currency Payments

Before going live, test payments in different currencies:

- [ ] Test payment in GBP (base currency)
- [ ] Test payment in USD (most common)
- [ ] Test payment in EUR (European market)
- [ ] Test payment in a high-value currency (e.g., AUD, NZD)
- [ ] Test payment in a currency with different decimal places (e.g., JPY - no decimals)
- [ ] Verify currency detection works correctly:
  - Test from different IP addresses/locations
  - Verify correct currency is displayed
  - Verify correct amount is charged

### Currency Display and Formatting

Your app automatically:
- Detects user's country via IP geolocation
- Displays price in local currency
- Formats currency correctly (symbols, decimal places)
- Falls back to GBP if country not detected

**No additional Stripe configuration needed** - the app handles currency selection and formatting client-side.

### Monitoring Multi-Currency Payments

After going live, monitor:

- [ ] Payment distribution by currency
- [ ] Conversion rates for different currencies
- [ ] Failed payments by currency (some currencies may have higher failure rates)
- [ ] Refund requests by currency
- [ ] Currency conversion fees (if applicable)

---

## Quick Reference: Environment Variables to Update

```bash
# Production Stripe Keys (in Vercel Dashboard)
STRIPE_SECRET_KEY=sk_live_...          # Live secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Live publishable key
STRIPE_WEBHOOK_SECRET=whsec_...        # Live webhook signing secret
NEXT_PUBLIC_BASE_URL=https://santagram.app  # Production URL
```

---

## Testing Checklist

Before going fully live, test:

- [ ] Small real payment ($0.50 or minimum)
- [ ] Webhook receives and processes correctly
- [ ] Order is created in Supabase
- [ ] Video generation starts
- [ ] Email is sent with video link
- [ ] Video is accessible and plays
- [ ] Refund process (if needed)
- [ ] Error handling for failed payments

---

**Last Updated**: After completing all steps, mark this checklist as complete and save it securely.


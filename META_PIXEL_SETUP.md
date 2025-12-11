# Meta Pixel Purchase Event Setup Guide

## Issue: Purchase Event Not Showing in Conversion Events

Meta Pixel requires that **at least one Purchase event is actually fired and received** before it appears in the conversion events dropdown. The event needs to be tracked on your website first.

## Steps to Set Up Purchase Conversion Event

### Step 1: Verify Purchase Events Are Being Fired

1. **Test a Purchase**:
   - Complete a test purchase on your website
   - Go to the success page (`/success?session_id=...`)

2. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Look for: `[Meta Pixel] Purchase event tracked successfully`
   - Verify the event data (value, currency, etc.)

3. **Use Meta Pixel Helper**:
   - Install [Meta Pixel Helper Chrome Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
   - Visit your success page after a purchase
   - The extension should show a "Purchase" event firing
   - Click on it to see the event details

### Step 2: Check Events Manager - Test Events

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Select your Pixel: **SantaGram Pixel** (ID: 1190489765865173)
3. Click on **"Test Events"** tab
4. Perform a test purchase on your website
5. You should see the Purchase event appear in real-time in the Test Events feed
6. Verify the event shows:
   - Event Name: `Purchase`
   - Parameters: `value`, `currency`, `content_name`, etc.

### Step 3: Create Custom Conversion (If Needed)

If Purchase events are firing but not showing in the conversion events dropdown:

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Click **"Custom Conversions"** in the left menu
3. Click **"Create Custom Conversion"**
4. Configure:
   - **Event**: Select "Purchase"
   - **URL contains**: Leave empty or add `/success` if you want to be specific
   - **Name**: "Purchase - Santa Video"
5. Click **"Create"**

### Step 4: Set Up Conversion Event in Ads Manager

Once Purchase events are being received:

1. Go to [Meta Ads Manager](https://business.facebook.com/adsmanager)
2. When creating/editing an ad campaign:
   - Under "Conversion" section
   - Select your Pixel: **SantaGram Pixel**
   - The "Purchase" event should now appear in the dropdown
   - Select "Purchase" as your conversion event

## Troubleshooting

### Purchase Event Not Firing

**Check:**
1. Is the Meta Pixel code installed correctly? (Check `app/layout.tsx`)
2. Is the success page loading? (Check URL has `session_id` parameter)
3. Is the order status becoming 'paid'? (Check API response)
4. Are there any JavaScript errors in the console?

**Fix:**
- Verify the pixel ID is correct: `1190489765865173`
- Check that `fbq` is available: `console.log(window.fbq)` in browser console
- Ensure the success page is receiving order data with `status: 'paid'`

### Purchase Event Firing But Not Showing in Events Manager

**Possible Causes:**
1. **Domain Verification**: Your domain needs to be verified in Meta Business Manager
2. **Pixel Not Assigned**: Pixel needs to be assigned to your Business Manager
3. **Data Processing Delay**: Events can take up to 24 hours to appear in reports (but should show in Test Events immediately)

**Fix:**
1. Go to [Meta Business Settings](https://business.facebook.com/settings)
2. Navigate to **Brand Safety** → **Domains**
3. Add and verify your domain: `santagram.app`
4. Assign the pixel to your business

### Purchase Event Shows in Test Events But Not in Conversion Dropdown

**Solution:**
- This is normal! Meta needs to see multiple Purchase events over time before they become "active"
- Create a Custom Conversion instead (see Step 3 above)
- Or wait 24-48 hours for Meta to process and recognize the event pattern

## Testing the Purchase Event

### Quick Test Script

You can test the Purchase event directly in the browser console on your success page:

```javascript
// Check if Meta Pixel is loaded
console.log('fbq available:', typeof window.fbq !== 'undefined');

// Manually fire a test Purchase event
if (window.fbq) {
    window.fbq('track', 'Purchase', {
        value: 3.99,
        currency: 'USD',
        content_name: 'Personalized Santa Video Message',
        content_category: 'Video Message',
        content_ids: ['santa-video'],
        num_items: 1,
    });
    console.log('Test Purchase event fired!');
}
```

### Verify Event in Test Events

1. Open [Meta Events Manager → Test Events](https://business.facebook.com/events_manager2/list/pixel/1190489765865173/test_events)
2. Keep this tab open
3. Fire the test event (using script above or complete a purchase)
4. You should see the Purchase event appear within seconds

## Current Implementation

The Purchase event is automatically tracked when:
- User completes payment
- Order status becomes `'paid'`
- User is on the success page (`/success?session_id=...`)

The event includes:
- `value`: Purchase amount (from Stripe)
- `currency`: Currency code (USD, GBP, EUR, etc.)
- `content_name`: "Personalized Santa Video Message"
- `content_category`: "Video Message"
- `content_ids`: ['santa-video']
- `num_items`: 1

## Next Steps

1. ✅ Complete a test purchase
2. ✅ Verify event fires (check console + Pixel Helper)
3. ✅ Check Test Events in Events Manager
4. ✅ Wait for event to appear in conversion dropdown (or create Custom Conversion)
5. ✅ Use Purchase event in your ad campaigns

## Support Resources

- [Meta Pixel Documentation](https://www.facebook.com/business/help/952192354843755)
- [Meta Events Manager](https://business.facebook.com/events_manager2)
- [Meta Pixel Helper Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)


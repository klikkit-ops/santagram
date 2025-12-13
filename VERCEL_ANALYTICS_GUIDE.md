# Vercel Analytics Custom Events Guide

This guide explains how we're using Vercel Analytics custom events to gain valuable insights into user behavior and business metrics.

## Overview

We've implemented comprehensive event tracking throughout the SantaGram application using Vercel's custom events feature. This allows us to track user engagement, conversion funnel, and business metrics directly in the Vercel dashboard.

## Implementation

### Analytics Utility (`lib/analytics.ts`)

We've created a centralized analytics utility that provides:
- Type-safe event tracking
- Consistent event naming
- Convenience functions for common events
- Error handling to prevent tracking failures from breaking the app

### Tracked Events

#### 1. Engagement Events
- **`video_play`** - When users play the hero video
  - Data: `location` (hero, etc.)
- **`video_pause`** - When users pause the hero video
  - Data: `location`
- **`video_complete`** - When users watch video to completion
  - Data: `location`

#### 2. Navigation & CTA Events
- **`cta_click`** - When users click call-to-action buttons
  - Data: `location`, `button` (button identifier)
- **`navigation`** - General navigation events (future use)

#### 3. Form & Funnel Events
- **`form_start`** - When users begin the video creation form
  - Data: `source` (hero_quick_form, create_page_direct, etc.)
- **`form_step_complete`** - When users complete each form step
  - Data: `step` (1-4), `step_name` (child_details, personalization, etc.)
- **`form_abandon`** - When users leave the form incomplete
  - Data: `step`, `last_field`
- **`form_field_focus`** - When users focus on form fields (future use)

#### 4. Checkout Events
- **`checkout_initiated`** - When user clicks "Pay Now" button
  - Data: `currency`, `amount`, `message_type`
- **`checkout_completed`** - When payment successfully completes
  - Data: `currency`, `amount`, `order_id`
- **`checkout_failed`** - When checkout fails
  - Data: `reason`
- **`checkout_cancelled`** - When user cancels checkout

#### 5. Purchase & Conversion Events
- **`purchase`** - Successful purchase completion
  - Data: `currency`, `amount`, `message_type`
- **`video_generation_started`** - When video generation begins
  - Data: `order_id`
- **`video_generation_completed`** - When video generation completes
  - Data: `order_id`
- **`video_generation_failed`** - When video generation fails
  - Data: `order_id`, `reason`

#### 6. Video Viewing Events
- **`video_viewed`** - When user views their generated video
  - Data: `order_id`, `watched_percent` (if available)
- **`video_downloaded`** - When user downloads the video
  - Data: `order_id`
- **`video_shared`** - When user shares the video
  - Data: `order_id`, `method` (native_share, clipboard, etc.)

#### 7. Error Events
- **`error`** - Application errors
  - Data: `error_type`, `location`, `message`

## Viewing Events in Vercel Dashboard

1. **Navigate to Analytics**
   - Go to your Vercel dashboard
   - Select your project
   - Click on the **Analytics** tab

2. **View Events Panel**
   - Scroll down to the **Events** panel
   - You'll see a list of all tracked event names
   - Click on any event name to drill down into details

3. **Event Details**
   - View events organized by custom data properties
   - Filter and analyze event data
   - See event counts and trends over time

## Key Insights You Can Gain

### 1. **Conversion Funnel Analysis**
Track the user journey from landing to purchase:
- How many users start the form? (`form_start`)
- Where do they drop off? (`form_abandon` at different steps)
- What's the checkout completion rate? (`checkout_completed` vs `checkout_initiated`)
- Which CTA buttons perform best? (`cta_click` by location/button)

**Example Questions:**
- What percentage of users who start the form complete checkout?
- At which step do most users abandon the form?
- Do users who play the hero video convert better?

### 2. **Engagement Metrics**
Understand user engagement:
- Hero video engagement (`video_play`, `video_pause`, `video_complete`)
- CTA button performance (`cta_click` by location)
- Form completion rates by step

**Example Questions:**
- Does playing the hero video correlate with higher conversion?
- Which CTA locations drive the most conversions?
- How many users watch the hero video vs. scroll past?

### 3. **Business Metrics**
Track revenue and operational metrics:
- Purchase completion rates (`purchase` events)
- Average order value (analyze `purchase` amounts)
- Video generation success rate (`video_generation_completed` vs `failed`)
- Video engagement (`video_viewed`, `video_downloaded`, `video_shared`)

**Example Questions:**
- What's the video generation failure rate?
- How many users download vs. just view their videos?
- What percentage of customers share their videos?

### 4. **Product Insights**
Understand product usage:
- Most popular message types (`message_type` in purchase/checkout events)
- Preferred currencies (`currency` in purchase events)
- Form completion patterns (which fields are commonly filled)

**Example Questions:**
- Which message type is most popular?
- Do users who fill optional fields (achievements, interests) convert better?

### 5. **Error Tracking**
Identify issues:
- Checkout failures (`checkout_failed` with reasons)
- Video generation failures (`video_generation_failed`)
- Form errors (future implementation)

**Example Questions:**
- What's causing checkout failures?
- Are there patterns in video generation failures?

## Usage Examples

### Basic Event Tracking
```typescript
import { analytics } from '@/lib/analytics';

// Track a CTA click
analytics.trackCTAClick('hero', 'create_video_now');

// Track form step completion
analytics.trackFormStep(2, 'personalization');

// Track purchase
analytics.trackPurchase('USD', 3.99, 'christmas-morning');
```

### Custom Event Tracking
```typescript
import { trackEvent, EVENTS } from '@/lib/analytics';

// Track a custom event
trackEvent(EVENTS.VIDEO_PLAY, {
  location: 'hero',
  video_duration: 30
});
```

## Limitations (from Vercel Docs)

- Custom data properties are limited based on your plan
- Nested objects are not supported
- Allowed values: `string`, `number`, `boolean`, `null`
- Event names, keys, and values cannot exceed 255 characters each

## Best Practices

1. **Consistent Naming**: Use the centralized `analytics` utility functions for consistency
2. **Meaningful Data**: Include relevant context (location, step number, etc.)
3. **Privacy**: Never track personally identifiable information (PII)
4. **Error Handling**: Analytics failures won't break your app (already handled)
5. **Development**: Events are logged to console in development mode

## Next Steps

### Potential Additions:
1. **A/B Testing**: Track which variations perform better
2. **Time-to-Conversion**: Track time between events
3. **Geographic Insights**: Use IP-based location (if available)
4. **Device/Browser Tracking**: Track device types (mobile vs desktop)
5. **Returning User Tracking**: Identify repeat customers

### Advanced Analysis:
- Create custom dashboards in Vercel
- Export event data for deeper analysis
- Set up alerts for important events (checkout failures, etc.)
- Correlate events with business outcomes

## Resources

- [Vercel Analytics Custom Events Documentation](https://vercel.com/docs/analytics/custom-events)
- Analytics utility: `lib/analytics.ts`
- Implementation examples: `components/Hero.tsx`, `app/create/page.tsx`, `app/success/page.tsx`, `app/video/[orderId]/page.tsx`


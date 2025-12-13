/**
 * Analytics utility for tracking custom events with Vercel Analytics
 * 
 * This provides a type-safe wrapper around Vercel's track() function
 * for consistent event tracking throughout the application.
 * 
 * Usage:
 *   import { trackEvent } from '@/lib/analytics';
 *   trackEvent('button_click', { location: 'hero', button: 'cta_primary' });
 */

import { track } from '@vercel/analytics';

// Event names - organized by category for better organization
export const EVENTS = {
  // Engagement Events
  VIDEO_PLAY: 'video_play',
  VIDEO_PAUSE: 'video_pause',
  VIDEO_COMPLETE: 'video_complete',
  
  // Navigation & CTA Events
  CTA_CLICK: 'cta_click',
  NAVIGATION: 'navigation',
  
  // Form & Funnel Events
  FORM_START: 'form_start',
  FORM_STEP_COMPLETE: 'form_step_complete',
  FORM_FIELD_FOCUS: 'form_field_focus',
  FORM_ABANDON: 'form_abandon',
  
  // Checkout Events
  CHECKOUT_INITIATED: 'checkout_initiated',
  CHECKOUT_COMPLETED: 'checkout_completed',
  CHECKOUT_FAILED: 'checkout_failed',
  CHECKOUT_CANCELLED: 'checkout_cancelled',
  
  // Purchase & Conversion Events
  PURCHASE: 'purchase',
  VIDEO_GENERATION_STARTED: 'video_generation_started',
  VIDEO_GENERATION_COMPLETED: 'video_generation_completed',
  VIDEO_GENERATION_FAILED: 'video_generation_failed',
  
  // Video Viewing Events
  VIDEO_VIEWED: 'video_viewed',
  VIDEO_DOWNLOADED: 'video_downloaded',
  VIDEO_SHARED: 'video_shared',
  
  // Error Events
  ERROR: 'error',
} as const;

// Type for event names
export type EventName = typeof EVENTS[keyof typeof EVENTS];

// Helper function to safely track events with error handling
export function trackEvent(
  eventName: EventName | string,
  eventData?: {
    [key: string]: string | number | boolean | null;
  }
) {
  try {
    // Only track on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Track the event
    track(eventName, eventData);
    
    // Optional: Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, eventData);
    }
  } catch (error) {
    // Silently fail - don't break the app if analytics fails
    console.error('[Analytics Error]', error);
  }
}

// Convenience functions for common events
export const analytics = {
  // Engagement
  trackVideoPlay: (location: string) => {
    trackEvent(EVENTS.VIDEO_PLAY, { location });
  },
  
  trackVideoPause: (location: string) => {
    trackEvent(EVENTS.VIDEO_PAUSE, { location });
  },
  
  trackVideoComplete: (location: string) => {
    trackEvent(EVENTS.VIDEO_COMPLETE, { location });
  },
  
  // CTAs
  trackCTAClick: (location: string, buttonText?: string) => {
    trackEvent(EVENTS.CTA_CLICK, { 
      location, 
      button: buttonText || 'unknown' 
    });
  },
  
  // Form
  trackFormStart: (source: string) => {
    trackEvent(EVENTS.FORM_START, { source });
  },
  
  trackFormStep: (step: number, stepName: string) => {
    trackEvent(EVENTS.FORM_STEP_COMPLETE, { 
      step: step.toString(), 
      step_name: stepName 
    });
  },
  
  trackFormAbandon: (step: number, lastField?: string) => {
    trackEvent(EVENTS.FORM_ABANDON, { 
      step: step.toString(),
      last_field: lastField || 'unknown'
    });
  },
  
  // Checkout
  trackCheckoutInitiated: (currency: string, amount: number, messageType?: string) => {
    trackEvent(EVENTS.CHECKOUT_INITIATED, {
      currency,
      amount: amount.toString(),
      message_type: messageType || 'unknown'
    });
  },
  
  trackCheckoutCompleted: (currency: string, amount: number, orderId?: string) => {
    trackEvent(EVENTS.CHECKOUT_COMPLETED, {
      currency,
      amount: amount.toString(),
      order_id: orderId || 'unknown'
    });
  },
  
  trackCheckoutFailed: (reason?: string) => {
    trackEvent(EVENTS.CHECKOUT_FAILED, {
      reason: reason || 'unknown'
    });
  },
  
  trackCheckoutCancelled: () => {
    trackEvent(EVENTS.CHECKOUT_CANCELLED);
  },
  
  // Purchase
  trackPurchase: (currency: string, amount: number, messageType?: string) => {
    trackEvent(EVENTS.PURCHASE, {
      currency,
      amount: amount.toString(),
      message_type: messageType || 'unknown'
    });
  },
  
  // Video Generation
  trackVideoGenerationStarted: (orderId: string) => {
    trackEvent(EVENTS.VIDEO_GENERATION_STARTED, {
      order_id: orderId
    });
  },
  
  trackVideoGenerationCompleted: (orderId: string) => {
    trackEvent(EVENTS.VIDEO_GENERATION_COMPLETED, {
      order_id: orderId
    });
  },
  
  trackVideoGenerationFailed: (orderId: string, reason?: string) => {
    trackEvent(EVENTS.VIDEO_GENERATION_FAILED, {
      order_id: orderId,
      reason: reason || 'unknown'
    });
  },
  
  // Video Viewing
  trackVideoViewed: (orderId: string, watchedPercent?: number) => {
    trackEvent(EVENTS.VIDEO_VIEWED, {
      order_id: orderId,
      watched_percent: watchedPercent ? watchedPercent.toString() : '0'
    });
  },
  
  trackVideoDownloaded: (orderId: string) => {
    trackEvent(EVENTS.VIDEO_DOWNLOADED, {
      order_id: orderId
    });
  },
  
  trackVideoShared: (orderId: string, method?: string) => {
    trackEvent(EVENTS.VIDEO_SHARED, {
      order_id: orderId,
      method: method || 'unknown'
    });
  },
  
  // Errors
  trackError: (errorType: string, location: string, message?: string) => {
    trackEvent(EVENTS.ERROR, {
      error_type: errorType,
      location,
      message: message ? message.substring(0, 100) : 'unknown' // Limit length
    });
  },
};


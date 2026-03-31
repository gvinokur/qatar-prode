// app/utils/ga4.ts
'use client';

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag?: (_command: string, _targetId: string | Date, _config?: Record<string, unknown>) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Initializes Google Analytics 4.
 * This function should only be called once, typically in the root layout or an analytics provider.
 */
export const initializeGA4 = () => {
  if (!GA_MEASUREMENT_ID) {
    if (isDevelopment) {
      console.warn('GA_MEASUREMENT_ID is not set. Google Analytics will not be initialized.');
    }
    return;
  }

  // Ensure gtag is loaded. The script injection happens in layout.tsx.
  // This is a fallback in case it's called before the script is fully loaded,
  // but the script should already define window.gtag
  if (typeof window.gtag === 'undefined') {
    if (isDevelopment) {
      console.warn('window.gtag is not defined. Google Analytics might not be initialized correctly.');
    }
    return;
  }

  // Configuration for GA4 (e.g., anonymize IP, disable cookies for GDPR compliance if needed)
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // Page views will be sent manually by trackPageView
    // other configuration options can go here
  });

  if (isDevelopment) {
    console.warn('Google Analytics initialized.');
  }
};

/**
 * Tracks a page view event.
 * @param url The full URL of the page.
 * @param title The title of the page (optional).
 */
export const trackPageView = (url: string, title?: string) => {
  if (!GA_MEASUREMENT_ID) {
    if (isDevelopment) {
      console.warn('GA_MEASUREMENT_ID is not set. Page view will not be tracked.');
    }
    return;
  }
  if (typeof window.gtag !== 'function') {
    if (isDevelopment) {
      console.warn('window.gtag is not a function. Page view will not be tracked.');
    }
    return;
  }

  if (isDevelopment) {
    console.warn('Tracking page view:', url, title);
  }

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title,
  });
};

/**
 * Tracks a custom event.
 * @param eventName The name of the event.
 * @param eventParams Optional parameters for the event.
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (!GA_MEASUREMENT_ID) {
    if (isDevelopment) {
      console.warn('GA_MEASUREMENT_ID is not set. Event will not be tracked:', eventName);
    }
    return;
  }
  if (typeof window.gtag !== 'function') {
    if (isDevelopment) {
      console.warn('window.gtag is not a function. Event will not be tracked:', eventName);
    }
    return;
  }

  if (isDevelopment) {
    console.warn('Tracking event:', eventName, eventParams);
  }

  window.gtag('event', eventName, eventParams);
};

// Define an interface for the analytics event payload returned by Server Actions
export interface AnalyticsEventPayload {
  name: string;
  params?: Record<string, any>;
}

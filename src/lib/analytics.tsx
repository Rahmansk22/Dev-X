"use client";

import posthog from 'posthog-js';
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.opt_out_capturing();
          }
        },
      });
    }
  }, []);

  useEffect(() => {
    if (userId && posthog) {
      posthog.identify(userId);
    }
  }, [userId]);

  return <>{children}</>;
}

export function useAnalytics() {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  };

  const trackPageView = (pageName: string) => {
    if (posthog) {
      posthog.capture('$pageview', { page: pageName });
    }
  };

  return { trackEvent, trackPageView };
}

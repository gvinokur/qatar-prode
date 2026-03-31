// app/components/shared-ui/AnalyticsPageViewTracker.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initializeGA4, trackPageView } from '@/app/utils/ga4';
import { Session } from 'next-auth'; // Assuming Session type from next-auth

interface AnalyticsPageViewTrackerProps {
  user: Session['user'] | null;
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const AnalyticsPageViewTracker = ({ user }: AnalyticsPageViewTrackerProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only initialize if GA_MEASUREMENT_ID is set and user is not ad-free
    if (GA_MEASUREMENT_ID && !user?.isAdFree) {
      initializeGA4();
    }
  }, [user?.isAdFree]); // Re-initialize if ad-free status changes (unlikely in session, but good practice)

  useEffect(() => {
    // Track page views only if GA_MEASUREMENT_ID is set and user is not ad-free
    if (GA_MEASUREMENT_ID && !user?.isAdFree) {
      const url = pathname + searchParams.toString();
      trackPageView(url, document.title);
    }
  }, [pathname, searchParams, user?.isAdFree]);

  return null; // This component doesn't render anything visible
};

export default AnalyticsPageViewTracker;

// app/components/shared-ui/AnalyticsPageViewTracker.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initializeGA4, trackPageView } from '@/app/utils/ga4';
import { Session } from 'next-auth'; // Assuming Session type from next-auth

interface AnalyticsPageViewTrackerProps {
  user: Session['user'] | null;
}

const AnalyticsPageViewTracker = ({ user }: AnalyticsPageViewTrackerProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || user?.isAdFree) return;
    initializeGA4();
  }, [user?.isAdFree]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || user?.isAdFree) return;
    const url = pathname + searchParams.toString();
    trackPageView(url, document.title);
  }, [pathname, searchParams, user?.isAdFree]);

  return null; // This component doesn't render anything visible
};

export default AnalyticsPageViewTracker;

'use client'

import { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useTranslations } from 'next-intl';

export default function OfflineDetection() {
  const t = useTranslations('pwa.offline');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Snackbar
      open={isOffline}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="warning">
        {t('message')}
      </Alert>
    </Snackbar>
  );
}

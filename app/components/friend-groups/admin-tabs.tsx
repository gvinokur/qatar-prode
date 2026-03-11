'use client';

import React, { useState, useEffect } from 'react';
import { Box, Tab, Badge } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { Leaderboard as LeaderboardIcon, Settings as SettingsIcon, Timeline as TimelineIcon } from '@mui/icons-material';

type Props = {
  isAdmin: boolean;
  leaderboardContent: React.ReactNode;
  adminContent: React.ReactNode;
  historyContent?: React.ReactNode;
  defaultTab?: 'leaderboard' | 'admin';
  pendingRequestCount?: number;
};

export default function AdminTabs({ isAdmin, leaderboardContent, adminContent, historyContent, defaultTab, pendingRequestCount }: Readonly<Props>) {
  const t = useTranslations('groups.tabs');
  const searchParams = useSearchParams();
  const router = useRouter();

  const hasHistory = isAdmin && !!historyContent;

  // Determine initial tab from URL query param or defaultTab
  const tabFromUrl = searchParams.get('tab');
  let initialTab = 'leaderboard';
  if ((tabFromUrl === 'admin' || defaultTab === 'admin') && isAdmin) {
    initialTab = 'admin';
  } else if (tabFromUrl === 'history' && hasHistory) {
    initialTab = 'history';
  }

  const [value, setValue] = useState<string>(initialTab);

  // Update tab if URL changes (e.g., back button)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'admin' && isAdmin) {
      setValue('admin');
    } else if (tabFromUrl === 'history' && hasHistory) {
      setValue('history');
    } else if (!tabFromUrl || (tabFromUrl !== 'admin' && tabFromUrl !== 'history')) {
      setValue('leaderboard');
    }
  }, [searchParams, isAdmin, hasHistory]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);

    const currentPath = globalThis.location.pathname;
    const newUrl = newValue === 'admin' || newValue === 'history'
      ? `${currentPath}?tab=${newValue}`
      : currentPath;

    router.replace(newUrl, { scroll: false });
  };

  // If not admin, just show content without tabs
  if (!isAdmin) {
    return (
      <Box sx={{ width: '100%' }}>
        {leaderboardContent}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="group tabs">
            <Tab
              icon={<LeaderboardIcon />}
              iconPosition="start"
              label={t('leaderboard')}
              value="leaderboard"
            />
            {hasHistory && (
              <Tab
                icon={<TimelineIcon />}
                iconPosition="start"
                label={t('history')}
                value="history"
              />
            )}
            <Tab
              icon={
                <Badge badgeContent={pendingRequestCount} color="error" max={99}>
                  <SettingsIcon />
                </Badge>
              }
              iconPosition="start"
              label={t('admin')}
              value="admin"
            />
          </TabList>
        </Box>
        <TabPanel value="leaderboard" sx={{ px: 0 }}>
          {leaderboardContent}
        </TabPanel>
        {hasHistory && (
          <TabPanel value="history" sx={{ px: 0 }}>
            {historyContent}
          </TabPanel>
        )}
        <TabPanel value="admin" sx={{ px: 0 }}>
          {adminContent}
        </TabPanel>
      </TabContext>
    </Box>
  );
}

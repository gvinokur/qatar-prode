'use client';

import React, { useState, useEffect } from 'react';
import { Box, Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { Leaderboard as LeaderboardIcon, Settings as SettingsIcon } from '@mui/icons-material';

type Props = {
  isAdmin: boolean;
  leaderboardContent: React.ReactNode;
  adminContent: React.ReactNode;
  defaultTab?: 'leaderboard' | 'admin';
};

export default function AdminTabs({ isAdmin, leaderboardContent, adminContent, defaultTab }: Props) {
  const t = useTranslations('groups.tabs');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Determine initial tab from URL query param or defaultTab
  const tabFromUrl = searchParams.get('tab');
  const initialTab =
    (tabFromUrl === 'admin' && isAdmin) ? 'admin' :
    (defaultTab === 'admin' && isAdmin) ? 'admin' :
    'leaderboard';

  const [value, setValue] = useState<string>(initialTab);

  // Update tab if URL changes (e.g., back button)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'admin' && isAdmin) {
      setValue('admin');
    } else if (!tabFromUrl || tabFromUrl !== 'admin') {
      setValue('leaderboard');
    }
  }, [searchParams, isAdmin]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);

    // Update URL without page reload
    const currentPath = window.location.pathname;
    const newUrl = newValue === 'admin'
      ? `${currentPath}?tab=admin`
      : currentPath;

    router.replace(newUrl, { scroll: false });
  };

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
            {isAdmin && (
              <Tab
                icon={<SettingsIcon />}
                iconPosition="start"
                label={t('admin')}
                value="admin"
              />
            )}
          </TabList>
        </Box>
        <TabPanel value="leaderboard" sx={{ px: 0 }}>
          {leaderboardContent}
        </TabPanel>
        {isAdmin && (
          <TabPanel value="admin" sx={{ px: 0 }}>
            {adminContent}
          </TabPanel>
        )}
      </TabContext>
    </Box>
  );
}

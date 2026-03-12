'use client';

import React, { useState, useEffect } from 'react';
import { Box, Tab, Badge } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { Leaderboard as LeaderboardIcon, Settings as SettingsIcon, Timeline as TimelineIcon } from '@mui/icons-material';

type Props = {
  isAdmin: boolean;
  standingsContent: React.ReactNode;
  historyContent: React.ReactNode;
  adminContent?: React.ReactNode;
  pendingRequestCount?: number;
};

export default function AdminTabs({ isAdmin, standingsContent, historyContent, adminContent, pendingRequestCount }: Readonly<Props>) {
  const t = useTranslations('groups.tabs');
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabFromUrl = searchParams.get('tab');
  let initialTab = 'standings';
  if (tabFromUrl === 'history') initialTab = 'history';
  else if (tabFromUrl === 'admin' && isAdmin) initialTab = 'admin';

  const [value, setValue] = useState<string>(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'admin' && isAdmin) setValue('admin');
    else if (tab === 'history') setValue('history');
    else if (!tab || (tab !== 'admin' && tab !== 'history')) setValue('standings');
  }, [searchParams, isAdmin]);

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    const currentPath = globalThis.location.pathname;
    const newUrl = newValue === 'standings' ? currentPath : `${currentPath}?tab=${newValue}`;
    router.replace(newUrl, { scroll: false });
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="group tabs" variant="scrollable" scrollButtons="auto">
            <Tab icon={<LeaderboardIcon />} iconPosition="start" label={t('standings')} value="standings" />
            <Tab icon={<TimelineIcon />} iconPosition="start" label={t('history')} value="history" />
            {isAdmin && (
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
            )}
          </TabList>
        </Box>
        <TabPanel value="standings" sx={{ px: 0 }}>
          {standingsContent}
        </TabPanel>
        <TabPanel value="history" sx={{ px: 0 }}>
          {historyContent}
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

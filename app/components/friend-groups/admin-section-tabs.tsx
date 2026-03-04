'use client';

import React, { useState } from 'react';
import { Box, Tab, Badge } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { useTranslations } from 'next-intl';
import {
  PersonAdd as PersonAddIcon,
  Lock as LockIcon,
  Casino as CasinoIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { Locale } from '@/i18n.config';
import { ProdeGroup, ProdeGroupTournamentBetting, ProdeGroupTournamentBettingPayment } from '../../db/tables-definition';
import JoinRequestManager from './join-request-manager';
import GroupPrivacySettings from './group-privacy-settings';
import GroupTournamentBettingAdmin from './group-tournament-betting-admin';
import ProdeGroupThemer from './friend-groups-themer';

interface JoinRequest {
  id: string;
  user_id: string;
  user_nickname?: string | null;
  user_email?: string | null;
  requested_at: Date;
  request_source: string;
  status: string;
  message?: string | null;
}

type AdminSectionTabValue = 'requests' | 'privacy' | 'betting' | 'customize';

type Props = {
  // JoinRequestManager
  groupId: string;
  initialRequests: JoinRequest[];
  locale: Locale;
  tournamentId: string;
  // GroupPrivacySettings
  groupName: string;
  initialIsPublic: boolean;
  initialDescription: string | null;
  // GroupTournamentBettingAdmin
  isAdmin: boolean;
  members: { id: string; nombre: string }[];
  config: ProdeGroupTournamentBetting | null;
  payments: ProdeGroupTournamentBettingPayment[];
  // ProdeGroupThemer
  group: ProdeGroup;
  // Tab logic
  pendingRequestCount: number;
};

export default function AdminSectionTabs({
  groupId,
  initialRequests,
  locale,
  tournamentId,
  groupName,
  initialIsPublic,
  initialDescription,
  isAdmin,
  members,
  config,
  payments,
  group,
  pendingRequestCount,
}: Readonly<Props>) {
  const t = useTranslations('groups.adminSectionTabs');

  const initialTab: AdminSectionTabValue = pendingRequestCount > 0 ? 'requests' : 'privacy';
  const [value, setValue] = useState<AdminSectionTabValue>(initialTab);

  const handleChange = (_event: React.SyntheticEvent, newValue: AdminSectionTabValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList
            onChange={handleChange}
            aria-label="admin section tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={
                <Badge badgeContent={pendingRequestCount} color="error" max={99}>
                  <PersonAddIcon />
                </Badge>
              }
              iconPosition="start"
              label={t('requests')}
              value="requests"
            />
            <Tab
              icon={<LockIcon />}
              iconPosition="start"
              label={t('privacy')}
              value="privacy"
            />
            <Tab
              icon={<CasinoIcon />}
              iconPosition="start"
              label={t('betting')}
              value="betting"
            />
            <Tab
              icon={<PaletteIcon />}
              iconPosition="start"
              label={t('customize')}
              value="customize"
            />
          </TabList>
        </Box>
        <TabPanel value="requests" sx={{ px: 0 }}>
          <JoinRequestManager
            groupId={groupId}
            initialRequests={initialRequests}
            locale={locale}
            tournamentId={tournamentId}
          />
        </TabPanel>
        <TabPanel value="privacy" sx={{ px: 0 }}>
          <GroupPrivacySettings
            groupId={groupId}
            groupName={groupName}
            initialIsPublic={initialIsPublic}
            initialDescription={initialDescription}
          />
        </TabPanel>
        <TabPanel value="betting" sx={{ px: 0 }}>
          <GroupTournamentBettingAdmin
            groupId={groupId}
            tournamentId={tournamentId}
            isAdmin={isAdmin}
            members={members}
            config={config}
            payments={payments}
          />
        </TabPanel>
        <TabPanel value="customize" sx={{ px: 0 }}>
          <ProdeGroupThemer group={group} />
        </TabPanel>
      </TabContext>
    </Box>
  );
}

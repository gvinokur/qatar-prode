'use client'

import { Tabs, Tab, useTheme } from "@mui/material";
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from 'next-intl';
import { User } from 'next-auth';

type Props = {
  readonly groups: { group_letter: string, id: string }[];
  readonly tournamentId: string;
  readonly backgroundColor?: string;
  readonly textColor?: string;
  readonly user?: User;
};

/** Get tab styling */
const getTabSx = (backgroundColor: string | undefined, textColor: string | undefined, theme: any) => ({
  color: textColor || theme.palette.text.primary,
  '&.Mui-selected': {
    color: backgroundColor || theme.palette.primary.contrastText,
    backgroundColor: textColor || theme.palette.primary.main,
    borderRadius: '4px',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
});

/** Get selected tab value from pathname */
const getSelectedTab = (pathname: string, tournamentId: string): string => {
  if (pathname.includes('/games')) {
    return 'matches';
  }
  if (pathname.includes('/qualified-teams')) {
    return 'qualified-teams';
  }
  if (pathname.includes('/awards')) {
    return 'individual_awards';
  }
  // Root tournament path → hub tab active
  if (pathname.endsWith(`/tournaments/${tournamentId}`) || pathname.endsWith(`/tournaments/${tournamentId}/`)) {
    return 'hub';
  }
  return 'hub';
};

const GroupSelector = ({ groups, tournamentId, backgroundColor, textColor, user }: Props) => {
  const locale = useLocale();
  const t = useTranslations('navigation.topNav');
  const pathname = usePathname();
  const theme = useTheme();
  const selected = getSelectedTab(pathname, tournamentId);
  const tabSx = getTabSx(backgroundColor, textColor, theme);

  return (
    <Tabs
      value={selected}
      variant="fullWidth"
      aria-label={t('ariaLabel')}
      slotProps={{
        indicator: {
          sx: {
            backgroundColor: 'transparent',
          },
        },
      }}
      sx={{
        width: '100%',
        backgroundColor: backgroundColor || theme.palette.background.paper,
        '.MuiTab-root': {
          fontWeight: 600,
          minHeight: 48, // Override MUI's 72px default for tabs with icons
        },
      }}
    >
      <Tab
        label={t('hub')}
        icon={<DashboardIcon sx={{ fontSize: 20 }} />}
        iconPosition="start"
        value="hub"
        component={Link}
        href={`/${locale}/tournaments/${tournamentId}`}
        sx={tabSx}
        disabled={!user}
      />
      <Tab
        label={t('matches')}
        icon={<SportsSoccerIcon sx={{ fontSize: 20 }} />}
        iconPosition="start"
        value="matches"
        component={Link}
        href={`/${locale}/tournaments/${tournamentId}/games`}
        sx={tabSx}
      />
      <Tab
        label={t('qualified')}
        icon={<AccountTreeIcon sx={{ fontSize: 20 }} />}
        iconPosition="start"
        value="qualified-teams"
        component={Link}
        href={`/${locale}/tournaments/${tournamentId}/qualified-teams`}
        sx={tabSx}
        disabled={!user}
      />
      <Tab
        label={t('awards')}
        icon={<EmojiEventsIcon sx={{ fontSize: 20 }} />}
        iconPosition="start"
        value="individual_awards"
        component={Link}
        href={`/${locale}/tournaments/${tournamentId}/awards`}
        sx={tabSx}
        disabled={!user}
      />
    </Tabs>
  );
};

export default GroupSelector;

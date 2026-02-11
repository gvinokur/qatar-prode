'use client'

import { Tabs, Tab, useTheme } from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  readonly groups: { group_letter: string, id: string }[];
  readonly tournamentId: string;
  readonly backgroundColor?: string;
  readonly textColor?: string;
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
const getSelectedTab = (pathname: string): string => {
  if (pathname.includes('/qualified-teams')) {
    return 'qualified-teams';
  }
  if (pathname.includes('/awards')) {
    return 'individual_awards';
  }
  // Default to home tab for tournament root and any other tournament pages
  return '';
};

const GroupSelector = ({ groups, tournamentId, backgroundColor, textColor }: Props) => {
  const pathname = usePathname();
  const theme = useTheme();
  const selected = getSelectedTab(pathname);
  const tabSx = getTabSx(backgroundColor, textColor, theme);

  return (
    <Tabs
      value={selected}
      variant="fullWidth"
      aria-label="Navegación del torneo"
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
        minHeight: { xs: 48, md: 40 },
        '.MuiTab-root': {
          fontWeight: 600,
          minHeight: { xs: 48, md: 40 },
          py: { xs: 1.5, md: 1 },
          fontSize: { xs: '0.875rem', md: '0.8125rem' }
        },
      }}
    >
      <Tab
        label="PARTIDOS"
        icon={<EmojiEventsIcon sx={{ fontSize: 20 }} />}
        iconPosition="start"
        value=""
        component={Link}
        href={`/tournaments/${tournamentId}`}
        sx={tabSx}
      />
      <Tab
        label="CLASIFICADOS"
        value="qualified-teams"
        component={Link}
        href={`/tournaments/${tournamentId}/qualified-teams`}
        sx={tabSx}
      />
      <Tab
        label="PREMIOS"
        value="individual_awards"
        component={Link}
        href={`/tournaments/${tournamentId}/awards`}
        sx={tabSx}
      />
    </Tabs>
  );
};

export default GroupSelector;

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
  if (pathname.includes('/groups/')) {
    const match = pathname.match(/groups\/([^/]+)/);
    return match ? match[1] : '';
  }
  if (pathname.includes('/qualified-teams')) {
    return 'qualified-teams';
  }
  if (pathname.includes('/awards')) {
    return 'individual_awards';
  }
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
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      aria-label="Selector de grupos"
      slotProps={{
        indicator: {
          sx: {
            backgroundColor: 'transparent',
          },
        },
        root: {
          sx: {
            height: '36px',
          },
        },
        scrollButtons: {
          sx: {
            color: textColor || theme.palette.text.primary,
            fontWeight: 600,
          },
        },
      }}
      sx={{
        width: '100%',
        backgroundColor: backgroundColor || theme.palette.background.paper,
        '.MuiTab-root': {
          fontWeight: 600,
          height: '36px',
          minHeight: '36px',
        },
      }}
    >
      <Tab
        icon={<EmojiEventsIcon sx={{ fontSize: 20 }} />}
        value=""
        component={Link}
        href={`/tournaments/${tournamentId}`}
        sx={tabSx}
      />
      {groups.map(({ group_letter, id }) => (
        <Tab
          key={id}
          label={`GRUPO ${group_letter.toUpperCase()}`}
          value={id}
          component={Link}
          href={`/tournaments/${tournamentId}/groups/${id}`}
          sx={tabSx}
        />
      ))}
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

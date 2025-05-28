'use client'

import { Tabs, Tab, useTheme } from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  groups: { group_letter: string, id: string }[];
  tournamentId: string;
  backgroundColor?: string;
  textColor?: string;
};

const GroupSelector = ({ groups, tournamentId, backgroundColor, textColor }: Props) => {
  const pathname = usePathname();
  const theme = useTheme();

  // Determine selected tab from pathname
  let selected = '';
  if (pathname.includes('/groups/')) {
    const match = pathname.match(/groups\/([^/]+)/);
    selected = match ? match[1] : '';
  } else if (pathname.includes('/playoffs')) {
    selected = 'playoffs';
  } else if (pathname.includes('/awards')) {
    selected = 'individual_awards';
  }

  const tabSx = (backgroundColor: string | undefined, textColor: string | undefined, theme: any) => ({
    color: textColor || theme.palette.text.primary,
    '&.Mui-selected': {
      color: backgroundColor || theme.palette.primary.contrastText,
      backgroundColor: textColor || theme.palette.primary.main,
      borderRadius: '4px',
      borderWidth: '1px',
      borderStyle: 'solid',
    },
  });

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
        sx={tabSx(backgroundColor, textColor, theme)}
      />
      {groups.map(({ group_letter, id }) => (
        <Tab
          key={id}
          label={`GRUPO ${group_letter.toUpperCase()}`}
          value={id}
          component={Link}
          href={`/tournaments/${tournamentId}/groups/${id}`}
          sx={tabSx(backgroundColor, textColor, theme)}
        />
      ))}
      <Tab
        label="PLAYOFFS"
        value="playoffs"
        component={Link}
        href={`/tournaments/${tournamentId}/playoffs`}
        sx={tabSx(backgroundColor, textColor, theme)}
      />
      <Tab
        label="PREMIOS"
        value="individual_awards"
        component={Link}
        href={`/tournaments/${tournamentId}/awards`}
        sx={tabSx(backgroundColor, textColor, theme)}
      />
    </Tabs>
  );
};

export default GroupSelector;

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
      }}
      sx={{
        width: '100%',
        backgroundColor: backgroundColor || theme.palette.background.paper,
        '.MuiTab-root': {
          minWidth: 90,
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
        sx={{
          color: textColor || theme.palette.text.primary,
          '&.Mui-selected': {
              color: backgroundColor || theme.palette.primary.contrastText,
              backgroundColor: textColor || theme.palette.primary.main,
              borderRadius: '4px',
              borderWidth: '1px',
              borderStyle: 'solid',
            },
        }}
      />
      {groups.map(({ group_letter, id }) => (
        <Tab
          key={id}
          label={`GRUPO ${group_letter.toUpperCase()}`}
          value={id}
          component={Link}
          href={`/tournaments/${tournamentId}/groups/${id}`}
          sx={{
            color: textColor || theme.palette.text.primary,
            '&.Mui-selected': {
                color: backgroundColor || theme.palette.primary.contrastText,
                backgroundColor: textColor || theme.palette.primary.main,
                borderRadius: '4px',
                borderWidth: '1px',
                borderStyle: 'solid',
              },
          }}
        />
      ))}
      <Tab
        label="PLAYOFFS"
        value="playoffs"
        component={Link}
        href={`/tournaments/${tournamentId}/playoffs`}
        sx={{
          color: textColor || theme.palette.text.primary,
          '&.Mui-selected': {
              color: backgroundColor || theme.palette.primary.contrastText,
              backgroundColor: textColor || theme.palette.primary.main,
              borderRadius: '4px',
              borderWidth: '1px',
              borderStyle: 'solid',
            },
        }}
      />
      <Tab
        label="PREMIOS"
        value="individual_awards"
        component={Link}
        href={`/tournaments/${tournamentId}/awards`}
        sx={{
          color: textColor || theme.palette.text.primary,
          '&.Mui-selected': {
              color: backgroundColor || theme.palette.primary.contrastText,
              backgroundColor: textColor || theme.palette.primary.main,
              borderRadius: '4px',
              borderWidth: '1px',
              borderStyle: 'solid',
            },
        }}
      />
    </Tabs>
  );
};

export default GroupSelector;

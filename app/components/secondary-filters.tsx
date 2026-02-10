'use client'

import { Box, Tabs, Tab } from '@mui/material';
import { TournamentGroup, PlayoffRound } from '../db/tables-definition';

interface SecondaryFiltersProps {
  activeFilter: 'all' | 'groups' | 'playoffs' | 'unpredicted' | 'closingSoon';
  groupFilter: string | null;
  roundFilter: string | null;
  groups: TournamentGroup[];
  rounds: PlayoffRound[];
  onGroupChange: (groupId: string | null) => void;
  onRoundChange: (roundId: string | null) => void;
}

export function SecondaryFilters({
  activeFilter,
  groupFilter,
  roundFilter,
  groups,
  rounds,
  onGroupChange,
  onRoundChange
}: SecondaryFiltersProps) {
  // Don't render anything if not in groups or playoffs mode
  if (activeFilter !== 'groups' && activeFilter !== 'playoffs') {
    return null;
  }

  // Render group selector when in groups mode
  if (activeFilter === 'groups') {
    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={groupFilter || false}
          onChange={(_, value) => onGroupChange(value === false ? null : value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Todos" value={false} />
          {groups.map(group => (
            <Tab
              key={group.id}
              label={`Grupo ${group.group_letter.toUpperCase()}`}
              value={group.id}
            />
          ))}
        </Tabs>
      </Box>
    );
  }

  // Render round selector when in playoffs mode
  if (activeFilter === 'playoffs') {
    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={roundFilter || false}
          onChange={(_, value) => onRoundChange(value === false ? null : value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Todos" value={false} />
          {rounds.map(round => (
            <Tab
              key={round.id}
              label={round.round_name}
              value={round.id}
            />
          ))}
        </Tabs>
      </Box>
    );
  }

  return null;
}

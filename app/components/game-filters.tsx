'use client'

import { Box, Button, Chip } from '@mui/material';
import { FilterType } from '../utils/game-filters';
import { TournamentGameCounts } from '../db/game-repository';

interface GameFiltersProps {
  gameCounts: TournamentGameCounts;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function GameFilters({ gameCounts, activeFilter, onFilterChange }: GameFiltersProps) {
  const filters: Array<{ type: FilterType; label: string; count: number }> = [
    { type: 'all', label: 'Todos', count: gameCounts.total },
    { type: 'groups', label: 'Grupos', count: gameCounts.groups },
    { type: 'playoffs', label: 'Playoffs', count: gameCounts.playoffs },
    { type: 'unpredicted', label: 'Sin Predecir', count: gameCounts.unpredicted },
    { type: 'closingSoon', label: 'Cierran Pronto', count: gameCounts.closingSoon }
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        mb: 2
      }}
    >
      {filters.map(filter => (
        <Button
          key={filter.type}
          variant={activeFilter === filter.type ? 'contained' : 'outlined'}
          onClick={() => onFilterChange(filter.type)}
          endIcon={
            <Chip
              label={filter.count}
              size="small"
              sx={{
                height: '16px',
                fontSize: '0.65rem',
                '& .MuiChip-label': {
                  px: 0.5,
                  py: 0
                },
                backgroundColor: activeFilter === filter.type ? 'rgba(255, 255, 255, 0.3)' : 'action.hover'
              }}
            />
          }
          sx={{
            textTransform: 'none',
            fontWeight: activeFilter === filter.type ? 600 : 400
          }}
        >
          {filter.label}
        </Button>
      ))}
    </Box>
  );
}

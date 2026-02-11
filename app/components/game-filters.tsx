'use client'

import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { FilterType } from '../utils/game-filters';
import { TournamentGameCounts } from '../db/game-repository';

interface GameFiltersProps {
  readonly gameCounts: TournamentGameCounts;
  readonly activeFilter: FilterType;
  readonly onFilterChange: (filter: FilterType) => void;
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
    <FormControl fullWidth size="small">
      <InputLabel id="game-filter-label">Filtro</InputLabel>
      <Select
        labelId="game-filter-label"
        value={activeFilter}
        label="Filtro"
        onChange={(e) => onFilterChange(e.target.value as FilterType)}
      >
        {filters.map(filter => (
          <MenuItem key={filter.type} value={filter.type}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{filter.label}</span>
              <span style={{ marginLeft: '16px', color: 'text.secondary', fontSize: '0.875rem' }}>
                ({filter.count})
              </span>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

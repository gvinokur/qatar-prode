'use client'

import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { useTranslations } from 'next-intl';
import { FilterType } from '../utils/game-filters';
import { TournamentGameCounts } from '../db/game-repository';

interface GameFiltersProps {
  readonly gameCounts: TournamentGameCounts;
  readonly activeFilter: FilterType;
  readonly onFilterChange: (filter: FilterType) => void;
}

export function GameFilters({ gameCounts, activeFilter, onFilterChange }: GameFiltersProps) {
  const t = useTranslations('predictions');

  const filters: Array<{ type: FilterType; label: string; count: number }> = [
    { type: 'all', label: t('filters.all'), count: gameCounts.total },
    { type: 'groups', label: t('filters.groups'), count: gameCounts.groups },
    { type: 'playoffs', label: t('filters.playoffs'), count: gameCounts.playoffs },
    { type: 'unpredicted', label: t('filters.unpredicted'), count: gameCounts.unpredicted },
    { type: 'closingSoon', label: t('filters.closingSoon'), count: gameCounts.closingSoon }
  ];

  return (
    <FormControl fullWidth size="small">
      <InputLabel id="game-filter-label">{t('filters.label')}</InputLabel>
      <Select
        labelId="game-filter-label"
        value={activeFilter}
        label={t('filters.label')}
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

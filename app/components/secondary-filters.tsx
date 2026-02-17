'use client'

import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTranslations } from 'next-intl';
import { TournamentGroup, PlayoffRound } from '../db/tables-definition';

interface SecondaryFiltersProps {
  readonly activeFilter: 'all' | 'groups' | 'playoffs' | 'unpredicted' | 'closingSoon';
  readonly groupFilter: string | null;
  readonly roundFilter: string | null;
  readonly groups: TournamentGroup[];
  readonly rounds: PlayoffRound[];
  readonly onGroupChange: (groupId: string | null) => void;
  readonly onRoundChange: (roundId: string | null) => void;
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
  const t = useTranslations('predictions');

  // Don't render anything if not in groups or playoffs mode
  if (activeFilter !== 'groups' && activeFilter !== 'playoffs') {
    return null;
  }

  // Render group selector when in groups mode
  if (activeFilter === 'groups') {
    return (
      <FormControl fullWidth size="small">
        <InputLabel id="group-filter-label">{t('secondaryFilters.group')}</InputLabel>
        <Select
          labelId="group-filter-label"
          value={groupFilter || ''}
          label={t('secondaryFilters.group')}
          onChange={(e) => onGroupChange(e.target.value || null)}
        >
          <MenuItem value="">Todos</MenuItem>
          {groups.map(group => (
            <MenuItem key={group.id} value={group.id}>
              Grupo {group.group_letter.toUpperCase()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  // Render round selector when in playoffs mode
  if (activeFilter === 'playoffs') {
    return (
      <FormControl fullWidth size="small">
        <InputLabel id="round-filter-label">{t('secondaryFilters.round')}</InputLabel>
        <Select
          labelId="round-filter-label"
          value={roundFilter || ''}
          label={t('secondaryFilters.round')}
          onChange={(e) => onRoundChange(e.target.value || null)}
        >
          <MenuItem value="">Todos</MenuItem>
          {rounds.map(round => (
            <MenuItem key={round.id} value={round.id}>
              {round.round_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return null;
}

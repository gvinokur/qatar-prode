'use client'

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText, Box, SelectChangeEvent } from '@mui/material';
import { Team } from '../../db/tables-definition';
import Image from 'next/image';
import {getThemeLogoUrl} from "../../utils/theme-utils";
import { useTranslations } from 'next-intl';

interface TeamSelectorProps {
  label: string;
  teams: Team[];
  selectedTeamId: string;
  name: string;
  disabled?: boolean;
  helperText?: string;
  onChange?: (_value: string) => void;
}

export interface TeamSelectorHandle {
  focus: () => void;
}

const TeamSelector = forwardRef<TeamSelectorHandle, TeamSelectorProps>(function TeamSelector({
  label,
  teams,
  selectedTeamId,
  name,
  disabled = false,
  helperText,
  onChange
}, ref) {
  const t = useTranslations('awards');
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      // MUI Select renders its interactive element as div[tabindex="0"] inside the container
      const el = containerRef.current?.querySelector<HTMLElement>('[tabindex="0"]');
      el?.focus();
    },
  }));

  // Sort teams alphabetically by name
  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  // Handle change event
  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    // Call the onChange prop if provided
    if (onChange) {
      onChange(value);
    }
  };

  let logoUrl : string | undefined | null = null;

  return (
    <FormControl ref={containerRef} fullWidth disabled={disabled}>
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-label`}
        id={name}
        name={name}
        value={selectedTeamId}
        label={label}
        onChange={handleChange}
        renderValue={(selected) => {
          const team = teams.find(t => t.id === selected);
          if (!team) return label;

          logoUrl = getThemeLogoUrl(team.theme);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {logoUrl && (
                <Image
                  src={logoUrl}
                  alt={team.name}
                  width={24}
                  height={16}
                  style={{ objectFit: 'contain' }}
                  unoptimized
                />
              )}
              {team.name}
            </Box>
          );
        }}
      >
        <MenuItem value="">
          <em>{t('selector.none')}</em>
        </MenuItem>
        {sortedTeams.map((team) => {
          logoUrl = getThemeLogoUrl(team.theme);
          return (
            <MenuItem key={team.id} value={team.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {logoUrl && (
                  <Image
                    src={logoUrl}
                    alt={team.name}
                    width={24}
                    height={16}
                    style={{ objectFit: 'contain' }}
                    unoptimized
                  />
                )}
                {team.name}
              </Box>
            </MenuItem>
          );
        })}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
});

export default TeamSelector;

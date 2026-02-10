'use client'

import { Stack } from '@mui/material';
import GameCardSkeleton from './skeletons/game-card-skeleton';

interface GamesListLoadingProps {
  count?: number;
}

export function GamesListLoading({ count = 5 }: GamesListLoadingProps) {
  return (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <GameCardSkeleton key={index} variant="full" />
      ))}
    </Stack>
  );
}

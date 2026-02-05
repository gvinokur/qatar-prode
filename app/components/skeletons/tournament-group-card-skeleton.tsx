'use client'

import { useMemo } from 'react';
import { Box, Stack, Skeleton } from "@mui/material";
import { getSkeletonA11yProps } from './skeleton-utils';

export default function TournamentGroupCardSkeleton() {
  // Generate stable unique keys for skeleton stat sections
  const statKeys = useMemo(
    () => Array.from({ length: 4 }, () => crypto.randomUUID()),
    []
  );

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        height: '100%'
      }}
      {...getSkeletonA11yProps('Loading tournament group')}
    >
      {/* Group name */}
      <Skeleton
        variant="rectangular"
        width="70%"
        height={28}
        sx={{ mb: 3 }}
      />

      {/* Stats sections */}
      <Stack spacing={2.5}>
        {statKeys.map((key) => (
          <Box key={key}>
            <Skeleton
              variant="rectangular"
              width="60%"
              height={16}
              sx={{ mb: 0.5 }}
            />
            <Skeleton
              variant="rectangular"
              width="40%"
              height={24}
            />
          </Box>
        ))}
      </Stack>

      {/* Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Skeleton
          variant="rectangular"
          width="50%"
          height={36}
          sx={{ maxWidth: 120, borderRadius: 1 }}
        />
      </Box>
    </Box>
  )
}

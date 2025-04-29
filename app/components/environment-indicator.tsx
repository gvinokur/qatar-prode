'use client'

import { Box, Chip } from '@mui/material';
import { useEffect, useState } from 'react';

export default function EnvironmentIndicator({ isDev } : {isDev: boolean}) {

  if (!isDev) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000
      }}
    >
      <Chip
        label="This tournament is only visible in development mode"
        color="warning"
        variant="filled"
        sx={{
          fontWeight: 'bold',
          opacity: 0.8
        }}
      />
    </Box>
  );
}

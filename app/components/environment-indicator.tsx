'use client'

import {Alert, AlertTitle, Box} from '@mui/material';

export default function EnvironmentIndicator({ isDev } : {isDev: boolean}) {

  if (!isDev) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 1000
      }}
    >
      <Alert
        severity="warning"
        variant="filled"
        sx={{
          fontWeight: 'bold',
          opacity: 0.8
        }}
      >
        <AlertTitle>Development Mode</AlertTitle>
        Este torneo solo esta disponible en modo desarrollo.
      </Alert>
    </Box>
  );
}

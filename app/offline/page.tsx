'use client';

import {Alert, Box, Snackbar} from "@mui/material";

export default function OfflinePage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Alert severity="warning">
        Estás navegando sin conexión. Algunas funciones pueden no estar disponibles.
      </Alert>
    </Box>
  );
}

'use server';

import {Link, Box} from "@mui/material";

export default async function OfflinePage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Link href={'/'} color='secondary'>Recargar Aplicacion</Link>
    </Box>
  );
}

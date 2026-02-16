'use server';

import {Box, Typography} from "@mui/material";
import Link from "next/link";
import { getLocale } from 'next-intl/server';

export default async function OfflinePage() {
  const locale = await getLocale();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Link href={`/${locale}`}>
        <Typography
          color={'secondary.contrastText'}
          p={2}
          borderRadius={2}
          variant={'h5'}
          sx={{
            cursor: 'pointer',
            backgroundColor: 'secondary.main',
            ":hover": {
              backgroundColor: 'secondary.dark'
            }}}>
          Recargar Aplicacion
        </Typography>
      </Link>
    </Box>
  );
}

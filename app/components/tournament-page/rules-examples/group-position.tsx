'use client'

import { Box, Typography } from "@mui/material";
import { useTranslations } from 'next-intl'

interface GroupPositionExampleProps {
  readonly qualifiedPoints: number;
  readonly exactPositionPoints: number;
  readonly totalPoints: number;
}

export default function GroupPositionExample({ qualifiedPoints, exactPositionPoints, totalPoints }: GroupPositionExampleProps) {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {t('groupPosition', { qualifiedPoints, exactPositionPoints, totalPoints })}
      </Typography>
    </Box>
  );
} 
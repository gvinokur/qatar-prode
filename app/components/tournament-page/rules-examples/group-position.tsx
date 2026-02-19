import { Box, Typography } from "@mui/material";
import { useTranslations } from 'next-intl'

export default function GroupPositionExample() {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {t('groupPosition')}
      </Typography>
    </Box>
  );
} 
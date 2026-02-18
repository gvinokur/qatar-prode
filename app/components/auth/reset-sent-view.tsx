'use client'

import { Typography } from "@mui/material";
import { useTranslations, useLocale } from 'next-intl';
import type { Locale } from '@/i18n.config';

type ResetSentViewProps = {
  readonly email: string;
}

export default function ResetSentView({ email }: ResetSentViewProps) {
  const t = useTranslations('auth');
  const locale = useLocale() as Locale;
  return (
    <div style={{ padding: '16px 0' }}>
      <Typography variant="body1" sx={{ mb: 1 }}>
        {t('resetSent.emailSentTo')}
      </Typography>
      <Typography variant="body1" fontWeight="bold">
        {email}
      </Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        {t('resetSent.instructions')}
      </Typography>
    </div>
  );
}

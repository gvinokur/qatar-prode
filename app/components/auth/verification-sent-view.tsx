'use client'

import { Typography, Box, Alert } from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';
import { useTranslations } from 'next-intl';
import {User} from "../../db/tables-definition";

type VerificationSentViewProps = {
  readonly user?: User;
}

export default function VerificationSentView({ user }: VerificationSentViewProps) {
  const t = useTranslations('auth');
  return (
    <Box sx={{ padding: '16px 0', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <EmailIcon color="primary" sx={{ fontSize: 48 }} />
      </Box>

      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('verificationSent.title', { nickname: user?.nickname || '' })}
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        {t('verificationSent.emailSentTo')}
      </Typography>

      <Typography variant="body1" fontWeight="bold" sx={{ mb: 3 }}>
        {user?.email}
      </Typography>

      <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
        <Typography variant="body2">
          {t('verificationSent.instructions')}
        </Typography>
      </Alert>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('verificationSent.checkSpam')}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {t('verificationSent.linkExpiration')}
      </Typography>
    </Box>
  );
}

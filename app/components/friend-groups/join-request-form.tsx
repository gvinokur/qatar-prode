'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  useTheme
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { requestToJoinGroup } from '@/app/actions/prode-group-join-request-actions';
import { ProdeGroup } from '@/app/db/tables-definition';
import { PersonAdd as PersonAddIcon, Info as InfoIcon } from '@mui/icons-material';
import { Locale } from '@/i18n.config';

type Props = {
  group: ProdeGroup;
  memberCount: number;
  locale: Locale;
  tournamentId?: string;
  rejectionCooldown?: string; // formatted date when user can request again
};

export default function JoinRequestForm({ group, memberCount, locale, tournamentId, rejectionCooldown }: Readonly<Props>) {
  const t = useTranslations('groups.joinRequest');
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const messageToSend = message.trim() === '' ? undefined : message.trim();

    try {
      await requestToJoinGroup(group.id, 'invite_link', locale, tournamentId, messageToSend);
      setSuccess(true);
      // Refresh the page to show PendingRequestView
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('requestFailed'));
      console.error('Error requesting to join group:', err);
    } finally {
      setLoading(false);
    }
  };

  if (rejectionCooldown) {
    return (
      <Card>
        <CardHeader
          title={group.name}
          subheader={t('preview')}
          sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
        />
        <Divider />
        <CardContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {t('rejectedTitle')}
            </Typography>
            <Typography variant="body2">{t('rejectedMessage')}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {t('cooldownMessage', { date: rejectionCooldown })}
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {t('members', { count: memberCount })}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardContent>
          <Alert severity="success" icon={<PersonAddIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              {t('successTitle')}
            </Typography>
            <Typography variant="body2">
              {t('successMessage')}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={group.name}
        subheader={t('preview')}
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
      />
      <Divider />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('members', { count: memberCount })}
          </Typography>
        </Box>

        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2">
            {t('approvalRequired')}
          </Typography>
        </Alert>

        <TextField
          label={t('messageLabel')}
          placeholder={t('messagePlaceholder')}
          multiline
          rows={3}
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 300 } }}
          helperText={`${message.length}/300`}
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {t('requestButton')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

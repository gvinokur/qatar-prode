'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  Alert,
  Box,
  CircularProgress,
  Divider
} from '@mui/material';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { cancelJoinRequestAction } from '@/app/actions/prode-group-join-request-actions';
import { HourglassEmpty as HourglassIcon } from '@mui/icons-material';
import { ProdeGroup } from '@/app/db/tables-definition';

type Props = {
  group: ProdeGroup;
  requestId: string;
  requestedAt: Date;
  memberCount?: number;
  tournamentId?: string;
};

export default function PendingRequestView({ group, requestId, requestedAt, memberCount, tournamentId }: Props) {
  const t = useTranslations('groups.pendingRequest');
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!confirm(t('confirmCancel'))) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await cancelJoinRequestAction(requestId);
      const redirectUrl = tournamentId
        ? `/${locale}/tournaments/${tournamentId}/friend-groups`
        : `/${locale}`;
      router.push(redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cancelFailed'));
      console.error('Error canceling join request:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Alert severity="info" icon={<HourglassIcon />} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {t('title')}
        </Typography>
        <Typography variant="body2">
          {t('message')}
        </Typography>
      </Alert>

      <Card>
        <CardHeader
          title={group.name}
          subheader={t('requestedOn', {
            date: new Intl.DateTimeFormat('default', { dateStyle: 'medium' }).format(new Date(requestedAt))
          })}
        />
        <Divider />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            {memberCount !== undefined && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('members', { count: memberCount })}
              </Typography>
            )}
          </Box>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {t('hiddenContent')}
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancel}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
            >
              {t('cancelButton')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

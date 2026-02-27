'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Chip,
  Box,
  CircularProgress
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { cancelJoinRequestAction } from '@/app/actions/prode-group-join-request-actions';
import { Mail as MailIcon } from '@mui/icons-material';

interface UserJoinRequest {
  id: string;
  group_id: string;
  group_name?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: Date;
  resolved_at?: Date | null;
}

type Props = {
  requests: UserJoinRequest[];
};

export default function PendingRequestsCard({ requests: initialRequests }: Props) {
  const t = useTranslations('groups.pendingRequests');
  const router = useRouter();
  const [requests, setRequests] = useState<UserJoinRequest[]>(initialRequests);
  const [loadingRequests, setLoadingRequests] = useState<Set<string>>(new Set());

  const handleCancel = async (requestId: string) => {
    if (!confirm(t('confirmCancel'))) {
      return;
    }

    setLoadingRequests(prev => new Set(prev).add(requestId));

    try {
      await cancelJoinRequestAction(requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      router.refresh();
    } catch (err) {
      console.error('Error canceling join request:', err);
    } finally {
      setLoadingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return t('timeAgo.today');
    } else if (diffDays === 1) {
      return t('timeAgo.yesterday');
    } else if (diffDays < 7) {
      return t('timeAgo.daysAgo', { count: diffDays });
    } else {
      return new Intl.DateTimeFormat('default', { dateStyle: 'short' }).format(new Date(date));
    }
  };

  const getNextEligibleDate = (resolvedAt: Date) => {
    const nextDate = new Date(resolvedAt);
    nextDate.setDate(nextDate.getDate() + 7);
    return nextDate;
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader title={t('title')} avatar={<MailIcon />} />
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            {t('noRequests')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={t('title')} avatar={<MailIcon />} />
      <CardContent>
        <List dense>
          {requests.map((request) => (
            <ListItem
              key={request.id}
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' },
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1
              }}
            >
              <ListItemText
                primary={request.group_name || t('unknownGroup')}
                secondary={
                  <Box component="span">
                    {formatDate(request.requested_at)}
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
                <Chip
                  label={t(`status.${request.status}`)}
                  color={
                    request.status === 'pending'
                      ? 'warning'
                      : request.status === 'approved'
                      ? 'success'
                      : 'error'
                  }
                  size="small"
                />
                {request.status === 'pending' && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleCancel(request.id)}
                    disabled={loadingRequests.has(request.id)}
                    startIcon={loadingRequests.has(request.id) ? <CircularProgress size={12} /> : undefined}
                  >
                    {t('cancel')}
                  </Button>
                )}
                {request.status === 'rejected' && request.resolved_at && (
                  <Typography variant="caption" color="text.secondary">
                    {t('canRequestAgain', {
                      date: new Intl.DateTimeFormat('default', { dateStyle: 'short' }).format(
                        getNextEligibleDate(request.resolved_at)
                      )
                    })}
                  </Typography>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

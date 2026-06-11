'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { approveJoinRequestAction, rejectJoinRequestAction } from '@/app/actions/prode-group-join-request-actions';
import { Locale } from '@/i18n.config';
import { PersonAdd as PersonAddIcon, Check as CheckIcon, Close as CloseIcon, PersonRemove as PersonRemoveIcon } from '@mui/icons-material';
import { trackEvent } from '@/app/utils/ga4';
import RemoveMembersDialog from './remove-members-dialog';

interface JoinRequest {
  id: string;
  user_id: string;
  user_nickname?: string | null;
  user_email?: string | null;
  requested_at: Date;
  request_source: string;
  status: string;
  message?: string | null;
}

interface Member {
  id: string;
  nombre: string;
  is_admin: boolean;
}

type Props = {
  groupId: string;
  initialRequests: JoinRequest[];
  locale?: Locale;
  tournamentId?: string;
  members?: Member[];
  ownerId?: string;
  isOwner?: boolean;
};

export default function JoinRequestManager({ groupId, initialRequests, locale = 'es', tournamentId, members: initialMembers, ownerId, isOwner = false }: Readonly<Props>) {
  const t = useTranslations('groups.joinRequests');
  const router = useRouter();
  const [requests, setRequests] = useState<JoinRequest[]>(initialRequests);
  const [loadingRequests, setLoadingRequests] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [removeMembersOpen, setRemoveMembersOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers ?? []);

  const handleApprove = async (requestId: string) => {
    setLoadingRequests(prev => new Set(prev).add(requestId));
    setError(null);
    setSuccessMessage(null);

    const previousRequests = [...requests];
    setRequests(prev => prev.filter(r => r.id !== requestId));

    try {
      const result = await approveJoinRequestAction(requestId, groupId, tournamentId);
      setSuccessMessage(t('approveSuccess'));
      router.refresh();

      if (result && result.success && result.analyticsEvent) {
        trackEvent(result.analyticsEvent.name, result.analyticsEvent.params);
      }
    } catch (err) {
      setRequests(previousRequests);
      setError(err instanceof Error ? err.message : t('approveFailed'));
      console.error('Error approving join request:', err);
    } finally {
      setLoadingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    setLoadingRequests(prev => new Set(prev).add(requestId));
    setError(null);
    setSuccessMessage(null);

    const previousRequests = [...requests];
    setRequests(prev => prev.filter(r => r.id !== requestId));

    try {
      await rejectJoinRequestAction(requestId, groupId);
      setSuccessMessage(t('rejectSuccess'));
      router.refresh();
    } catch (err) {
      setRequests(previousRequests);
      setError(err instanceof Error ? err.message : t('rejectFailed'));
      console.error('Error rejecting join request:', err);
    } finally {
      setLoadingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRemoveSuccess = (removedIds: string[]) => {
    setMembers(prev => prev.filter(m => !removedIds.includes(m.id)));
    setSuccessMessage(t('removeMembersDialog.success'));
    setRemoveMembersOpen(false);
    router.refresh();
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return t('timeAgo.minutes', { count: diffMins });
    } else if (diffHours < 24) {
      return t('timeAgo.hours', { count: diffHours });
    } else if (diffDays < 7) {
      return t('timeAgo.days', { count: diffDays });
    } else {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date));
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const hasRemovableMembers = ownerId !== undefined && members.some(m => {
    if (m.id === ownerId) return false;
    if (m.is_admin && !isOwner) return false;
    return true;
  });

  const renderRequestItem = (request: JoinRequest, isPending: boolean) => (
    <ListItem
      key={request.id}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' }
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: isPending ? 'primary.main' : 'text.disabled' }}>
          {(request.user_nickname || request.user_email || 'U')[0].toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={request.user_nickname || request.user_email}
        secondary={
          <Box component="span">
            <Typography variant="body2" component="span" color="text.secondary">
              {formatDate(request.requested_at)}
            </Typography>
            {' • '}
            <Typography variant="body2" component="span" color="text.secondary">
              {t(`source.${request.request_source}`)}
            </Typography>
            {request.message && (
              <Typography variant="body2" component="span" display="block" sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                &ldquo;{request.message}&rdquo;
              </Typography>
            )}
          </Box>
        }
      />
      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
        <Button
          variant={isPending ? 'contained' : 'outlined'}
          color="success"
          size="small"
          startIcon={loadingRequests.has(request.id) ? <CircularProgress size={16} /> : <CheckIcon />}
          onClick={() => handleApprove(request.id)}
          disabled={loadingRequests.has(request.id)}
        >
          {isPending ? t('approve') : t('approveRejected')}
        </Button>
        {isPending && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={loadingRequests.has(request.id) ? <CircularProgress size={16} /> : <CloseIcon />}
            onClick={() => handleReject(request.id)}
            disabled={loadingRequests.has(request.id)}
          >
            {t('reject')}
          </Button>
        )}
      </Box>
    </ListItem>
  );

  return (
    <>
      <Card>
        <CardHeader title={t('title')} avatar={<PersonAddIcon />} />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {pendingRequests.length === 0 && rejectedRequests.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
              {t('noPendingRequests')}
            </Typography>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <List>
                  {pendingRequests.map((request) => renderRequestItem(request, true))}
                </List>
              )}
              {rejectedRequests.length > 0 && (
                <Box sx={{ mt: pendingRequests.length > 0 ? 2 : 0 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('recentlyRejectedTitle')}
                  </Typography>
                  <List>
                    {rejectedRequests.map((request) => renderRequestItem(request, false))}
                  </List>
                </Box>
              )}
            </>
          )}

          {hasRemovableMembers && (
            <>
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<PersonRemoveIcon />}
                  onClick={() => setRemoveMembersOpen(true)}
                >
                  {t('removeMembersButton')}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {hasRemovableMembers && ownerId && (
        <RemoveMembersDialog
          open={removeMembersOpen}
          onClose={() => setRemoveMembersOpen(false)}
          onSuccess={handleRemoveSuccess}
          groupId={groupId}
          members={members}
          ownerId={ownerId}
          isOwner={isOwner}
        />
      )}
    </>
  );
}

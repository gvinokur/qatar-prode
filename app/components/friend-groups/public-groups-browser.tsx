'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Grid,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { Button } from '../mui-wrappers/';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import TournamentGroupCard, { DiscoveryGroupData } from '../tournament-page/tournament-group-card';
import { requestToJoinGroup } from '../../actions/prode-group-join-request-actions';

interface PublicGroupsBrowserProps {
  readonly initialGroups: DiscoveryGroupData[];
  readonly initialSearchTerm: string;
  readonly initialPage: number;
  readonly totalPages: number;
  readonly totalCount: number;
  readonly tournamentId: string;
  readonly currentUserId?: string | null;
}

export default function PublicGroupsBrowser({
  initialGroups,
  initialSearchTerm,
  initialPage,
  totalPages,
  totalCount,
  tournamentId,
  currentUserId
}: PublicGroupsBrowserProps) {
  const t = useTranslations('groups.discovery');
  const tPagination = useTranslations('groups.pagination');
  const tJoinRequest = useTranslations('groups.joinRequest');
  const tJoin = useTranslations('groups.join');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const [searchValue, setSearchValue] = useState(initialSearchTerm);
  const [groups, setGroups] = useState(initialGroups);
  const [isPending, startTransition] = useTransition();
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchValue.trim();
      const currentSearch = searchParams.get('search') ?? '';
      if (trimmed !== currentSearch) {
        const params = new URLSearchParams(searchParams.toString());
        if (trimmed) {
          params.set('search', trimmed);
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`);
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue, searchParams, pathname, router]);

  // Sync groups when URL changes (server renders new data)
  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleRequestJoin = (groupId: string) => {
    if (!currentUserId) {
      // Redirect to login with returnUrl
      const returnUrl = encodeURIComponent(globalThis.location.href);
      router.push(`/${locale}/login?returnUrl=${returnUrl}`);
      return;
    }
    setPendingGroupId(groupId);
    setJoinMessage('');
  };

  const handleConfirmJoin = async () => {
    if (!pendingGroupId) return;
    setIsSubmitting(true);
    const messageToSend = joinMessage.trim() === '' ? undefined : joinMessage.trim();
    try {
      await requestToJoinGroup(pendingGroupId, 'discovery', locale as 'en' | 'es', tournamentId, messageToSend);
      setGroups(prev =>
        prev.map(g => g.id === pendingGroupId ? { ...g, userStatus: 'pending' as const } : g)
      );
    } catch (error) {
      console.error('Failed to request to join group:', error);
    } finally {
      setIsSubmitting(false);
      setPendingGroupId(null);
      setJoinMessage('');
    }
  };

  const handleCancelJoin = () => {
    setPendingGroupId(null);
    setJoinMessage('');
  };

  return (
    <Box>
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={t('searchPlaceholder')}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }
          }}
        />
      </Box>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary">
            {initialSearchTerm
              ? t('noResultsSearch', { search: initialSearchTerm })
              : t('noResults')}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3, opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {groups.map((group) => (
            <Grid size={{ xs: 12, sm: 12, md: 6 }} key={group.id}>
              <TournamentGroupCard
                variant="discovery"
                group={group}
                tournamentId={tournamentId}
                onRequestJoin={handleRequestJoin}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ChevronLeftIcon />}
            onClick={() => handlePageChange(initialPage - 1)}
            disabled={initialPage <= 1 || isPending}
          >
            {tPagination('previous')}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {tPagination('pageInfo', { current: initialPage, total: totalPages })}
          </Typography>
          <Button
            variant="outlined"
            endIcon={<ChevronRightIcon />}
            onClick={() => handlePageChange(initialPage + 1)}
            disabled={initialPage >= totalPages || isPending}
          >
            {tPagination('next')}
          </Button>
        </Stack>
      )}

      {/* Join Request Dialog */}
      <Dialog open={pendingGroupId !== null} onClose={handleCancelJoin} maxWidth="sm" fullWidth>
        <DialogTitle>{tJoinRequest('requestButton')}</DialogTitle>
        <DialogContent>
          <TextField
            label={tJoinRequest('messageLabel')}
            placeholder={tJoinRequest('messagePlaceholder')}
            multiline
            rows={3}
            fullWidth
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
            inputProps={{ maxLength: 300 }}
            helperText={`${joinMessage.length}/300`}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelJoin} disabled={isSubmitting}>
            {tJoin('buttons.cancel')}
          </Button>
          <Button
            onClick={handleConfirmJoin}
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {tJoinRequest('requestButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

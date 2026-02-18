'use client';

import { useState, useEffect } from 'react';
import {
  Popover,
  Box,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { getBoostAllocationBreakdownAction } from '../actions/game-boost-actions';

interface BoostInfoPopoverProps {
  readonly boostType: 'silver' | 'golden';
  readonly used: number;
  readonly max: number;
  readonly tournamentId?: string;
  readonly open: boolean;
  readonly anchorEl: HTMLElement | null;
  readonly onClose: () => void;
}

interface BreakdownData {
  byGroup: { groupLetter: string; count: number }[];
  playoffCount: number;
  totalBoosts: number;
  scoredGamesCount: number;
  totalPointsEarned: number;
}

// Helper component for loading state
function LoadingState({ t }: { readonly t: any }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
      <CircularProgress size={16} />
      <Typography variant="caption" color="text.secondary">
        {t('boostStats.loading')}
      </Typography>
    </Box>
  );
}

// Helper component for error state
function ErrorState({ message }: { readonly message: string }) {
  return (
    <Typography variant="caption" color="error">
      {message}
    </Typography>
  );
}

// Helper component for empty state
function EmptyState({ t }: { readonly t: any }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
      {t('boostStats.noBoostsUsed')}
    </Typography>
  );
}

// Helper component for breakdown content
function BreakdownContent({
  breakdown,
  used,
  max,
  t,
}: {
  readonly breakdown: BreakdownData;
  readonly used: number;
  readonly max: number;
  readonly t: any;
}) {
  const hasNoBoosts = breakdown.byGroup.length === 0 && breakdown.playoffCount === 0;

  if (hasNoBoosts) {
    return <EmptyState t={t} />;
  }

  return (
    <>
      {breakdown.byGroup.map((group) => (
        <Typography key={group.groupLetter} variant="body2" sx={{ py: 0.5 }}>
          • {t('boostStats.group', { letter: group.groupLetter })}: {group.count}{' '}
          {group.count === 1 ? t('boostStats.game') : t('boostStats.games')}
        </Typography>
      ))}
      {breakdown.playoffCount > 0 && (
        <Typography variant="body2" sx={{ py: 0.5 }}>
          • {t('boostStats.playoffs')} {breakdown.playoffCount}{' '}
          {breakdown.playoffCount === 1 ? t('boostStats.game') : t('boostStats.games')}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {t('boostStats.totalUsed', { used, max })}
      </Typography>
    </>
  );
}

// Helper component for distribution section
function DistributionSection({
  tournamentId,
  loading,
  error,
  breakdown,
  used,
  max,
  t,
}: {
  readonly tournamentId?: string;
  readonly loading: boolean;
  readonly error: string | null;
  readonly breakdown: BreakdownData | null;
  readonly used: number;
  readonly max: number;
  readonly t: any;
}) {
  if (tournamentId === undefined) {
    return (
      <Typography variant="caption" color="text.secondary">
        {t('boostStats.infoUnavailable')}
      </Typography>
    );
  }

  if (loading) {
    return <LoadingState t={t} />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (breakdown) {
    return <BreakdownContent breakdown={breakdown} used={used} max={max} t={t} />;
  }

  return null;
}

// Helper component for performance section
function PerformanceSection({
  breakdown,
  t
}: {
  readonly breakdown: BreakdownData | null;
  readonly t: any;
}) {
  if (!breakdown || breakdown.scoredGamesCount === 0) {
    return null;
  }

  const pointsLabel = breakdown.totalPointsEarned === 1 ? t('boostStats.extraPoint') : t('boostStats.extraPoints');
  const gamesLabel =
    breakdown.scoredGamesCount === 1
      ? t('boostStats.qualifiedBoostedGame')
      : t('boostStats.qualifiedBoostedGames');

  return (
    <>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {t('boostStats.performance')}
      </Typography>
      <Typography variant="body2" sx={{ py: 1 }}>
        {t('boostStats.earnedPoints', {
          points: breakdown.totalPointsEarned,
          pointsLabel,
          count: breakdown.scoredGamesCount,
          gamesLabel
        })}
      </Typography>
    </>
  );
}

export default function BoostInfoPopover({
  boostType,
  used,
  max,
  tournamentId,
  open,
  anchorEl,
  onClose,
}: BoostInfoPopoverProps) {
  const t = useTranslations('predictions');
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && tournamentId) {
      setLoading(true);
      setError(null);
      getBoostAllocationBreakdownAction(tournamentId, boostType)
        .then((data) => {
          setBreakdown(data);
        })
        .catch((err) => {
          console.error('Error fetching boost breakdown:', err);
          setError(t('boostStats.errorLoading'));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, tournamentId, boostType, t]);

  const title = t(`boost.${boostType}.title`);
  const description = t(`boost.${boostType}.description`);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Box sx={{ p: 2, maxWidth: 320 }}>
        {/* Header and Description - Always visible */}
        <Typography variant="subtitle2" fontWeight="bold">
          🏆 {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Distribution Section - Always visible */}
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          {t('boostStats.distribution')}
        </Typography>

        <DistributionSection
          tournamentId={tournamentId}
          loading={loading}
          error={error}
          breakdown={breakdown}
          used={used}
          max={max}
          t={t}
        />

        {/* Performance Section - Conditional */}
        <PerformanceSection breakdown={breakdown} t={t} />
      </Box>
    </Popover>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Popover,
  Box,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
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
function LoadingState() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
      <CircularProgress size={16} />
      <Typography variant="caption" color="text.secondary">
        Cargando...
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
function EmptyState() {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
      Aún no has usado boosts de este tipo
    </Typography>
  );
}

// Helper component for breakdown content
function BreakdownContent({
  breakdown,
  used,
  max,
}: {
  readonly breakdown: BreakdownData;
  readonly used: number;
  readonly max: number;
}) {
  const hasNoBoosts = breakdown.byGroup.length === 0 && breakdown.playoffCount === 0;

  if (hasNoBoosts) {
    return <EmptyState />;
  }

  return (
    <>
      {breakdown.byGroup.map((group) => (
        <Typography key={group.groupLetter} variant="body2" sx={{ py: 0.5 }}>
          • Grupo {group.groupLetter}: {group.count}{' '}
          {group.count === 1 ? 'partido' : 'partidos'}
        </Typography>
      ))}
      {breakdown.playoffCount > 0 && (
        <Typography variant="body2" sx={{ py: 0.5 }}>
          • Playoffs: {breakdown.playoffCount}{' '}
          {breakdown.playoffCount === 1 ? 'partido' : 'partidos'}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Total: {used} de {max} usados
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
}: {
  readonly tournamentId?: string;
  readonly loading: boolean;
  readonly error: string | null;
  readonly breakdown: BreakdownData | null;
  readonly used: number;
  readonly max: number;
}) {
  if (tournamentId === undefined) {
    return (
      <Typography variant="caption" color="text.secondary">
        Información no disponible
      </Typography>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (breakdown) {
    return <BreakdownContent breakdown={breakdown} used={used} max={max} />;
  }

  return null;
}

// Helper component for performance section
function PerformanceSection({ breakdown }: { readonly breakdown: BreakdownData | null }) {
  if (!breakdown || breakdown.scoredGamesCount === 0) {
    return null;
  }

  const pointsLabel = breakdown.totalPointsEarned === 1 ? 'punto extra' : 'puntos extra';
  const gamesLabel =
    breakdown.scoredGamesCount === 1
      ? 'partido boosteado calificado'
      : 'partidos boosteados calificados';

  return (
    <>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        RENDIMIENTO
      </Typography>
      <Typography variant="body2" sx={{ py: 1 }}>
        Ganaste {breakdown.totalPointsEarned} {pointsLabel} en {breakdown.scoredGamesCount}{' '}
        {gamesLabel}
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
          setError('Error al cargar datos. Intenta de nuevo.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, tournamentId, boostType]);

  const title = boostType === 'silver' ? 'Multiplicador x2' : 'Multiplicador x3';
  const description =
    boostType === 'silver'
      ? 'Duplica los puntos obtenidos en este partido'
      : 'Triplica los puntos obtenidos en este partido';

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
          DISTRIBUCIÓN DE BOOSTS
        </Typography>

        <DistributionSection
          tournamentId={tournamentId}
          loading={loading}
          error={error}
          breakdown={breakdown}
          used={used}
          max={max}
        />

        {/* Performance Section - Conditional */}
        <PerformanceSection breakdown={breakdown} />
      </Box>
    </Popover>
  );
}

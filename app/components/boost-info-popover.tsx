'use client';

import { useState, useEffect } from 'react';
import {
  Popover,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { getBoostAllocationBreakdownAction } from '../actions/game-boost-actions';

interface BoostInfoPopoverProps {
  boostType: 'silver' | 'golden';
  used: number;
  max: number;
  tournamentId?: string;
  totalGames: number;
  predictedGames: number;
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const RISK_WARNING_BUFFER = 3;

export default function BoostInfoPopover({
  boostType,
  used,
  max,
  tournamentId,
  totalGames,
  predictedGames,
  open,
  anchorEl,
  onClose,
}: BoostInfoPopoverProps) {
  const [breakdown, setBreakdown] = useState<{
    byGroup: { groupLetter: string; count: number }[];
    playoffCount: number;
    totalBoosts: number;
    scoredGamesCount: number;
    totalPointsEarned: number;
  } | null>(null);
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

  const unusedBoosts = max - used;
  const gamesLeft = totalGames - predictedGames;
  const showWarning = unusedBoosts > 0 && gamesLeft < unusedBoosts + RISK_WARNING_BUFFER;

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

        {!tournamentId ? (
          <Typography variant="caption" color="text.secondary">
            Información no disponible
          </Typography>
        ) : loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Cargando...
            </Typography>
          </Box>
        ) : error ? (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        ) : breakdown ? (
          <>
            {breakdown.byGroup.length === 0 && breakdown.playoffCount === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                Aún no has usado boosts de este tipo
              </Typography>
            ) : (
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
            )}
          </>
        ) : null}

        {/* Risk Warning Section - Conditional */}
        {showWarning && (
          <>
            <Divider sx={{ my: 2 }} />
            <Alert severity="warning" sx={{ py: 0.5 }}>
              <Typography variant="caption" fontWeight="bold">
                ⚠️ ALERTA DE RIESGO
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Tienes {unusedBoosts} {unusedBoosts === 1 ? 'boost' : 'boosts'} sin usar y solo{' '}
                {gamesLeft === 0 ? 'no quedan' : gamesLeft === 1 ? `queda ${gamesLeft}` : `quedan ${gamesLeft}`}{' '}
                {gamesLeft === 1 ? 'partido' : 'partidos'} para predecir.
                {gamesLeft > 0 && ' ¡Úsalo antes de que cierre!'}
              </Typography>
            </Alert>
          </>
        )}

        {/* Performance Section - Conditional */}
        {breakdown && breakdown.scoredGamesCount > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              RENDIMIENTO
            </Typography>
            <Typography variant="body2" sx={{ py: 1 }}>
              Ganaste {breakdown.totalPointsEarned}{' '}
              {breakdown.totalPointsEarned === 1 ? 'punto extra' : 'puntos extra'} en{' '}
              {breakdown.scoredGamesCount}{' '}
              {breakdown.scoredGamesCount === 1 ? 'partido boosteado calificado' : 'partidos boosteados calificados'}
            </Typography>
          </>
        )}
      </Box>
    </Popover>
  );
}

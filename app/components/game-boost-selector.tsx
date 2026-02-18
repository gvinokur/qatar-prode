'use client'

import { useState, useEffect, useContext } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { setGameBoostAction } from '../actions/game-boost-actions';
import { BoostBadge, BoostCountBadge } from './boost-badge';
import { GuessesContext } from './context-providers/guesses-context-provider';

interface GameBoostSelectorProps {
  gameId: string;
  gameDate: Date;
  currentBoostType: 'silver' | 'golden' | null;
  tournamentId: string;
  disabled?: boolean;
  noPrediction?: boolean;
}

export default function GameBoostSelector({
  gameId,
  gameDate,
  currentBoostType,
  tournamentId,
  disabled = false,
  noPrediction = false
}: GameBoostSelectorProps) {
  const t = useTranslations('predictions');
  const theme = useTheme();
  const { boostCounts } = useContext(GuessesContext);
  const [boostType, setBoostType] = useState<'silver' | 'golden' | null>(currentBoostType);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if game has started (within 1 hour)
  const ONE_HOUR = 60 * 60 * 1000;
  const gameHasStarted = Date.now() + ONE_HOUR > gameDate.getTime();
  const isDisabled = disabled || gameHasStarted || noPrediction;

  const getDisabledReason = () => {
    if (noPrediction) return t('boost.enterPredictionFirst');
    if (gameHasStarted) return t('boost.gameStarted');
    return '';
  };

  useEffect(() => {
    setBoostType(currentBoostType);
  }, [currentBoostType]);

  const handleBoostClick = (type: 'silver' | 'golden') => {
    if (isDisabled) return;

    // If clicking the same boost, remove it
    if (boostType === type) {
      handleBoostChange(null);
    } else {
      // Check if user has boosts available
      if (!boostCounts) return;

      if (type === 'silver' && boostCounts.silver.used >= boostCounts.silver.max && boostCounts.silver.max > 0) {
        setErrorMessage(t('boost.silver.allUsed', { max: boostCounts.silver.max }));
        setDialogOpen(true);
        return;
      }

      if (type === 'golden' && boostCounts.golden.used >= boostCounts.golden.max && boostCounts.golden.max > 0) {
        setErrorMessage(t('boost.golden.allUsed', { max: boostCounts.golden.max }));
        setDialogOpen(true);
        return;
      }

      handleBoostChange(type);
    }
  };

  const handleBoostChange = async (newBoostType: 'silver' | 'golden' | null) => {
    setLoading(true);
    setErrorMessage('');

    try {
      await setGameBoostAction(gameId, newBoostType);
      setBoostType(newBoostType);
      // Context will automatically update counts when gameGuesses changes
    } catch (error: any) {
      setErrorMessage(error.message || 'Error updating boost');
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (boostCounts.silver.max === 0 && boostCounts.golden.max === 0) {
    return null; // Boosts disabled for this tournament
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Silver Boost Button */}
      {boostCounts.silver.max > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip
            title={
              isDisabled
                ? getDisabledReason()
                : boostType === 'silver'
                ? t('boost.silver.clickToRemove')
                : t('boost.silver.usage', { used: boostCounts.silver.used, max: boostCounts.silver.max })
            }
          >
            <span>
              <IconButton
                size="small"
                onClick={() => handleBoostClick('silver')}
                disabled={isDisabled || loading}
                sx={{
                  color: boostType === 'silver' ? theme.palette.accent.silver.main : 'action.disabled',
                  '&:hover': {
                    color: theme.palette.accent.silver.main,
                    backgroundColor: alpha(theme.palette.accent.silver.main, 0.1)
                  },
                  ...(boostType === 'silver' && {
                    backgroundColor: alpha(theme.palette.accent.silver.main, 0.2),
                    animation: 'pulse 2s infinite'
                  })
                }}
              >
                <StarIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <BoostCountBadge type="silver" used={boostCounts.silver.used} max={boostCounts.silver.max} />
        </Box>
      )}

      {/* Golden Boost Button */}
      {boostCounts.golden.max > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip
            title={
              isDisabled
                ? getDisabledReason()
                : boostType === 'golden'
                ? t('boost.golden.clickToRemove')
                : t('boost.golden.usage', { used: boostCounts.golden.used, max: boostCounts.golden.max })
            }
          >
            <span>
              <IconButton
                size="small"
                onClick={() => handleBoostClick('golden')}
                disabled={isDisabled || loading}
                sx={{
                  color: boostType === 'golden' ? theme.palette.accent.gold.main : 'action.disabled',
                  '&:hover': {
                    color: theme.palette.accent.gold.main,
                    backgroundColor: alpha(theme.palette.accent.gold.main, 0.1)
                  },
                  ...(boostType === 'golden' && {
                    backgroundColor: alpha(theme.palette.accent.gold.main, 0.2),
                    animation: 'pulse 2s infinite'
                  })
                }}
              >
                <TrophyIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <BoostCountBadge type="golden" used={boostCounts.golden.used} max={boostCounts.golden.max} />
        </Box>
      )}

      {/* Boost indicator badge - shown when boost is applied to current game */}
      {boostType && (
        <BoostBadge type={boostType} />
      )}

      {/* Error Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {t('boost.limitReached')}
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {t('boost.changeAllowed')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Add pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </Box>
  );
}

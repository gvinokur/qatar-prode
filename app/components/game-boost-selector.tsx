'use client'

import { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { setGameBoostAction, getBoostCountsAction } from '../actions/game-boost-actions';

interface GameBoostSelectorProps {
  gameId: string;
  gameNumber: number;
  gameDate: Date;
  currentBoostType: 'silver' | 'golden' | null;
  tournamentId: string;
  userId: string;
  disabled?: boolean;
}

interface BoostCounts {
  silverUsed: number;
  silverMax: number;
  goldenUsed: number;
  goldenMax: number;
}

export default function GameBoostSelector({
  gameId,
  gameNumber,
  gameDate,
  currentBoostType,
  tournamentId,
  userId,
  disabled = false
}: GameBoostSelectorProps) {
  const [boostType, setBoostType] = useState<'silver' | 'golden' | null>(currentBoostType);
  const [boostCounts, setBoostCounts] = useState<BoostCounts | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if game has started (within 1 hour)
  const ONE_HOUR = 60 * 60 * 1000;
  const gameHasStarted = Date.now() + ONE_HOUR > gameDate.getTime();
  const isDisabled = disabled || gameHasStarted;

  useEffect(() => {
    const fetchBoostCounts = async () => {
      try {
        const counts = await getBoostCountsAction(tournamentId, userId);
        setBoostCounts(counts);
      } catch (error) {
        console.error('Error fetching boost counts:', error);
      }
    };
    fetchBoostCounts();
  }, [tournamentId, userId]);

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

      if (type === 'silver' && boostCounts.silverUsed >= boostCounts.silverMax && boostCounts.silverMax > 0) {
        setErrorMessage(`You've used all ${boostCounts.silverMax} silver boosts. Remove one from another game first.`);
        setDialogOpen(true);
        return;
      }

      if (type === 'golden' && boostCounts.goldenUsed >= boostCounts.goldenMax && boostCounts.goldenMax > 0) {
        setErrorMessage(`You've used all ${boostCounts.goldenMax} golden boosts. Remove one from another game first.`);
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
      await setGameBoostAction(gameId, userId, newBoostType);
      setBoostType(newBoostType);

      // Update counts
      if (boostCounts) {
        const newCounts = { ...boostCounts };

        // Remove old boost
        if (boostType === 'silver') newCounts.silverUsed--;
        if (boostType === 'golden') newCounts.goldenUsed--;

        // Add new boost
        if (newBoostType === 'silver') newCounts.silverUsed++;
        if (newBoostType === 'golden') newCounts.goldenUsed++;

        setBoostCounts(newCounts);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error updating boost');
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (!boostCounts || (boostCounts.silverMax === 0 && boostCounts.goldenMax === 0)) {
    return null; // Boosts disabled for this tournament
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {/* Silver Boost Button */}
      {boostCounts.silverMax > 0 && (
        <Tooltip
          title={
            isDisabled
              ? 'Game has started'
              : boostType === 'silver'
              ? 'Click to remove Silver Boost (2x points)'
              : `Silver Boost (2x points) - ${boostCounts.silverUsed}/${boostCounts.silverMax} used`
          }
        >
          <span>
            <IconButton
              size="small"
              onClick={() => handleBoostClick('silver')}
              disabled={isDisabled || loading}
              sx={{
                color: boostType === 'silver' ? '#C0C0C0' : 'action.disabled',
                '&:hover': {
                  color: '#C0C0C0',
                  backgroundColor: 'rgba(192, 192, 192, 0.1)'
                },
                ...(boostType === 'silver' && {
                  backgroundColor: 'rgba(192, 192, 192, 0.2)',
                  animation: 'pulse 2s infinite'
                })
              }}
            >
              <StarIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Golden Boost Button */}
      {boostCounts.goldenMax > 0 && (
        <Tooltip
          title={
            isDisabled
              ? 'Game has started'
              : boostType === 'golden'
              ? 'Click to remove Golden Boost (3x points)'
              : `Golden Boost (3x points) - ${boostCounts.goldenUsed}/${boostCounts.goldenMax} used`
          }
        >
          <span>
            <IconButton
              size="small"
              onClick={() => handleBoostClick('golden')}
              disabled={isDisabled || loading}
              sx={{
                color: boostType === 'golden' ? '#FFD700' : 'action.disabled',
                '&:hover': {
                  color: '#FFD700',
                  backgroundColor: 'rgba(255, 215, 0, 0.1)'
                },
                ...(boostType === 'golden' && {
                  backgroundColor: 'rgba(255, 215, 0, 0.2)',
                  animation: 'pulse 2s infinite'
                })
              }}
            >
              <TrophyIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Boost indicator chip */}
      {boostType && (
        <Chip
          label={boostType === 'silver' ? '2x' : '3x'}
          size="small"
          sx={{
            backgroundColor: boostType === 'silver' ? 'rgba(192, 192, 192, 0.2)' : 'rgba(255, 215, 0, 0.2)',
            color: boostType === 'silver' ? '#C0C0C0' : '#FFD700',
            fontWeight: 'bold',
            fontSize: '0.7rem',
            height: '20px'
          }}
        />
      )}

      {/* Error Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Boost Limit Reached
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
            You can change your boost selections at any time before the games start.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
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

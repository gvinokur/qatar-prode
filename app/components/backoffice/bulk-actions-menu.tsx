'use client'

import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Casino as CasinoIcon,
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import ConfirmDialog from '../confirm-dialog';
import { autoFillGameScores, clearGameScores } from '../../actions/game-score-generator-actions';

interface BulkActionsMenuProps {
  readonly groupId?: string;
  readonly playoffRoundId?: string;
  readonly sectionName: string; // e.g., "Group A", "Quarterfinals"
  readonly onComplete?: () => void; // Callback after successful operation
}

export default function BulkActionsMenu({
  groupId,
  playoffRoundId,
  sectionName,
  onComplete
}: BulkActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAutoFill = async () => {
    handleMenuClose();
    setLoading(true);

    try {
      const result = await autoFillGameScores(groupId, playoffRoundId);

      if (result.success) {
        const filledCount = result.filledCount ?? 0;
        const skippedCount = result.skippedCount ?? 0;

        let message = `Auto-filled ${filledCount} ${filledCount === 1 ? 'game' : 'games'} in ${sectionName}`;
        if (skippedCount > 0) {
          message += ` (skipped ${skippedCount} published ${skippedCount === 1 ? 'game' : 'games'})`;
        }

        setSnackbarMessage(message);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Call completion callback to refresh data
        if (onComplete) {
          onComplete();
        }
      } else {
        setSnackbarMessage(`Failed to auto-fill scores: ${result.error}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (_error) {
      setSnackbarMessage('An unexpected error occurred');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClearClick = () => {
    handleMenuClose();
    setShowConfirmDialog(true);
  };

  const handleClearConfirm = async () => {
    setShowConfirmDialog(false);
    setLoading(true);

    try {
      const result = await clearGameScores(groupId, playoffRoundId);

      if (result.success) {
        const clearedCount = result.clearedCount ?? 0;
        setSnackbarMessage(`Cleared scores from ${clearedCount} ${clearedCount === 1 ? 'game' : 'games'} in ${sectionName}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Call completion callback to refresh data
        if (onComplete) {
          onComplete();
        }
      } else {
        setSnackbarMessage(`Failed to clear scores: ${result.error}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (_error) {
      setSnackbarMessage('An unexpected error occurred');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCancel = () => {
    setShowConfirmDialog(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={handleMenuOpen}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} /> : <SettingsIcon />}
      >
        Bulk Actions
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem onClick={handleAutoFill} disabled={loading}>
          <ListItemIcon>
            <CasinoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Auto-fill Scores</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleClearClick} disabled={loading}>
          <ListItemIcon>
            <DeleteSweepIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Clear All Scores</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={showConfirmDialog}
        title={`Clear All Scores in ${sectionName}?`}
        message={`This will remove all scores and set all games to DRAFT status in ${sectionName}. This action cannot be undone.`}
        onConfirm={handleClearConfirm}
        onCancel={handleClearCancel}
        confirmText="Clear Scores"
        cancelText="Cancel"
        confirmColor="warning"
        loading={loading}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

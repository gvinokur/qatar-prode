'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Team } from '../../../db/tables-definition';

interface TeamStatsEditDialogProps {
  open: boolean;
  onClose: () => void;
  teams: { [key: string]: Team };
  teamIds: string[];
  conductScores: { [teamId: string]: number };
  onSave: (conductScores: { [teamId: string]: number }) => Promise<void>;
}

/**
 * Dialog for editing team conduct scores
 *
 * Conduct score calculation:
 * - +1 point per yellow card
 * - +3 points per indirect red card (yellow + red in same match)
 * - +4 points per direct red card
 *
 * Lower scores are better for tiebreaker purposes
 */
const TeamStatsEditDialog: React.FC<TeamStatsEditDialogProps> = ({
  open,
  onClose,
  teams,
  teamIds,
  conductScores,
  onSave,
}) => {
  const [localScores, setLocalScores] = useState<{ [teamId: string]: number }>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Initialize local scores when dialog opens
      const scores: { [teamId: string]: number } = {};
      teamIds.forEach(teamId => {
        scores[teamId] = conductScores[teamId] || 0;
      });
      setLocalScores(scores);
      setError(null);
    }
  }, [open, teamIds, conductScores]);

  const handleScoreChange = (teamId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setLocalScores(prev => ({
        ...prev,
        [teamId]: numValue,
      }));
      setError(null);
    } else if (value === '') {
      setLocalScores(prev => ({
        ...prev,
        [teamId]: 0,
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(localScores);
      onClose();
    } catch (err) {
      setError('Error saving conduct scores. Please try again.');
      console.error('Error saving conduct scores:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Team Conduct Scores</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Conduct Score Calculation:
            </Typography>
            <Typography variant="body2" component="div">
              • Yellow card: +1 point
              <br />
              • Indirect red card (yellow + red in same match): +3 points
              <br />
              • Direct red card: +4 points
              <br />
              <br />
              <strong>Note:</strong> Lower scores are better. Conduct score is used as a
              tiebreaker after points, goal difference, and goals scored.
            </Typography>
          </Alert>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team</TableCell>
                <TableCell align="center">Conduct Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teamIds.map(teamId => (
                <TableRow key={teamId}>
                  <TableCell>{teams[teamId]?.name || 'Unknown'}</TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={localScores[teamId] || 0}
                      onChange={(e) => handleScoreChange(teamId, e.target.value)}
                      inputProps={{
                        min: 0,
                        step: 1,
                      }}
                      size="small"
                      sx={{ width: '100px' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeamStatsEditDialog;

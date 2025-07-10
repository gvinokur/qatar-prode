'use client'

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Checkbox,
  FormControl,
  FormControlLabel
} from "@mui/material";
import { createOrUpdatePlayoffRound } from "../../../actions/tournament-actions";
import {PlayoffRound, PlayoffRoundNew, PlayoffRoundUpdate} from "../../../db/tables-definition";

interface PlayoffRoundDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSave: () => void;
  readonly tournamentId: string;
  readonly round: PlayoffRound | null;
  readonly nextOrder?: number;
}

export default function PlayoffRoundDialog({
  open,
  onClose,
  onSave,
  tournamentId,
  round,
  nextOrder = 1
}: PlayoffRoundDialogProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [roundName, setRoundName] = useState<string>('');
  const [roundOrder, setRoundOrder] = useState<number>(nextOrder);
  const [totalGames, setTotalGames] = useState<number>(1);
  const [isFinal, setIsFinal] = useState<boolean | undefined>(false)
  const [isThirdPlace, setIsThirdPlace] = useState<boolean | undefined>(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Initialize form when dialog opens or round changes
  useEffect(() => {
    if (open) {
      if (round) {
        // Edit mode
        setRoundName(round.round_name);
        setRoundOrder(round.round_order);
        setTotalGames(round.total_games);
        setIsFinal(round.is_final);
        setIsThirdPlace(round.is_third_place)
      } else {
        // Create mode
        setRoundName('');
        setRoundOrder(nextOrder);
        setTotalGames(1);
        setIsFinal(false);
        setIsThirdPlace(false);
      }
      setErrors({});
    }
  }, [open, round, nextOrder]);

  // Validate form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!roundName.trim()) {
      newErrors.name = 'Round name is required';
    }

    if (!roundOrder || roundOrder < 1) {
      newErrors.order = 'Round order must be a positive number';
    }

    if (!totalGames || totalGames < 1) {
      newErrors.matchesCount = 'Matches count must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const roundData: PlayoffRoundNew | PlayoffRoundUpdate = {
        id: round?.id,
        tournament_id: tournamentId,
        round_name: roundName,
        round_order: roundOrder,
        total_games: totalGames,
        is_final: isFinal,
        is_third_place: isThirdPlace,
        is_first_stage: (roundOrder === 1)
      };

      await createOrUpdatePlayoffRound(roundData);
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving playoff round:', err);
      setErrors({ submit: err.message || 'Error saving playoff round' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {round ? 'Edit Playoff Round' : 'Create Playoff Round'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              label="Round Name"
              fullWidth
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              required
              margin="normal"
              error={!!errors.name}
              helperText={errors.name || "e.g. 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Final'"}
              disabled={loading}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <FormControl fullWidth margin="normal">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isFinal}
                    onChange={(e) => {
                      setIsFinal(e.target.checked);
                      if (e.target.checked) {
                        setIsThirdPlace(false);
                      }
                    }}
                    disabled={loading}
                  />
                }
                label="Final Match"
              />
            </FormControl>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <FormControl fullWidth margin="normal">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isThirdPlace}
                    onChange={(e) => {
                      setIsThirdPlace(e.target.checked);
                      if (e.target.checked) {
                        setIsFinal(false);
                      }
                    }}
                    disabled={loading}
                  />
                }
                label="Third Place Match"
              />
            </FormControl>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <TextField
              label="Round Order"
              type="number"
              fullWidth
              value={roundOrder}
              onChange={(e) => setRoundOrder(parseInt(e.target.value) || 0)}
              required
              margin="normal"
              error={!!errors.order}
              helperText={errors.order || "Lower numbers come first"}
              slotProps={{ htmlInput: { min: 1 } }}
              disabled={loading}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <TextField
              label="Matches Count"
              type="number"
              fullWidth
              value={totalGames}
              onChange={(e) => setTotalGames(parseInt(e.target.value) || 0)}
              required
              margin="normal"
              error={!!errors.matchesCount}
              helperText={errors.matchesCount || "Number of matches in this round"}
              slotProps={{ htmlInput: { min: 1 } }}
              disabled={loading}
            />
          </Grid>
          {errors.submit && (
            <Grid size={12}>
              <TextField
                error
                fullWidth
                value={errors.submit}
                slotProps={{
                  input: {
                    readOnly: true,
                  }
                }}
                variant="filled"
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={loading}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

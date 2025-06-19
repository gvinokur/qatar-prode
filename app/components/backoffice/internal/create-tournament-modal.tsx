'use client'

import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  MenuItem,
  Select,
  InputLabel,
  Box,
  Typography,
  Divider,
  CircularProgress, FormHelperText
} from "@mui/material";
import {createOrUpdateTournament, getAllTournaments } from "../../../actions/tournament-actions";
import { Tournament } from "../../../db/tables-definition";
import {copyTournament} from "../../../actions/backoffice-actions";

interface CreateTournamentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (_newTournament: any) => void;
}

export default function CreateTournamentModal({ open, onClose, onSuccess }: CreateTournamentModalProps) {
  const [longName, setLongName] = useState("");
  const [shortName, setShortName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for copy functionality
  const [createMode, setCreateMode] = useState<'new' | 'copy'>('new');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [loadingTournaments, setLoadingTournaments] = useState(false);

  // Load existing tournaments when modal opens
  useEffect(() => {
    if (open) {
      const fetchTournaments = async () => {
        setLoadingTournaments(true);
        try {
          const tournamentsList = await getAllTournaments();
          setTournaments(tournamentsList);
        } catch (err: any) {
          console.error("Error loading tournaments:", err);
          setError("Failed to load existing tournaments");
        } finally {
          setLoadingTournaments(false);
        }
      };

      fetchTournaments();
    }
  }, [open]);

  // Update names when a tournament is selected for copying
  useEffect(() => {
    if (selectedTournamentId && createMode === 'copy') {
      const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);
      if (selectedTournament) {
        setLongName(`${selectedTournament.long_name} - copy`);
        setShortName(`${selectedTournament.short_name} - copy`);
      }
    }
  }, [selectedTournamentId, createMode, tournaments]);

  const handleClose = () => {
    setLongName("");
    setShortName("");
    setError(null);
    setCreateMode('new');
    setSelectedTournamentId('');
    onClose();
  };

  const handleCreateTournament = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!longName.trim() || !shortName.trim()) {
        throw new Error("Both long name and short name are required");
      }

      let newTournament;

      if (createMode === 'new') {
        // Create from scratch
        const formData = new FormData();
        formData.append('tournament', JSON.stringify({
          long_name: longName,
          short_name: shortName,
          is_active: false
        }));

        newTournament = await createOrUpdateTournament(
          null, // null for new tournament
          formData
        );
      } else {
        // Copy existing tournament
        if (!selectedTournamentId) {
          throw new Error("Please select a tournament to copy");
        }

        newTournament = await copyTournament(
          selectedTournamentId,
          longName,
          shortName
        );
      }

      onSuccess(newTournament);
      handleClose();
    } catch (err: any) {
      console.error("Error creating tournament:", err);
      setError(err.message || "Failed to create tournament");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Tournament</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, mt: 1 }}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Creation Method</FormLabel>
            <RadioGroup
              row
              value={createMode}
              onChange={(e) => setCreateMode(e.target.value as 'new' | 'copy')}
            >
              <FormControlLabel value="new" control={<Radio />} label="Create from scratch" />
              <FormControlLabel value="copy" control={<Radio />} label="Copy existing tournament" />
            </RadioGroup>
          </FormControl>
        </Box>

        {createMode === 'copy' && (
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth disabled={loading || loadingTournaments}>
              <InputLabel>Select Tournament to Copy</InputLabel>
              <Select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                label="Select Tournament to Copy"
              >
                {loadingTournaments ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading tournaments...
                  </MenuItem>
                ) : (
                  tournaments.map((tournament) => (
                    <MenuItem key={tournament.id} value={tournament.id}>
                      {tournament.long_name}
                    </MenuItem>
                  ))
                )}
              </Select>
              <FormHelperText>
                All tournament data including teams, groups, games, and playoff structure will be copied
              </FormHelperText>
            </FormControl>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Tournament Details
        </Typography>

        <TextField
          autoFocus={createMode === 'new'}
          margin="dense"
          label="Long Name"
          fullWidth
          variant="outlined"
          value={longName}
          onChange={(e) => setLongName(e.target.value)}
          helperText="Full tournament name (e.g. 'UEFA European Championship 2024')"
          required
          sx={{ mb: 2, mt: 1 }}
          disabled={loading}
        />
        <TextField
          margin="dense"
          label="Short Name"
          fullWidth
          variant="outlined"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          helperText="Abbreviated name (e.g. 'Euro 2024')"
          required
          disabled={loading}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          loading={loading}
          onClick={handleCreateTournament}
          variant="contained"
        >
          {createMode === 'new' ? 'Create' : 'Copy Tournament'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

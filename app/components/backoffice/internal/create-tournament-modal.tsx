'use client'

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { createOrUpdateTournament } from "../../../actions/tournament-actions";

interface CreateTournamentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newTournament: any) => void;
}

export default function CreateTournamentModal({ open, onClose, onSuccess }: CreateTournamentModalProps) {
  const [longName, setLongName] = useState("");
  const [shortName, setShortName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setLongName("");
    setShortName("");
    setError(null);
    onClose();
  };

  const handleCreateTournament = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!longName.trim() || !shortName.trim()) {
        throw new Error("Both long name and short name are required");
      }

      const formData = new FormData()
      formData.append('tournament', JSON.stringify({
        long_name: longName,
        short_name: shortName,
        is_active: false
      }))

      const newTournament = await createOrUpdateTournament(
        null, // null for new tournament
        formData
      );

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
        <TextField
          autoFocus
          margin="dense"
          label="Long Name"
          fullWidth
          variant="outlined"
          value={longName}
          onChange={(e) => setLongName(e.target.value)}
          helperText="Full tournament name (e.g. 'UEFA European Championship 2024')"
          required
          sx={{ mb: 2, mt: 1 }}
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
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <LoadingButton
          loading={loading}
          onClick={handleCreateTournament}
          variant="contained"
        >
          Create
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

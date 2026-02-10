'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Alert } from "../mui-wrappers/";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";

interface JoinGroupDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export default function JoinGroupDialog({ open, onClose }: JoinGroupDialogProps) {
  const router = useRouter();
  const [groupCode, setGroupCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    // Validate code
    if (!groupCode.trim()) {
      setError('Por favor ingresa un código de grupo');
      return;
    }

    // Navigate to join page
    router.push(`/friend-groups/join/${groupCode.trim()}`);
    handleClose();
  };

  const handleClose = () => {
    setGroupCode('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Unirse a un Grupo</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Código de Grupo"
          type="text"
          fullWidth
          variant="outlined"
          value={groupCode}
          onChange={(e) => {
            setGroupCode(e.target.value);
            setError('');
          }}
          placeholder="Ingresa el código del grupo"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleJoin} variant="contained" color="primary">
          Unirse al Grupo
        </Button>
      </DialogActions>
    </Dialog>
  );
}

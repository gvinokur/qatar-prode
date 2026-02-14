'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Box
} from '@mui/material';
import { setNickname } from '@/app/actions/oauth-actions';
import { useSession } from 'next-auth/react';

type NicknameSetupDialogProps = {
  readonly open: boolean;
  readonly onClose?: () => void;
};

export default function NicknameSetupDialog({ open, onClose }: NicknameSetupDialogProps) {
  const { update } = useSession();
  const [nicknameInput, setNicknameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await setNickname(nicknameInput);

      if (!result.success) {
        setError(result.error || 'Error al guardar el nickname');
        setLoading(false);
        return;
      }

      // Update session to reflect new nickname
      await update({
        nickname: nicknameInput,
        nicknameSetupRequired: false
      });

      // Close dialog after successful nickname setup
      if (onClose) {
        onClose();
      }
    } catch {
      setError('Error al guardar el nickname');
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      // Prevent closing by clicking outside or ESC key
      disableEscapeKeyDown={!onClose}
    >
      <DialogTitle>Configura tu nickname</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} id="nickname-form">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Para completar tu registro, por favor elige un nickname que será visible para otros usuarios.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Nickname"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            required
            disabled={loading}
            autoFocus
            slotProps={{
              htmlInput: {
                minLength: 2,
                maxLength: 50
              }
            }}
            helperText="Mínimo 2 caracteres, máximo 50"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        {onClose && (
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          form="nickname-form"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

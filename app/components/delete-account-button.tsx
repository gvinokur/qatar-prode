'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {deleteAccount} from "../actions/user-actions";
import {signOut, useSession} from "next-auth/react";
import { useRouter } from 'next/navigation';

export default function DeleteAccountButton() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleOpen = () => {
    setOpen(true);
    setConfirmation('');
    setError(null);
  };

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
  };

  const handleDelete = async () => {
    if (confirmation !== 'ELIMINAR') {
      setError('Por favor, escribe ELIMINAR para confirmar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await deleteAccount();

      if (result.error) {
        setError(result.error);
        setLoading(false);
      }

      await signOut()
      router.replace('/');
      router.refresh();
      // If successful, the page will redirect due to signOut
    } catch (err) {
      setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return session?.user ? (
    <>
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={handleOpen}
      >
        Eliminar mi cuenta
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="delete-account-dialog-title"
      >
        <DialogTitle id="delete-account-dialog-title">
          ¿Estás seguro de que quieres eliminar tu cuenta?
        </DialogTitle>
        <DialogContent>
          <DialogContentText color="error">
            Esta acción es irreversible. Se eliminarán todos tus datos, incluyendo:
          </DialogContentText>
          <ul>
            <li>Todos tus pronósticos de partidos y torneos</li>
            <li>Tu membresía en todos los grupos</li>
            <li>Los grupos que hayas creado</li>
            <li>Toda tu información personal</li>
          </ul>
          <DialogContentText mt={2}>
            Para confirmar, escribe ELIMINAR en el campo a continuación:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={loading}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={loading || confirmation !== 'ELIMINAR'}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {loading ? 'Eliminando...' : 'Eliminar cuenta'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  ) : (
    <Alert severity='warning'>
      Must be logged in to delete an account
    </Alert>
  );
}

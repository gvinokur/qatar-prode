import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Snackbar, Alert } from '@mui/material';
import { sendGroupNotification } from '../../actions/notifiaction-actions';

interface NotificationDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  tournamentId: string;
  senderId: string;
}

const targetOptions = [
  { value: 'tournament', label: 'Página del torneo' },
  { value: 'friends-group', label: 'Página del grupo de amigos' },
];

const NotificationDialog: React.FC<NotificationDialogProps> = ({ open, onClose, groupId, tournamentId, senderId }) => {
  const [targetPage, setTargetPage] = useState<'tournament' | 'friends-group'>('tournament');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const handleSend = async () => {
    setLoading(true);
    try {
      await sendGroupNotification({ groupId, tournamentId, targetPage, title, message, senderId });
      setSnackbar({ open: true, message: 'Notificación enviada', severity: 'success' });
      setTitle('');
      setMessage('');
      onClose();
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Error al enviar notificación', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Enviar Notificación a Participantes</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Destino"
            value={targetPage}
            onChange={e => setTargetPage(e.target.value as 'tournament' | 'friends-group')}
            fullWidth
            margin="normal"
          >
            {targetOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Mensaje"
            value={message}
            onChange={e => setMessage(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSend} variant="contained" color="primary" disabled={loading || !title || !message}>Enviar</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationDialog; 
'use client'

import {useState, ReactNode} from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  Box,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';

interface InviteFriendsDialogProps {
  trigger: ReactNode;
  groupId: string;
  groupName: string;
}

export default function InviteFriendsDialog({ trigger, groupId, groupName }: InviteFriendsDialogProps) {
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleOpen = async () => {
    setOpen(true);
  }
  const handleClose = () => setOpen(false);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Generate invitation link
  const getInvitationLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/friend-groups/join/${groupId}`;
  };

  // Generate invitation message
  const getInvitationMessage = () => {
    return `¡Hola! Te invito a unirte a nuestro grupo "${groupName}" para jugar en al prode en los torneos actuales y futuros. Usa este enlace para unirte: ${getInvitationLink()}`;
  };

  // Copy link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(getInvitationLink())
      .then(() => {
        showSnackbar('¡Enlace copiado al portapapeles!');
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
        showSnackbar('Error al copiar el enlace');
      });
  };

  // Share via email
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Invitación al grupo "${groupName}" del Prode`);
    const body = encodeURIComponent(getInvitationMessage());
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(getInvitationMessage());
    window.open(`https://wa.me/?text=${message}`);
  };

  return (
    <>
      <div onClick={handleOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleOpen()}>
        {trigger}
      </div>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Invitar amigos a {groupName}</Typography>
            <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Comparte este enlace con tus amigos para que se unan al grupo.
          </Typography>

          <Box sx={{ display: 'flex', mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              value={getInvitationLink()}
              InputProps={{
                readOnly: true,
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={copyToClipboard}
              sx={{ ml: 1 }}
              startIcon={<ContentCopyIcon />}
            >
              Copiar
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body1" sx={{ mb: 2 }}>
            O comparte directamente a través de:
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={shareViaEmail}
            >
              Email
            </Button>
            <Button
              variant="outlined"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={shareViaWhatsApp}
            >
              WhatsApp
            </Button>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

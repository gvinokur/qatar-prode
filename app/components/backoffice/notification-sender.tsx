'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import {sendNotification} from "../../actions/notifiaction-actions";

interface NotificationFormData {
  title: string;
  body: string;
  userId: string;
  sendToAll: boolean;
}

export default function NotificationSender() {
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    body: '',
    userId: '',
    sendToAll: false
  });

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.body) {
      setSnackbar({
        open: true,
        message: 'El título y el mensaje son obligatorios',
        severity: 'error'
      });
      return;
    }

    if (!formData.sendToAll && !formData.userId) {
      setSnackbar({
        open: true,
        message: 'Debe seleccionar enviar a todos o especificar un ID de usuario',
        severity: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // Use the existing sendNotification action instead of creating a new API route
      const result = await sendNotification(
        formData.title,
        formData.body,
        process.env.NEXT_PUBLIC_APP_URL + '/',
        formData.sendToAll ? null : formData.userId,
        formData.sendToAll);

      if (!result.success) {
        throw new Error(result.errors.join(', '));
      }

      setSnackbar({
        open: true,
        message: `Notificaciones enviadas exitosamente a ${result.sentCount} dispositivos`,
        severity: 'success'
      });

      // Reset form if successful
      if (formData.sendToAll) {
        setFormData({
          title: '',
          body: '',
          userId: '',
          sendToAll: false
        });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al enviar notificaciones',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <NotificationsActiveIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h5" component="h2">
          Enviar Notificaciones
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="title"
          label="Título de la notificación"
          name="title"
          value={formData.title}
          onChange={handleChange}
          disabled={loading}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="body"
          label="Mensaje de la notificación"
          name="body"
          value={formData.body}
          onChange={handleChange}
          multiline
          rows={4}
          disabled={loading}
        />

        <Box mt={3} mb={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.sendToAll}
                onChange={handleChange}
                name="sendToAll"
                color="primary"
                disabled={loading}
              />
            }
            label="Enviar a todos los usuarios"
          />
        </Box>

        {!formData.sendToAll && (
          <TextField
            margin="normal"
            fullWidth
            id="userId"
            label="ID de usuario específico (para pruebas)"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            disabled={loading || formData.sendToAll}
            helperText="Ingrese el ID de usuario para enviar una notificación de prueba"
          />
        )}

        <Box mt={4} display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {loading ? 'Enviando...' : 'Enviar Notificación'}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Container, TextField, Typography } from '@mui/material';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { verifyResetToken, updateUserPassword } from '../actions/user-actions';
import { AuthPageSkeleton } from '../components/skeletons';

type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    control,
    handleSubmit,
    watch,
  } = useForm<ResetPasswordFormData>();

  // Verify token on page load
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setTokenValid(false);
        setLoading(false);
        setMessage({ type: 'error', text: 'Token de restablecimiento no proporcionado.' });
        return;
      }

      try {
        const user = await verifyResetToken(token);

        if (user) {
          setTokenValid(true);
          setUserId(user.id);
        } else {
          setTokenValid(false);
          setMessage({
            type: 'error',
            text: 'El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita un nuevo enlace.'
          });
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        setTokenValid(false);
        setMessage({
          type: 'error',
          text: 'Error al verificar el token. Por favor, inténtalo de nuevo.'
        });
      } finally {
        setLoading(false);
      }
    }

    checkToken();
  }, [token]);

  // Handle form submission
  const onSubmit: SubmitHandler<ResetPasswordFormData> = async (data) => {
    if (!userId) return;

    setSubmitting(true);
    try {
      const result = await updateUserPassword(userId, data.password);

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({
        type: 'error',
        text: 'Error al actualizar la contraseña. Por favor, inténtalo de nuevo.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (loading) {
    return <AuthPageSkeleton />;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom>
            Restablecer contraseña
          </Typography>

          {message && (
            <Alert
              severity={message.type}
              sx={{ mb: 3 }}
            >
              {message.text}
            </Alert>
          )}

          {tokenValid ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="password"
                control={control}
                defaultValue=""
                rules={{
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 8,
                    message: 'La contraseña debe tener al menos 8 caracteres'
                  }
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Nueva contraseña"
                    type="password"
                    fullWidth
                    margin="normal"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="confirmPassword"
                control={control}
                defaultValue=""
                rules={{
                  required: 'Confirma tu contraseña',
                  validate: (value) =>
                    value === watch('password') || 'Las contraseñas no coinciden'
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Confirmar contraseña"
                    type="password"
                    fullWidth
                    margin="normal"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  loading={submitting}
                  type="submit"
                  variant="contained"
                >
                  Actualizar contraseña
                </Button>
              </Box>
            </form>
          ) : (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => router.push('/')}
                >
                  Volver al inicio
                </Button>
              </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

'use client';

import { useState } from 'react';
import { TextField, Button, Box, CircularProgress, Alert, Divider, Typography } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { signIn } from 'next-auth/react';
import { checkAuthMethods } from '@/app/actions/oauth-actions';

type EmailInputFormProps = {
  onEmailSubmit: (_email: string, _authMethods: { hasPassword: boolean; hasGoogle: boolean; userExists: boolean }) => void;
};

export default function EmailInputForm({ onEmailSubmit }: EmailInputFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await checkAuthMethods(email);

      if (!result.success) {
        setError(result.error || 'Error al verificar el email');
        setLoading(false);
        return;
      }

      // Pass email and auth methods to parent
      onEmailSubmit(email, {
        hasPassword: result.hasPassword,
        hasGoogle: result.hasGoogle,
        userExists: result.userExists
      });
    } catch {
      setError('Error al verificar el email');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setError('Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
        sx={{ mb: 2 }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Continuar'}
      </Button>

      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          o
        </Typography>
      </Divider>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<GoogleIcon />}
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        Continuar con Google
      </Button>
    </Box>
  );
}

'use client'

import { useState } from "react";
import { Alert, Box, Button, TextField, Typography, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { createAccountViaOTP, checkNicknameAvailability } from "@/app/actions/otp-actions";
import { signIn } from "next-auth/react";

type AccountSetupFormProps = {
  readonly email: string;
  readonly verifiedOTP: string;
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
}

export default function AccountSetupForm({ email, verifiedOTP, onSuccess, onCancel }: AccountSetupFormProps) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validate nickname in real-time
  const handleNicknameChange = async (value: string) => {
    setNickname(value);
    setNicknameError('');

    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    if (trimmed.length < 3) {
      setNicknameError('El nickname debe tener al menos 3 caracteres');
      return;
    }

    if (trimmed.length > 20) {
      setNicknameError('El nickname debe tener máximo 20 caracteres');
      return;
    }

    // Check availability (simplified - actual check would query DB)
    const result = await checkNicknameAvailability(trimmed);
    if (!result.available) {
      setNicknameError(result.error || 'Este nickname no está disponible');
    }
  };

  // Validate password
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError('');

    if (value.trim().length > 0 && value.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedNickname = nickname.trim();
    const trimmedPassword = password.trim();

    // Validate nickname
    if (!trimmedNickname) {
      setError('El nickname es requerido');
      setLoading(false);
      return;
    }

    if (trimmedNickname.length < 3) {
      setError('El nickname debe tener al menos 3 caracteres');
      setLoading(false);
      return;
    }

    if (trimmedNickname.length > 20) {
      setError('El nickname debe tener máximo 20 caracteres');
      setLoading(false);
      return;
    }

    // Validate password if provided
    if (trimmedPassword && trimmedPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Create account
      const result = await createAccountViaOTP({
        email,
        nickname: trimmedNickname,
        password: trimmedPassword || null,
        verifiedOTP
      });

      if (!result.success) {
        setError(result.error || 'Error al crear la cuenta');
        setLoading(false);
        return;
      }

      // Sign in with OTP
      const signInResult = await signIn('otp', {
        email,
        otp: verifiedOTP,
        redirect: false
      });

      if (signInResult?.ok) {
        onSuccess();
      } else {
        setError('Cuenta creada pero no se pudo iniciar sesión. Intenta iniciar sesión manualmente.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error creating account:', err);
      setError('Error al crear la cuenta. Intenta nuevamente.');
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      nickname.trim().length >= 3 &&
      nickname.trim().length <= 20 &&
      !nicknameError &&
      (password.trim().length === 0 || password.length >= 8) &&
      !passwordError
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" variant="standard" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        ¡Email verificado! Ahora completa tu información para crear tu cuenta.
      </Typography>

      {/* Nickname field */}
      <TextField
        fullWidth
        label="Nickname"
        value={nickname}
        onChange={(e) => handleNicknameChange(e.target.value)}
        error={!!nicknameError}
        helperText={nicknameError || (nickname.trim() && !nicknameError ? '✓ Disponible' : 'Requerido')}
        disabled={loading}
        variant="outlined"
        required
        inputProps={{
          minLength: 3,
          maxLength: 20
        }}
        sx={{ mb: 2 }}
      />

      {/* Password field (optional) */}
      <TextField
        fullWidth
        type={showPassword ? 'text' : 'password'}
        label="Contraseña (opcional)"
        value={password}
        onChange={(e) => handlePasswordChange(e.target.value)}
        error={!!passwordError}
        helperText={passwordError || 'Opcional: Crear contraseña por si acaso'}
        disabled={loading}
        variant="outlined"
        inputProps={{
          minLength: 8
        }}
        InputProps={{
          endAdornment: password && (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />

      {/* Action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="text"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !isFormValid()}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </Box>
    </Box>
  );
}

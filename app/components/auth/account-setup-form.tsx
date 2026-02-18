'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, TextField, Typography, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { createAccountViaOTP, checkNicknameAvailability } from "@/app/actions/otp-actions";
import { signIn } from "next-auth/react";
import { useTranslations, useLocale } from 'next-intl';
import type { Locale } from '@/i18n.config';

type AccountSetupFormProps = {
  readonly email: string;
  readonly verifiedOTP: string;
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
}

export default function AccountSetupForm({ email, verifiedOTP, onSuccess, onCancel }: AccountSetupFormProps) {
  const t = useTranslations('auth');
  const locale = useLocale() as Locale;
  const router = useRouter();
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
      setNicknameError(t('accountSetup.nickname.minLength', { min: 3 }));
      return;
    }

    if (trimmed.length > 20) {
      setNicknameError(t('accountSetup.nickname.maxLength', { max: 20 }));
      return;
    }

    // Check availability (simplified - actual check would query DB)
    const result = await checkNicknameAvailability(trimmed, locale);
    if (!result.available) {
      setNicknameError(result.error || t('accountSetup.nickname.unavailable'));
    }
  };

  // Validate password
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError('');

    if (value.trim().length > 0 && value.length < 8) {
      setPasswordError(t('accountSetup.password.minLength', { min: 8 }));
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
      setError(t('accountSetup.nickname.required'));
      setLoading(false);
      return;
    }

    if (trimmedNickname.length < 3) {
      setError(t('accountSetup.nickname.minLength', { min: 3 }));
      setLoading(false);
      return;
    }

    if (trimmedNickname.length > 20) {
      setError(t('accountSetup.nickname.maxLength', { max: 20 }));
      setLoading(false);
      return;
    }

    // Validate password if provided
    if (trimmedPassword && trimmedPassword.length < 8) {
      setError(t('accountSetup.password.minLength', { min: 8 }));
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
      }, locale);

      if (!result.success) {
        setError(result.error || t('accountSetup.errors.createFailed'));
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
        router.refresh();
        onSuccess();
      } else {
        setError(t('accountSetup.errors.createAndLoginFailed'));
        setLoading(false);
      }
    } catch (err) {
      console.error('Error creating account:', err);
      setError(t('accountSetup.errors.createFailed'));
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
        {t('accountSetup.instruction')}
      </Typography>

      {/* Nickname field */}
      <TextField
        fullWidth
        label={t('accountSetup.nickname.label')}
        value={nickname}
        onChange={(e) => handleNicknameChange(e.target.value)}
        error={!!nicknameError}
        helperText={nicknameError || (nickname.trim() && !nicknameError ? t('accountSetup.nickname.available') : t('accountSetup.nickname.placeholder'))}
        disabled={loading}
        variant="outlined"
        required
        slotProps={{
          htmlInput: {
            minLength: 3,
            maxLength: 20
          }
        }}
        sx={{ mb: 2 }}
      />

      {/* Password field (optional) */}
      <TextField
        fullWidth
        type={showPassword ? 'text' : 'password'}
        label={t('accountSetup.password.label')}
        value={password}
        onChange={(e) => handlePasswordChange(e.target.value)}
        error={!!passwordError}
        helperText={passwordError || t('accountSetup.password.optional')}
        disabled={loading}
        variant="outlined"
        slotProps={{
          htmlInput: {
            minLength: 8
          },
          input: {
            endAdornment: password && (
            <InputAdornment position="end">
              <IconButton
                aria-label={t('login.password.toggleVisibility')}
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )}
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
          {t('accountSetup.buttons.cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !isFormValid()}
        >
          {loading ? t('accountSetup.buttons.submitting') : t('accountSetup.buttons.submit')}
        </Button>
      </Box>
    </Box>
  );
}

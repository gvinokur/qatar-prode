'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Container, TextField, Typography } from '@mui/material';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { verifyResetToken, updateUserPassword } from '../../actions/user-actions';
import { AuthPageSkeleton } from '../../components/skeletons';

type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
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
        setMessage({ type: 'error', text: t('resetPassword.errors.tokenNotProvided') });
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
            text: t('resetPassword.errors.tokenInvalid')
          });
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        setTokenValid(false);
        setMessage({
          type: 'error',
          text: t('resetPassword.errors.tokenVerifyFailed')
        });
      } finally {
        setLoading(false);
      }
    }

    checkToken();
  }, [token, t]);

  // Handle form submission
  const onSubmit: SubmitHandler<ResetPasswordFormData> = async (data) => {
    if (!userId) return;

    setSubmitting(true);
    try {
      const result = await updateUserPassword(userId, data.password);

      if (result.success) {
        setMessage({ type: 'success', text: t('resetPassword.success.updated') });
        // Redirect to home page after 3 seconds
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
        text: t('resetPassword.errors.updateFailed')
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
            {t('resetPassword.title')}
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
                  required: t('resetPassword.newPassword.required'),
                  minLength: {
                    value: 8,
                    message: t('resetPassword.newPassword.minLength')
                  }
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={t('resetPassword.newPassword.label')}
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
                  required: t('resetPassword.confirmPassword.required'),
                  validate: (value) =>
                    value === watch('password') || t('resetPassword.confirmPassword.mismatch')
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={t('resetPassword.confirmPassword.label')}
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
                  {submitting ? t('resetPassword.button.submitting') : t('resetPassword.button.submit')}
                </Button>
              </Box>
            </form>
          ) : (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => router.push('/')}
                >
                  {t('resetPassword.success.backHome')}
                </Button>
              </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

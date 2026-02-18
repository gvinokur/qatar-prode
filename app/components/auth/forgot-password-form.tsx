'use client'

import {Alert, Button, TextField, Typography} from "@mui/material";
import {Controller, SubmitHandler, useForm} from "react-hook-form";
//@ts-ignore
import validator from "validator";
import {useState} from "react";
import {sendPasswordResetLink} from "../../actions/user-actions";
import { useTranslations, useLocale } from 'next-intl';
import type { Locale } from '@/i18n.config';

type ForgotPasswordFormData = {
  email: string
}

type ForgotPasswordFormProps = {
  readonly onSuccess: (_email: string) => void;
}

export default function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const t = useTranslations('auth');
  const locale = useLocale() as Locale;
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: ''
    }
  });

  const handlePasswordReset: SubmitHandler<ForgotPasswordFormData> = async (resetForm, e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      if (resetForm.email) {
        const result: any = await sendPasswordResetLink(resetForm.email, locale);
        setLoading(false);

        if (!result.success) {
          // Check if user is OAuth-only
          if (result.isOAuthOnly) {
            setError('root', {
              type: 'OAuth Only',
              message: result.error || t('forgotPassword.errors.googleAccount')
            });
          } else {
            setError('root', {
              type: 'Email Error',
              message: result.error || t('forgotPassword.errors.sendFailed')
            });
          }
          return;
        }
        onSuccess(resetForm.email);
      }
    } catch (error: any) {
      setLoading(false);
      setError('root', {
        type: 'Server Error',
        message: error.toString()
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handlePasswordReset)}>
      {errors.root && (
        <Alert severity="error" variant='standard'>
          {errors.root.message}
        </Alert>
      )}

      <Typography variant="body2" sx={{ mb: 2 }}>
        {t('forgotPassword.description')}
      </Typography>

      <Controller
        control={control}
        name="email"
        rules={{
          required: t('login.email.required'),
          validate: (value) => validator.isEmail(value) || t('login.email.invalid')
        }}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            autoFocus
            margin="dense"
            label={t('login.email.label')}
            type="text"
            fullWidth
            variant="standard"
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message || ''}
          />
        )}
      />

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button loading={loading} type="submit">
          {t('forgotPassword.buttons.submit')}
        </Button>
      </div>
    </form>
  );
}

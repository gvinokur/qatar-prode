'use client'

import {Alert, Button, TextField} from "@mui/material";
import { VpnKey } from "@mui/icons-material";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
//@ts-ignore
import validator from "validator";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n.config';

export type LoginFormData = {
  email: string,
  password: string
}

type LoginFormProps = {
  readonly onSuccess: () => void;
  readonly email?: string;
  readonly onOTPLoginClick?: () => void;
}

export default function LoginForm({ onSuccess, email, onOTPLoginClick }: LoginFormProps) {
  const t = useTranslations('auth');
  const locale = useLocale() as Locale;
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<LoginFormData>({
    defaultValues: {
      email: email || '',
      password: ''
    }
  });

  const isVerified = searchParams?.get('verified') === 'true';

  const handleLogin: SubmitHandler<LoginFormData> = async (loginForm, e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const response: any = await signIn("credentials", {
        ...loginForm,
        redirect: false,
      });
      setLoading(false);

      if (!response.ok) {
        setError('root', {
          type: 'Login Error',
          message: t('login.errors.invalidCredentials')
        });
      } else {
        onSuccess();
        if(searchParams?.get('callbackUrl')) {
          router.push(searchParams.get('callbackUrl') || `/${locale}`);
        }
        router.refresh();
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
    <form onSubmit={handleSubmit(handleLogin)}>
      {errors.root && (
        <Alert severity="error" variant='standard'>
          {errors.root.message}
        </Alert>
      )}

      {isVerified && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
        >
          {t('login.success.verified')}
        </Alert>
      )}

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
            autoFocus={!email}
            margin="dense"
            label={t('login.email.label')}
            type="text"
            fullWidth
            variant="standard"
            disabled={!!email}
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message || ''}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        rules={{
          required: t('login.password.required'),
        }}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            autoFocus={!!email}
            margin="dense"
            label={t('login.password.label')}
            type="password"
            fullWidth
            variant="standard"
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message || ''}
          />
        )}
      />

      <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        {onOTPLoginClick && (
          <Button
            variant="outlined"
            startIcon={<VpnKey />}
            onClick={onOTPLoginClick}
            disabled={loading}
          >
            {t('login.buttons.otpEmail')}
          </Button>
        )}
        <Button loading={loading} type="submit" variant="contained">
          {t('login.buttons.submit')}
        </Button>
      </div>
    </form>
  );
}

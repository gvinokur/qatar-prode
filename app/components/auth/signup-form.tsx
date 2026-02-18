'use client'

import {Alert, Button, TextField} from "@mui/material";
import { VpnKey } from "@mui/icons-material";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
//@ts-ignore
import validator from "validator";
import { useState } from "react";
import { signupUser } from "../../actions/user-actions";
import {User} from "../../db/tables-definition";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n.config';

export type SignupFormData = {
  email: string,
  email_confirm: string,
  nickname: string,
  password: string,
  password_confirm: string
}

type SignupFormProps = {
  readonly onSuccess: (_user: User) => void;
  readonly email?: string;
  readonly onOTPSignupClick?: () => void;
}

export default function SignupForm({ onSuccess, email, onOTPSignupClick }: SignupFormProps) {
  const t = useTranslations('auth');
  const locale = useLocale() as Locale;
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    getValues,
    setError,
    formState: { errors }
  } = useForm<SignupFormData>({
    defaultValues: {
      email: email || '',
      email_confirm: email || '',
      nickname: '',
      password: '',
      password_confirm: ''
    }
  });

  const handleSignup: SubmitHandler<SignupFormData> = async (signupForm, e) => {
    e?.preventDefault();
    setLoading(true);
    if (signupForm.email && signupForm.password) {
      try {
        const userOrError: User | string = await signupUser({
          email: signupForm.email,
          password_hash: signupForm.password,
          nickname: signupForm.nickname
        }, locale);
        setLoading(false);

        if (typeof userOrError === 'string') {
          setError('root', {
            type: 'Signup Error',
            message: userOrError
          });
        } else {
          // Automatically sign in the user after successful registration
          const result = await signIn('credentials', {
            email: signupForm.email,
            password: signupForm.password,
            redirect: false
          });

          if (result?.error) {
            setError('root', {
              type: 'Login Error',
              message: t('accountSetup.errors.createAndLoginFailed')
            });
          } else {
            // Process response here
            onSuccess(userOrError);
            router.refresh();
          }
        }
      } catch (error: any) {
        setLoading(false);
        setError('root', {
          type: 'Server Error',
          message: error.toString()
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSignup)}>
      {errors.root && (
        <Alert severity="error" variant='standard'>
          {errors.root.message}
        </Alert>
      )}

      <Controller
        control={control}
        name="email"
        rules={{
          required: t('signup.email.required'),
          validate: (value) => validator.isEmail(value) || t('signup.email.invalid')
        }}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            autoFocus={!email}
            margin="dense"
            label={t('signup.email.label')}
            type="text"
            fullWidth
            variant="standard"
            disabled={!!email}
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message || ''}
          />
        )}
      />

      {!email && (
        <Controller
          control={control}
          name="email_confirm"
          rules={{
            required: t('signup.confirmEmail.required'),
            validate: (value) => value === getValues('email') || t('signup.confirmEmail.mismatch')
          }}
          render={({field, fieldState}) => (
            <TextField
              {...field}
              margin="dense"
              label={t('signup.confirmEmail.label')}
              type="text"
              fullWidth
              variant="standard"
              error={fieldState.error !== undefined}
              helperText={fieldState.error?.message || ''}
            />
          )}
        />
      )}

      <Controller
        control={control}
        name="nickname"
        render={({field}) => (
          <TextField
            {...field}
            autoFocus={!!email}
            margin="dense"
            label={t('signup.nickname.label')}
            type="text"
            fullWidth
            variant="standard"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        rules={{
          required: t('signup.password.required'),
        }}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            margin="dense"
            label={t('signup.password.label')}
            type="password"
            fullWidth
            variant="standard"
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message || ''}
          />
        )}
      />

      <Controller
        control={control}
        name="password_confirm"
        rules={{
          required: t('signup.password.confirmRequired'),
          validate: (value) => value === getValues('password') || t('signup.password.confirmMismatch')
        }}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            margin="dense"
            label={t('signup.password.confirmLabel')}
            type="password"
            fullWidth
            variant="standard"
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message || ''}
          />
        )}
      />

      <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        {onOTPSignupClick && (
          <Button
            variant="outlined"
            startIcon={<VpnKey />}
            onClick={onOTPSignupClick}
            disabled={loading}
          >
            {t('signup.buttons.otpEmail')}
          </Button>
        )}
        <Button loading={loading} type="submit" variant="contained">
          {t('signup.buttons.submit')}
        </Button>
      </div>
    </form>
  );
}

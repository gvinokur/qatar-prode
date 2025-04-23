'use client'

import { Alert, TextField } from "@mui/material";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
//@ts-ignore
import validator from "validator";
import { LoadingButton } from "@mui/lab";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export type LoginFormData = {
  email?: string,
  password?: string
}

type LoginFormProps = {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<LoginFormData>();

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
          message: 'Email o Contraseña Invalida'
        });
      } else {
        onSuccess();
        router.push(searchParams?.get('callbackUrl') || '/');
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

      <Controller
        control={control}
        name="email"
        rules={{
          required: 'Por favor ingrese su e-mail',
          validate: (value) => validator.isEmail(value) || 'Direccion de E-Mail invalida'
        }}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            autoFocus
            margin="dense"
            label="E-Mail"
            type="text"
            fullWidth
            variant="standard"
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message || ''}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        rules={{
          required: 'Ingrese su contraseña',
        }}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            margin="dense"
            label="Contraseña"
            type="password"
            fullWidth
            variant="standard"
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message || ''}
          />
        )}
      />

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <LoadingButton loading={loading} type="submit">
          Ingresar
        </LoadingButton>
      </div>
    </form>
  );
}

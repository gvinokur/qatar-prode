'use client'

import {Alert, Button, TextField} from "@mui/material";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
//@ts-ignore
import validator from "validator";
import { useState } from "react";
import { signupUser } from "../../actions/user-actions";
import {User} from "../../db/tables-definition";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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
}

export default function SignupForm({ onSuccess, email }: SignupFormProps) {
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
        });
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
              message: 'Registration successful but automatic login failed. Please try logging in manually.'
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
          required: 'Por favor ingrese su e-mail',
          validate: (value) => validator.isEmail(value) || 'Direccion de E-Mail invalida'
        }}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            autoFocus={!email}
            margin="dense"
            label="E-Mail"
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
            required: 'Por favor confirme su e-mail',
            validate: (value) => value === getValues('email') || 'Confirme su e-mail correctamente'
          }}
          render={({field, fieldState}) => (
            <TextField
              {...field}
              margin="dense"
              label="Confirmacion de E-Mail"
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
            label="Apodo"
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
          required: 'Cree su contraseña',
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

      <Controller
        control={control}
        name="password_confirm"
        rules={{
          required: 'Por favor confirme su contraseña',
          validate: (value) => value === getValues('password') || 'Confirme su contraseña correctamente'
        }}
        render={({field, fieldState}) => (
          <TextField
            {...field}
            margin="dense"
            label="Confirmacion de Contraseña"
            type="password"
            fullWidth
            variant="standard"
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message || ''}
          />
        )}
      />

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button loading={loading} type="submit">
          Registrarse
        </Button>
      </div>
    </form>
  );
}

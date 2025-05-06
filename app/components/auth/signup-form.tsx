'use client'

import {Alert, Button, TextField} from "@mui/material";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
//@ts-ignore
import validator from "validator";
import { useState } from "react";
import { signupUser } from "../../actions/user-actions";
import { LoginFormData } from "./login-form";
import {User} from "../../db/tables-definition";

export type SignupFormData = {
  email?: string,
  email_confirm?: string,
  nickname?: string,
  password?: string,
  password_confirm?: string
}

type SignupFormProps = {
  onSuccess: (user: User) => void;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    setError,
    formState: { errors }
  } = useForm<SignupFormData>();

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
          // Process response here
          onSuccess(userOrError);
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

      <Controller
        control={control}
        name="nickname"
        render={({field}) => (
          <TextField
            {...field}
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

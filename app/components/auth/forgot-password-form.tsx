'use client'

import {Alert, Button, TextField, Typography} from "@mui/material";
import {Controller, SubmitHandler, useForm} from "react-hook-form";
//@ts-ignore
import validator from "validator";
import {useState} from "react";
import {sendPasswordResetLink} from "../../actions/user-actions";

type ForgotPasswordFormData = {
  email?: string
}

type ForgotPasswordFormProps = {
  onSuccess: (email: string) => void;
}


export default function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>();

  const handlePasswordReset: SubmitHandler<ForgotPasswordFormData> = async (resetForm, e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      if (resetForm.email) {
        setLoading(false);

        const result = await sendPasswordResetLink(resetForm.email);

        if (!result.success) {
          setError('root', {
            type: 'Email Error',
            message: 'Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.'
          });
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
        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
      </Typography>

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

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button loading={loading} type="submit">
          Enviar Enlace
        </Button>
      </div>
    </form>
  );
}

'use client'

import { Alert, TextField, Typography } from "@mui/material";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
//@ts-ignore
import validator from "validator";
import { LoadingButton } from "@mui/lab";
import { useState } from "react";
import { createPasswordResetLink } from "../../actions/user-actions";
import { sendEmail } from "../../utils/email";

type ForgotPasswordFormData = {
  email?: string
}

type ForgotPasswordFormProps = {
  onSuccess: (email: string) => void;
}

/**
 * Generate password reset email content
 */
function generatePasswordResetEmail(email: string, resetUrl: string) {
  const subject = 'Recuperación de contraseña - La Maquina Prode';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a4a4a;">Recuperación de contraseña</h2>
      <p>Hola,</p>
      <p>Has solicitado restablecer tu contraseña para tu cuenta en Qatar Prode.</p>
      <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <p style="margin: 20px 0;">
        <a 
          href="${resetUrl}" 
          style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;"
        >
          Restablecer contraseña
        </a>
      </p>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo electrónico.</p>
      <p>Saludos,<br>El equipo de La Maquina Prode</p>
    </div>
  `;

  return { to: email, subject, html };
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
        const result = await createPasswordResetLink(resetForm.email);

        setLoading(false);

        if (typeof result === 'string' && result.startsWith('No existe')) {
          setLoading(false);
          setError('root', {
            type: 'Reset Error',
            message: result
          });
          return;
        }

        // If we got a valid reset URL, send the email
        if (typeof result === 'string' && result.startsWith('http')) {
          // Generate email content
          const emailData = generatePasswordResetEmail(resetForm.email, result);

          // Send the email
          const emailResult = await sendEmail(emailData);

          setLoading(false);

          if (!emailResult.success) {
            setError('root', {
              type: 'Email Error',
              message: 'Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.'
            });
            return;
          }

          // Success - show confirmation
          onSuccess(resetForm.email);
        } else {
          setLoading(false);
          setError('root', {
            type: 'Reset Error',
            message: 'Error al generar el enlace de restablecimiento'
          });
        }
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
        <LoadingButton loading={loading} type="submit">
          Enviar Enlace
        </LoadingButton>
      </div>
    </form>
  );
}

'use client'

import { Typography, Box, Alert } from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';
import {User} from "../../db/tables-definition";

type VerificationSentViewProps = {
  readonly user?: User;
}

export default function VerificationSentView({ user }: VerificationSentViewProps) {
  return (
    <Box sx={{ padding: '16px 0', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <EmailIcon color="primary" sx={{ fontSize: 48 }} />
      </Box>

      <Typography variant="h5" sx={{ mb: 2 }}>
        ¡Registro Exitoso de {user?.nickname}!
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        Se ha enviado un correo de verificación a:
      </Typography>

      <Typography variant="body1" fontWeight="bold" sx={{ mb: 3 }}>
        {user?.email}
      </Typography>

      <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
        <Typography variant="body2">
          Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta.
        </Typography>
      </Alert>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado.
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        El enlace de verificación expirará en 24 horas.
      </Typography>
    </Box>
  );
}

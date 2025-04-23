'use client'

import { Typography } from "@mui/material";

type ResetSentViewProps = {
  email: string;
}

export default function ResetSentView({ email }: ResetSentViewProps) {
  return (
    <div style={{ padding: '16px 0' }}>
      <Typography variant="body1" sx={{ mb: 1 }}>
        Se ha enviado un enlace de restablecimiento a:
      </Typography>
      <Typography variant="body1" fontWeight="bold">
        {email}
      </Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Por favor, revisa tu correo electrónico y sigue las instrucciones para restablecer tu contraseña.
      </Typography>
    </div>
  );
}

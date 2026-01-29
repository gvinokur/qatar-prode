'use client'

import { Box, Typography, Card, CardContent, Stack, Alert, Chip } from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

export default function BoostIntroductionStep() {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        Multiplica Tus Puntos con Boosts
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Usa tus boosts estratégicamente en partidos clave
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 500, mx: 'auto' }}>
        <Card elevation={3} sx={{ bgcolor: 'action.hover', border: '2px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ fontSize: 32 }}>🥈</Box>
              <Typography variant="h6">Boost Plateado</Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold', fontSize: '1.1rem' }}>
              Multiplica × 2
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Duplica tus puntos en el partido que elijas
            </Typography>

            <Chip
              label="Cantidad limitada por torneo"
              size="small"
              sx={{ mt: 1.5 }}
              color="default"
              variant="outlined"
            />
          </CardContent>
        </Card>

        <Card elevation={3} sx={{ bgcolor: 'action.hover', border: '3px solid', borderColor: 'warning.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <LocalFireDepartmentIcon sx={{ fontSize: 32, color: 'warning.main' }} />
              <Typography variant="h6">Boost Dorado</Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold', fontSize: '1.1rem' }}>
              Multiplica × 3
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Triplica tus puntos en tu partido más importante
            </Typography>

            <Chip
              label="Muy escaso - ¡úsalo sabiamente!"
              size="small"
              sx={{ mt: 1.5 }}
              color="warning"
              variant="outlined"
            />
          </CardContent>
        </Card>

        <Alert severity="info" icon={<InfoOutlinedIcon />}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Puntos Importantes:
          </Typography>
          <Stack spacing={0.5} sx={{ pl: 1 }}>
            <Typography variant="body2">
              • Los boosts son <strong>específicos de cada torneo</strong>
            </Typography>
            <Typography variant="body2">
              • Solo aplican a <strong>predicciones de partidos</strong>
            </Typography>
            <Typography variant="body2">
              • Puedes cambiarlos hasta 1 hora antes del partido
            </Typography>
            <Typography variant="body2">
              • Cada torneo tiene cantidades limitadas
            </Typography>
          </Stack>
        </Alert>

        <Box sx={{ textAlign: 'center', mt: 2, p: 2, bgcolor: 'action.selected', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" fontWeight="bold" color="text.primary">
            💡 Consejo Estratégico
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }} color="text.secondary">
            Guarda tus boosts para finales y partidos decisivos donde estés más seguro del resultado
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}

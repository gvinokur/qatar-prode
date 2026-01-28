'use client'

import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Button, Paper, Divider, Stack } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LockClockIcon from '@mui/icons-material/LockClock'
import { useState } from 'react'

const CHECKLIST_ITEMS = [
  { id: 'first_prediction', label: 'Hacer mi primera predicción de partido' },
  { id: 'tournament_predictions', label: 'Predecir campeón y premios individuales' },
  { id: 'qualifiers_predictions', label: 'Completar predicciones de clasificación' },
  { id: 'join_group', label: 'Unirme a un grupo de amigos' },
  { id: 'explore_rules', label: 'Revisar las reglas completas' },
]

type ChecklistStepProps = {
  onComplete: () => void
}

export default function ChecklistStep({ onComplete }: ChecklistStepProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        Lista de Primeros Pasos
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Completa estos pasos para sacar el máximo provecho
      </Typography>

      <Box sx={{ maxWidth: 550, mx: 'auto' }}>
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 3 }}>
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = checkedItems.has(item.id)
            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton onClick={() => toggleItem(item.id)} dense>
                  <ListItemIcon>
                    {isChecked ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <RadioButtonUncheckedIcon color="action" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{ textDecoration: isChecked ? 'line-through' : 'none' }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>

        {/* Deadline Education Box */}
        <Paper elevation={2} sx={{ p: 2, bgcolor: 'info.light' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LockClockIcon color="info" />
            <Typography variant="subtitle1" fontWeight="bold">
              ⏰ Plazos de Predicción
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 20, color: 'info.main' }} />
                <Typography variant="body2" fontWeight="bold">
                  Predicciones de Partidos
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ pl: 3.5 }}>
                Cierran <strong>1 hora antes</strong> del inicio del partido
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 20, color: 'info.main' }} />
                <Typography variant="body2" fontWeight="bold">
                  Torneo y Clasificación
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ pl: 3.5 }}>
                Cierran <strong>5 días después</strong> del inicio del torneo
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <LocalFireDepartmentIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                <Typography variant="body2" fontWeight="bold">
                  Boosts
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ pl: 3.5 }}>
                Se pueden cambiar hasta <strong>1 hora antes</strong> del partido
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Typography variant="caption" display="block" align="center" sx={{ mt: 2, mb: 3 }}>
          💡 Puedes acceder a esta lista desde tu perfil en cualquier momento
        </Typography>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={onComplete}
            sx={{ minWidth: 200 }}
          >
            ¡Comenzar a Jugar!
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

function LocalFireDepartmentIcon(props: { sx: any }) {
  return <Box component="span" sx={{ fontSize: 20, ...props.sx }}>🔥</Box>
}

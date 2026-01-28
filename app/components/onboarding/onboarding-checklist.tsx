'use client'

import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Paper } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { OnboardingChecklistItem } from '../../db/tables-definition'

type OnboardingChecklistProps = {
  items: OnboardingChecklistItem[]
}

/**
 * Standalone checklist component that can be displayed in user settings or profile
 * Shows onboarding checklist items with their completion status
 */
export default function OnboardingChecklist({ items }: OnboardingChecklistProps) {
  if (!items || items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No hay elementos en la lista de tareas
        </Typography>
      </Box>
    )
  }

  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length
  const progress = (completedCount / totalCount) * 100

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Lista de Primeros Pasos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {completedCount} de {totalCount} completadas ({Math.round(progress)}%)
        </Typography>
      </Box>

      <List>
        {items
          .sort((a, b) => a.order - b.order)
          .map((item) => (
            <ListItem key={item.id} dense>
              <ListItemIcon>
                {item.completed ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <RadioButtonUncheckedIcon color="action" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.completedAt ? `Completado: ${new Date(item.completedAt).toLocaleDateString()}` : undefined}
                sx={{ textDecoration: item.completed ? 'line-through' : 'none' }}
              />
            </ListItem>
          ))}
      </List>
    </Paper>
  )
}

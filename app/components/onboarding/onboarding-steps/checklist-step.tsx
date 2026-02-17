'use client'

import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Button, Paper, Divider, Stack } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LockClockIcon from '@mui/icons-material/LockClock'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

type ChecklistStepProps = {
  readonly onComplete: () => void
}

export default function ChecklistStep({ onComplete }: ChecklistStepProps) {
  const t = useTranslations('onboarding.steps.checklist')
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const CHECKLIST_ITEMS = [
    { id: 'first_prediction', label: t('items.firstPrediction') },
    { id: 'tournament_predictions', label: t('items.championAndAwards') },
    { id: 'qualifiers_predictions', label: t('items.qualifiedTeams') },
    { id: 'join_group', label: t('items.joinGroup') },
    { id: 'explore_rules', label: t('items.reviewRules') },
  ]

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
        {t('title')}
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        {t('instructions')}
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
        <Paper elevation={2} sx={{ p: 2, bgcolor: 'action.hover', border: '2px solid', borderColor: 'info.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LockClockIcon sx={{ color: 'info.main' }} />
            <Typography variant="subtitle1" fontWeight="bold">
              {t('deadlinesHeader')}
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 20, color: 'info.main' }} />
                <Typography variant="body2" fontWeight="bold">
                  {t('matchPredictions.label')}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ pl: 3.5, color: 'text.secondary' }}>
                {t('matchPredictions.deadline')}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: 'divider' }} />

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 20, color: 'info.main' }} />
                <Typography variant="body2" fontWeight="bold">
                  {t('tournamentAndClassification.label')}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ pl: 3.5, color: 'text.secondary' }}>
                {t('tournamentAndClassification.deadline')}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: 'divider' }} />

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <LocalFireDepartmentIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                <Typography variant="body2" fontWeight="bold">
                  {t('boosts.label')}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ pl: 3.5, color: 'text.secondary' }}>
                {t('boosts.deadline')}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Typography variant="caption" display="block" align="center" sx={{ mt: 2, mb: 3 }}>
          {t('infoTip')}
        </Typography>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={onComplete}
            sx={{ minWidth: 200 }}
          >
            {t('startButton')}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

function LocalFireDepartmentIcon(props: { readonly sx: any }) {
  return <Box component="span" sx={{ fontSize: 20, ...props.sx }}>🔥</Box>
}

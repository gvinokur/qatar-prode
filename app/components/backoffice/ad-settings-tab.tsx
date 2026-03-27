'use client'

import { useState, useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { getAdSettingsAction, updateAdSettingsAction } from '../../actions/ad-settings-actions'

export default function AdSettingsTab() {
  const [minMinutes, setMinMinutes] = useState(30)
  const [minPageviews, setMinPageviews] = useState(10)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: '',
  })

  useEffect(() => {
    getAdSettingsAction().then(({ modalMinMinutesBetween, modalMinPageviewsBetween }) => {
      setMinMinutes(modalMinMinutesBetween)
      setMinPageviews(modalMinPageviewsBetween)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await updateAdSettingsAction(minMinutes, minPageviews)
      setSnackbar({ open: true, severity: 'success', message: 'Settings saved.' })
    } catch {
      setSnackbar({ open: true, severity: 'error', message: 'Failed to save settings.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3, maxWidth: 480 }}>
        <Typography variant="h6" gutterBottom>
          Ad Settings
        </Typography>

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Modal Ad Frequency
        </Typography>

        <TextField
          label="Min minutes between appearances"
          type="number"
          value={minMinutes}
          onChange={(e) => setMinMinutes(Number(e.target.value))}
          inputProps={{ min: 0 }}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          label="Min page views between appearances"
          type="number"
          value={minPageviews}
          onChange={(e) => setMinPageviews(Number(e.target.value))}
          inputProps={{ min: 0 }}
          size="small"
          fullWidth
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            Save Settings
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

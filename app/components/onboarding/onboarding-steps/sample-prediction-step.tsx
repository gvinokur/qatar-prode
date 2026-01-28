'use client'

import { Box, Typography, Card, CardContent, TextField, Grid, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, Chip, Stack } from '@mui/material'
import { useState } from 'react'

// Mock data for demonstration
const MOCK_GAME = {
  homeTeam: { name: 'Argentina', flag: '🇦🇷' },
  awayTeam: { name: 'Brasil', flag: '🇧🇷' },
  date: '15 Jun 2024 - 18:00'
}

const MOCK_TEAMS = ['Argentina', 'Brasil', 'Uruguay', 'Chile']
const MOCK_PLAYERS = ['Lionel Messi', 'Neymar Jr', 'Luis Suárez', 'Arturo Vidal']

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prediction-tabpanel-${index}`}
      aria-labelledby={`prediction-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

export default function SamplePredictionStep() {
  const [tabValue, setTabValue] = useState(0)
  const [homeScore, setHomeScore] = useState<number | ''>('')
  const [awayScore, setAwayScore] = useState<number | ''>('')
  const [champion, setChampion] = useState('')
  const [runnerUp, setRunnerUp] = useState('')
  const [bestPlayer, setBestPlayer] = useState('')

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom align="center">
        Tipos de Predicciones
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Hay tres tipos principales de predicciones que puedes hacer
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Partidos" />
          <Tab label="Torneo" />
          <Tab label="Clasificación" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card elevation={3} sx={{ maxWidth: 500, mx: 'auto' }}>
          <CardContent>
            <Typography variant="caption" display="block" align="center" sx={{ mb: 2, color: 'text.secondary' }}>
              {MOCK_GAME.date}
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={5} textAlign="center">
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {MOCK_GAME.homeTeam.flag}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {MOCK_GAME.homeTeam.name}
                </Typography>
                <TextField
                  type="number"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value ? parseInt(e.target.value) : '')}
                  inputProps={{ min: 0, max: 99, style: { textAlign: 'center' } }}
                  size="small"
                  sx={{ mt: 1, width: 60 }}
                />
              </Grid>

              <Grid item xs={2} textAlign="center">
                <Typography variant="h6" color="text.secondary">
                  VS
                </Typography>
              </Grid>

              <Grid item xs={5} textAlign="center">
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {MOCK_GAME.awayTeam.flag}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {MOCK_GAME.awayTeam.name}
                </Typography>
                <TextField
                  type="number"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value ? parseInt(e.target.value) : '')}
                  inputProps={{ min: 0, max: 99, style: { textAlign: 'center' } }}
                  size="small"
                  sx={{ mt: 1, width: 60 }}
                />
              </Grid>
            </Grid>

            {homeScore !== '' && awayScore !== '' && (
              <Typography variant="body2" color="success.main" align="center" sx={{ mt: 2 }}>
                ✓ ¡Perfecto! Así de fácil es predecir un partido
              </Typography>
            )}
          </CardContent>
        </Card>

        <Typography variant="caption" display="block" align="center" sx={{ mt: 2, fontStyle: 'italic' }}>
          📅 Las predicciones de partidos cierran 1 hora antes del inicio
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ maxWidth: 500, mx: 'auto' }}>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Campeón</InputLabel>
              <Select
                value={champion}
                label="Campeón"
                onChange={(e) => setChampion(e.target.value)}
              >
                {MOCK_TEAMS.map((team) => (
                  <MenuItem key={team} value={team}>{team}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Subcampeón</InputLabel>
              <Select
                value={runnerUp}
                label="Subcampeón"
                onChange={(e) => setRunnerUp(e.target.value)}
              >
                {MOCK_TEAMS.map((team) => (
                  <MenuItem key={team} value={team}>{team}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" sx={{ pt: 1, fontWeight: 'bold' }}>
              Premios Individuales (4 premios):
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Mejor Jugador</InputLabel>
              <Select
                value={bestPlayer}
                label="Mejor Jugador"
                onChange={(e) => setBestPlayer(e.target.value)}
              >
                {MOCK_PLAYERS.map((player) => (
                  <MenuItem key={player} value={player}>{player}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip label="Goleador" size="small" variant="outlined" />
              <Chip label="Mejor Arquero" size="small" variant="outlined" />
              <Chip label="Jugador Joven" size="small" variant="outlined" />
            </Box>

            {(champion || runnerUp || bestPlayer) && (
              <Typography variant="body2" color="success.main" align="center">
                ✓ ¡Excelente! También puedes predecir el tercer lugar
              </Typography>
            )}
          </Stack>

          <Typography variant="caption" display="block" align="center" sx={{ mt: 2, fontStyle: 'italic' }}>
            📅 Las predicciones de torneo cierran 5 días después del inicio
          </Typography>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ maxWidth: 500, mx: 'auto' }}>
          <Typography variant="body2" align="center" sx={{ mb: 2 }}>
            Las posiciones de clasificación se calculan automáticamente según tus predicciones de partidos
          </Typography>

          <Card elevation={2} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Grupo A - Posiciones Predichas
              </Typography>

              <Stack spacing={1} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="bold">1°</Typography>
                    <Typography variant="body2">Argentina</Typography>
                  </Box>
                  <Typography variant="caption" fontWeight="bold">9 pts</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="bold">2°</Typography>
                    <Typography variant="body2">Uruguay</Typography>
                  </Box>
                  <Typography variant="caption" fontWeight="bold">6 pts</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="bold">3°</Typography>
                    <Typography variant="body2">Chile</Typography>
                  </Box>
                  <Typography variant="caption">3 pts</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="bold">4°</Typography>
                    <Typography variant="body2">Paraguay</Typography>
                  </Box>
                  <Typography variant="caption">0 pts</Typography>
                </Box>
              </Stack>

              <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                🟢 Verde = Clasifican a siguiente fase
              </Typography>
            </CardContent>
          </Card>

          <Typography variant="caption" display="block" align="center" sx={{ mt: 2, fontStyle: 'italic' }}>
            📅 Las clasificaciones también cierran 5 días después del inicio
          </Typography>
        </Box>
      </TabPanel>
    </Box>
  )
}

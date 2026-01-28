'use client'

import { Box, Typography, Card, CardContent, Tabs, Tab, CardHeader, Grid, Chip, Stack, Alert } from '@mui/material'
import { useState } from 'react'
import CompactGameViewCard from '../../compact-game-view-card'
import TeamSelector from '../../awards/team-selector'
import MobileFriendlyAutocomplete from '../../awards/mobile-friendly-autocomplete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import type { Team } from '../../../db/tables-definition'
import type { ExtendedPlayerData } from '../../../definitions'

// Mock data for demonstration
const MOCK_TEAMS: Team[] = [
  { id: '1', name: 'Argentina', short_name: 'ARG', theme: null },
  { id: '2', name: 'Brasil', short_name: 'BRA', theme: null },
  { id: '3', name: 'Uruguay', short_name: 'URU', theme: null },
  { id: '4', name: 'Chile', short_name: 'CHI', theme: null },
]

const MOCK_PLAYERS: ExtendedPlayerData[] = [
  { id: '1', name: 'Lionel Messi', position: 'Delantero', age_at_tournament: 34, team_id: '1', tournament_id: 'mock', team: MOCK_TEAMS[0] },
  { id: '2', name: 'Neymar Jr', position: 'Delantero', age_at_tournament: 29, team_id: '2', tournament_id: 'mock', team: MOCK_TEAMS[1] },
  { id: '3', name: 'Luis Suárez', position: 'Delantero', age_at_tournament: 34, team_id: '3', tournament_id: 'mock', team: MOCK_TEAMS[2] },
  { id: '4', name: 'Arturo Vidal', position: 'Mediocampista', age_at_tournament: 34, team_id: '4', tournament_id: 'mock', team: MOCK_TEAMS[3] },
]

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
  const [gameClicked, setGameClicked] = useState(false)
  const [champion, setChampion] = useState('')
  const [runnerUp, setRunnerUp] = useState('')
  const [bestPlayer, setBestPlayer] = useState('')

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleGameClick = () => {
    setGameClicked(true)
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
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <Typography variant="body2" align="center" sx={{ mb: 2, color: 'text.secondary' }}>
            Haz clic en el lápiz para editar tu predicción
          </Typography>

          <CompactGameViewCard
            gameNumber={42}
            gameDate={new Date('2024-06-15T18:00:00')}
            location="Estadio Monumental"
            homeTeamNameOrDescription="Argentina"
            homeTeamShortNameOrDescription="ARG"
            awayTeamNameOrDescription="Brasil"
            awayTeamShortNameOrDescription="BRA"
            homeScore={2}
            awayScore={1}
            isPlayoffGame={false}
            isGameGuess={true}
            isGameFixture={false}
            onEditClick={handleGameClick}
            disabled={false}
          />

          {gameClicked && (
            <Alert
              severity="success"
              icon={<CheckCircleIcon />}
              sx={{ mt: 2 }}
            >
              ¡Perfecto! Así se editan las predicciones. En la app real, se abrirá un diálogo para cambiar los marcadores.
            </Alert>
          )}

          <Typography variant="caption" display="block" align="center" sx={{ mt: 2, fontStyle: 'italic' }}>
            📅 Las predicciones de partidos cierran 1 hora antes del inicio
          </Typography>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card sx={{ maxWidth: 800, mx: 'auto' }}>
          <CardHeader title="Podio del Torneo" />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TeamSelector
                  label="Campeón"
                  teams={MOCK_TEAMS}
                  selectedTeamId={champion}
                  name="champion"
                  disabled={false}
                  helperText="Selecciona el equipo que predigas que ganará el torneo"
                  onChange={setChampion}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TeamSelector
                  label="Subcampeón"
                  teams={MOCK_TEAMS}
                  selectedTeamId={runnerUp}
                  name="runnerUp"
                  disabled={false}
                  helperText="Selecciona el equipo que predigas que llegará a la final"
                  onChange={setRunnerUp}
                />
              </Grid>
            </Grid>

            <Typography variant="body2" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
              Premios Individuales:
            </Typography>

            <Grid container spacing={2}>
              <Grid size={12}>
                <MobileFriendlyAutocomplete
                  options={MOCK_PLAYERS}
                  value={MOCK_PLAYERS.find(p => p.id === bestPlayer) || null}
                  onChange={(_, player) => setBestPlayer(player?.id || '')}
                  getOptionLabel={(option) => option.name}
                  groupBy={(option) => option.team.name}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      {option.name} - {option.team.short_name}
                    </Box>
                  )}
                  renderInput={(params) => (
                    <Box {...params}>
                      {params.children}
                    </Box>
                  )}
                  label="Mejor Jugador"
                  disabled={false}
                />
              </Grid>

              <Grid size={12}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Chip label="Goleador" size="small" variant="outlined" />
                  <Chip label="Mejor Arquero" size="small" variant="outlined" />
                  <Chip label="Jugador Joven" size="small" variant="outlined" />
                </Box>
              </Grid>
            </Grid>

            {(champion || runnerUp || bestPlayer) && (
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>
                ¡Excelente! Así se predicen el podio y los premios del torneo
              </Alert>
            )}
          </CardContent>
        </Card>

        <Typography variant="caption" display="block" align="center" sx={{ mt: 2, fontStyle: 'italic' }}>
          📅 Las predicciones de torneo cierran 5 días después del inicio
        </Typography>
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

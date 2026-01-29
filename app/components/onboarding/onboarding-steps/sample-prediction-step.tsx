'use client'

import { Box, Typography, Card, CardContent, Tabs, Tab, CardHeader, Grid, Chip, Alert, Table, TableHead, TableRow, TableCell, TableBody, Paper, TextField } from '@mui/material'
import { useState } from 'react'
import CompactGameViewCard from '../../compact-game-view-card'
import TeamSelector from '../../awards/team-selector'
import MobileFriendlyAutocomplete from '../../awards/mobile-friendly-autocomplete'
import GameResultEditDialog from '../../game-result-edit-dialog'
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
  readonly children?: React.ReactNode
  readonly index: number
  readonly value: number
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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [homeScore, setHomeScore] = useState<number | undefined>(2)
  const [awayScore, setAwayScore] = useState<number | undefined>(1)
  const [gameClicked, setGameClicked] = useState(false)
  const [champion, setChampion] = useState('')
  const [runnerUp, setRunnerUp] = useState('')
  const [bestPlayer, setBestPlayer] = useState('')

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleGameClick = () => {
    setEditDialogOpen(true)
  }

  const handleGameGuessSave = async (
    _gameId: string,
    newHomeScore?: number,
    newAwayScore?: number,
  ) => {
    setHomeScore(newHomeScore)
    setAwayScore(newAwayScore)
    setEditDialogOpen(false)
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
            homeScore={homeScore}
            awayScore={awayScore}
            isPlayoffGame={false}
            isGameGuess={true}
            isGameFixture={false}
            onEditClick={handleGameClick}
            disabled={false}
          />

          <GameResultEditDialog
            isGameGuess={true}
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            onGameGuessSave={handleGameGuessSave}
            homeTeamName="Argentina"
            awayTeamName="Brasil"
            gameId="mock-game-id"
            gameNumber={42}
            initialHomeScore={homeScore}
            initialAwayScore={awayScore}
            initialHomePenaltyWinner={false}
            initialAwayPenaltyWinner={false}
            initialBoostType={null}
            tournamentId="mock-tournament-id"
            isPlayoffGame={false}
          />

          {gameClicked && (
            <Alert
              severity="success"
              icon={<CheckCircleIcon />}
              sx={{ mt: 2 }}
            >
              ¡Perfecto! Así se editan las predicciones de partidos.
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
                    <TextField
                      {...params}
                      label="Elegir Jugador"
                      slotProps={{
                        htmlInput: {
                          ...params.inputProps,
                        }
                      }}
                    />
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
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Typography variant="body2" align="center" sx={{ mb: 2 }}>
            Las posiciones de clasificación se calculan automáticamente según tus predicciones de partidos
          </Typography>

          <Typography variant="h6" gutterBottom>
            Tabla de Pronósticos - Grupo A
          </Typography>

          <Paper>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'primary.contrastText' }}>Pos</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText' }}>Equipo</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText' }}>Pts</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText', display: { xs: 'none', md: 'table-cell' } }}>G</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText', display: { xs: 'none', md: 'table-cell' } }}>E</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText', display: { xs: 'none', md: 'table-cell' } }}>P</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText', display: { xs: 'none', md: 'table-cell' } }}>GF</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText', display: { xs: 'none', md: 'table-cell' } }}>GC</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText' }}>DG</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ backgroundColor: 'secondary.main' }}>
                  <TableCell>1</TableCell>
                  <TableCell>Argentina</TableCell>
                  <TableCell>9</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>3</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>0</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>0</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>7</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>2</TableCell>
                  <TableCell>+5</TableCell>
                </TableRow>
                <TableRow sx={{ backgroundColor: 'secondary.main' }}>
                  <TableCell>2</TableCell>
                  <TableCell>Uruguay</TableCell>
                  <TableCell>6</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>2</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>0</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>1</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>5</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>3</TableCell>
                  <TableCell>+2</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>3</TableCell>
                  <TableCell>Chile</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>1</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>0</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>2</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>3</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>5</TableCell>
                  <TableCell>-2</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>4</TableCell>
                  <TableCell>Paraguay</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>0</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>0</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>3</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>2</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>7</TableCell>
                  <TableCell>-5</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              Los equipos con fondo coloreado clasifican a la siguiente fase
            </Typography>
          </Alert>

          <Typography variant="caption" display="block" align="center" sx={{ mt: 2, fontStyle: 'italic' }}>
            📅 Las clasificaciones también cierran 5 días después del inicio
          </Typography>
        </Box>
      </TabPanel>
    </Box>
  )
}

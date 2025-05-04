'use client'

import {useState, useEffect, useCallback} from 'react';
import { useParams } from 'next/navigation';
import {Player, PlayerNew, Team} from "../../db/tables-definition";
import {
  createTournamentTeamPlayers,
  deleteAllTeamPlayersInTournament, deleteTournamentTeamPlayers,
  getPlayersInTournament
} from "../../actions/team-actions";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary, Alert, AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader, Checkbox,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow, TextField,
  Typography
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getTransfermarktPlayerData } from "../../actions/team-actions";
import {LoadingButton} from "@mui/lab";
import {getTournamentStartDate} from "../../actions/tournament-actions";

interface PlayerData {
  name: string;
  position: string;
  dateOfBirth: string;
}

interface TeamWithPlayers {
  team: Team;
  players: Player[];
}

export default function PlayersTab({tournamentId}: {tournamentId: string}) {

  const [teamsWithPlayers, setTeamsWithPlayers] = useState<TeamWithPlayers[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [transfermarktName, setTransfermarktName] = useState('');
  const [transfermarktId, setTransfermarktId] = useState('');
  const [deleteExistingPlayers, setDeleteExistingPlayers] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const fetchPlayersData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPlayersInTournament(tournamentId);
      setTeamsWithPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchPlayersData();
  }, [tournamentId, fetchPlayersData]);



  const handleImportPlayers = async () => {
    if(!selectedTeam || !transfermarktName || !transfermarktId) {
      return;
    }
    try {
      setImportLoading(true);
      let existingPlayers = teamsWithPlayers.find(teamWithPlayers => teamWithPlayers.team.id === selectedTeam.id)?.players || [];
      const players = await getTransfermarktPlayerData(transfermarktName, transfermarktId, tournamentId)
      if(deleteExistingPlayers && existingPlayers.length > 0) {
        const toDelete =
          existingPlayers.filter(player =>
            //Delete players that are not in the new players list
            !players.some(p =>
              p.name === player.name &&
              p.ageAtTournament === player.age_at_tournament))
        if(toDelete.length > 0) {
          existingPlayers = existingPlayers.filter(player =>
            !toDelete.some(p => p.id === player.id))
          await deleteTournamentTeamPlayers(toDelete)
        }
      }
      const toCreate: PlayerNew[] = players
        //Only create players that are not already in the tournament
        .filter(
          player => !existingPlayers.some(p =>
              p.name === player.name &&
              p.age_at_tournament === player.ageAtTournament)
        ).map(player => ({
          name: player.name,
          position: player.position,
          team_id: selectedTeam.id,
          tournament_id: tournamentId,
          age_at_tournament: player.ageAtTournament
        }))
      const createdPlayers = await createTournamentTeamPlayers(toCreate);

      const allPlayers = [...existingPlayers, ...createdPlayers]

      const newTeamsWithPlayers = teamsWithPlayers.map(teamWithPlayers => {
        if (teamWithPlayers.team.id === selectedTeam.id) {
          return {
            team: teamWithPlayers.team,
            players: allPlayers
          };
        }
        return teamWithPlayers;
      });
      setTeamsWithPlayers(newTeamsWithPlayers);

      // Check if team has transfermarkt data
    } catch (error) {
      console.error(`Error loading Transfermarkt players for team ${selectedTeam.name}:`, error);
    } finally {
      setImportLoading(false);
    }
  };

  const openImportPlayersModal = (team: Team) => {
    setSelectedTeam(team);
    setTransfermarktName(team.name.replace(' ', '-') + '-fc-players');
    setTransfermarktId('');
    setDeleteExistingPlayers(false);
    setOpenImportModal(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Tournament Players"
        />
        <CardContent>
          <div>
            {teamsWithPlayers.map((teamData, index) => (
              <Accordion key={teamData.team.id}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel-${teamData.team.id}-content`}
                  id={`panel-${teamData.team.id}-header`}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {teamData.team.theme?.logo && (
                      <img
                        src={teamData.team.theme.logo}
                        alt={`${teamData.team.name} logo`}
                        style={{ height: 24, width: 24, objectFit: 'contain' }}
                      />
                    )}
                    <Typography>{teamData.team.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      ({teamData.players.length} players)
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {teamData.players.length > 0 ? (
                    <Box display='flex' flexDirection='row' gap={2}>
                      <TableContainer >
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Position</TableCell>
                              <TableCell>Age</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {teamData.players.map((player) => (
                              <TableRow key={player.id}>
                                <TableCell>{player.name}</TableCell>
                                <TableCell>{player.position}</TableCell>
                                <TableCell>{player.age_at_tournament}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Box display={'flex'} flexDirection={'column'} justifyContent={'start'} gap={2}>
                        {/*<Button variant='contained' color='secondary' >Delete Players</Button>*/}
                        <Button variant='contained' color='secondary' onClick={() => openImportPlayersModal(teamData.team)}>Import Players</Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box display={'flex'} justifyContent={'space-around'}>
                      <Alert severity={'info'} action={
                        <>
                          <Button
                            color="inherit"
                            disabled={loading}
                            onClick={() => openImportPlayersModal(teamData.team)}
                          >
                            Importar de Transfermarkt.com
                          </Button>
                        </>
                      }>
                        <AlertTitle>No se encontraron jugadores</AlertTitle>
                        {teamData.team.name} no tiene jugadores registrados en este torneo.
                      </Alert>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        </CardContent>
      </Card>
      <Dialog open={openImportModal} onClose={() => setOpenImportModal(false)}>
        <DialogTitle>Import Players from Transfermarkt</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: '400px' }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Team: {selectedTeam?.name}
            </Typography>

            <TextField
              label="Transfermarkt Team Name"
              fullWidth
              margin="normal"
              value={transfermarktName}
              onChange={(e) => setTransfermarktName(e.target.value)}
              helperText="Example: paris-saint-germain"
            />

            <TextField
              label="Transfermarkt Team ID"
              fullWidth
              margin="normal"
              value={transfermarktId}
              onChange={(e) => setTransfermarktId(e.target.value)}
              helperText="Example: 583"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={deleteExistingPlayers}
                  onChange={(e) => setDeleteExistingPlayers(e.target.checked)}
                />
              }
              label="Borrar jugadores existentes"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportModal(false)}>Cancel</Button>
          <LoadingButton
            variant="contained"
            onClick={handleImportPlayers}
            disabled={!transfermarktName || !transfermarktId || importLoading}
            loading={importLoading}
          >
            {importLoading ? 'Importando...' : 'Importar'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

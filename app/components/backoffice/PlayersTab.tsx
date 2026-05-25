'use client'

import {useState, useEffect, useCallback} from 'react';
import {Player, PlayerNew, Team} from "../../db/tables-definition";
import {
  createTournamentTeamPlayers,
  deleteSpecificTeamPlayers,
  updateTournamentTeamPlayer,
  getPlayersInTournament,
  getTransfermarktPlayerData,
  saveTeamTransfermarktId
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
  CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow, TextField,
  Typography
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {getThemeLogoUrl} from "../../utils/theme-utils";

interface TeamWithPlayers {
  team: Team;
  players: Player[];
}

interface PlayersTabProps {
  readonly tournamentId: string;
  readonly transfermarktUrlTemplate?: string | null;
}

export default function PlayersTab({tournamentId, transfermarktUrlTemplate}: PlayersTabProps) {
  const [teamsWithPlayers, setTeamsWithPlayers] = useState<TeamWithPlayers[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [transfermarktName, setTransfermarktName] = useState('');
  const [transfermarktId, setTransfermarktId] = useState('');
  const [deleteExistingPlayers, setDeleteExistingPlayers] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | false>(false)

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
      let existingPlayers = teamsWithPlayers.find(t => t.team.id === selectedTeam.id)?.players || [];
      const newPlayers = await getTransfermarktPlayerData(transfermarktName, transfermarktId, tournamentId, transfermarktUrlTemplate);

      // Delete players removed from the squad (diff by name, with award selection cleanup)
      if (deleteExistingPlayers && existingPlayers.length > 0) {
        const toDelete = existingPlayers.filter(
          existing => !newPlayers.some(p => p.name === existing.name)
        );
        if (toDelete.length > 0) {
          await deleteSpecificTeamPlayers(tournamentId, selectedTeam.id, toDelete.map(p => p.id));
          existingPlayers = existingPlayers.filter(p => !toDelete.some(d => d.id === p.id));
        }
      }

      // Update age and position for players still in the squad (fixes stale DOB-derived ages)
      const toUpdate = existingPlayers.filter(
        existing => newPlayers.some(p => p.name === existing.name)
      );
      await Promise.all(
        toUpdate.map(existing => {
          const fresh = newPlayers.find(p => p.name === existing.name)!;
          return updateTournamentTeamPlayer(existing.id, {
            age_at_tournament: fresh.ageAtTournament,
            position: fresh.position,
          });
        })
      );
      // Reflect updates in local state
      existingPlayers = existingPlayers.map(existing => {
        const fresh = newPlayers.find(p => p.name === existing.name);
        return fresh
          ? { ...existing, age_at_tournament: fresh.ageAtTournament, position: fresh.position }
          : existing;
      });

      // Insert players not yet in the DB
      const toCreate: PlayerNew[] = newPlayers
        .filter(p => !existingPlayers.some(existing => existing.name === p.name))
        .map(p => ({
          name: p.name,
          position: p.position,
          team_id: selectedTeam.id,
          tournament_id: tournamentId,
          age_at_tournament: p.ageAtTournament,
        }));
      const createdPlayers = await createTournamentTeamPlayers(toCreate);

      const allPlayers = [...existingPlayers, ...createdPlayers];
      setTeamsWithPlayers(teamsWithPlayers.map(t =>
        t.team.id === selectedTeam.id ? { team: t.team, players: allPlayers } : t
      ));

      // Persist Transfermarkt ID for pre-filling on re-import (fire-and-forget)
      saveTeamTransfermarktId(selectedTeam.id, transfermarktId).catch(err => {
        console.error('Failed to persist Transfermarkt team ID:', err);
      });
    } catch (error) {
      console.error(`Error importing players for team ${selectedTeam.name}:`, error);
    } finally {
      setImportLoading(false);
    }
  };

  const openImportPlayersModal = (team: Team) => {
    setSelectedTeam(team);
    const englishName = (team.name_i18n as Record<string, string> | undefined)?.en ?? team.name;
    setTransfermarktName(englishName.replaceAll(' ', '-').toLowerCase() + '-fc-players');
    setTransfermarktId(team.transfermarkt_id ?? '');
    setDeleteExistingPlayers(false);
    setOpenImportModal(true);
  };

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpandedTeam(newExpanded ? panel : false);
    };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  let logoUrl = null

  return (
    <>
      <Card>
        <CardHeader
          title="Tournament Players"
        />
        <CardContent>
          <div>
            {teamsWithPlayers
              .toSorted((a, b) => a.team.name.localeCompare(b.team.name))
              .map((teamData) => (
              <Accordion
                key={teamData.team.id}
                expanded={expandedTeam === `panel-${teamData.team.id}`}
                onChange={handleChange(`panel-${teamData.team.id}`)}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel-${teamData.team.id}-content`}
                  id={`panel-${teamData.team.id}-header`}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {(() => {
                      logoUrl = getThemeLogoUrl(teamData.team.theme);
                      return logoUrl && (
                        <img
                          src={logoUrl}
                          alt={`${teamData.team.name} logo`}
                          style={{ height: 24, width: 24, objectFit: 'contain' }}
                        />
                      );
                    })()}
                    <Typography>{teamData.team.name}</Typography>
                    <Typography variant="body2" color={teamData.players.length === 0 ? "warning" :  "success"} sx={{ ml: 2 }}>
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
                        <Button
                          color="inherit"
                          disabled={loading}
                          onClick={() => openImportPlayersModal(teamData.team)}
                        >
                          Importar de Transfermarkt.com
                        </Button>
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
          <Button
            variant="contained"
            onClick={handleImportPlayers}
            disabled={!transfermarktName || !transfermarktId || importLoading}
            loading={importLoading}
          >
            {importLoading ? 'Importando...' : 'Importar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

'use client'

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Typography,
  Alert,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { Team } from '../../db/tables-definition';
import { getTeamsMap } from '../../actions/tournament-actions';
import TeamDialog from './internal/team-dialog';
import {getThemeLogoUrl} from "../../utils/theme-utils";
import { TeamGridSkeleton } from '../skeletons';

interface TournamentTeamsManagerProps {
  readonly tournamentId: string;
}

export default function TournamentTeamsManagerTab({ tournamentId }: TournamentTeamsManagerProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Fetch teams when component mounts or tournamentId changes
  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      setError(null);

      try {
        const teamsMap = await getTeamsMap(tournamentId);
        const teamsList = Object.values(teamsMap);
        setTeams(teamsList);
      } catch (err: any) {
        console.error('Error loading teams:', err);
        setError(err.message || 'Error loading teams');
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, [tournamentId]);

  // Handle team edit
  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setOpenDialog(true);
  };

  // Handle team create
  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setOpenDialog(true);
  };

  // Handle team saved (created or updated)
  const handleTeamSaved = (savedTeam: Team) => {
    if (selectedTeam) {
      // Update existing team in the list
      setTeams(prevTeams =>
        prevTeams.map(team => team.id === savedTeam.id ? savedTeam : team)
      );
    } else {
      // Add new team to the list
      setTeams(prevTeams => [...prevTeams, savedTeam]);
    }
    setOpenDialog(false);
    setSelectedTeam(null);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTeam(null);
  };

  // Show loading state
  if (loading) {
    return <TeamGridSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  let logoUrl = null;

  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Tournament Teams</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTeam}
          >
            Add Team
          </Button>
        </Box>

        {teams.length === 0 ? (
          <Alert severity="info">
            No teams found for this tournament.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {teams
              .toSorted((a,b) => a.name.localeCompare(b.name))
              .map((team) => (
              <Grid
                key={team.id}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4,
                  lg: 3
                }}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                    <Tooltip title="Edit Team">
                      <IconButton
                        onClick={() => handleEditTeam(team)}
                        sx={{
                          color: 'secondary.contrastText',
                          backgroundColor: 'secondary.main',
                          ":hover": {
                            backgroundColor: 'secondary.dark',
                          },
                          borderRadius: '50%',
                          padding: '4px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                        }}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <CardMedia
                    component="div"
                    sx={{
                      height: 140,
                      backgroundColor: team.theme?.primary_color || '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {(() => {
                      logoUrl = getThemeLogoUrl(team.theme);
                      return logoUrl && (
                        <img
                          src={logoUrl}
                          alt={team.name}
                          style={{
                            maxHeight: '50%',
                            maxWidth: '80%',
                            objectFit: 'contain',
                            marginRight: '16px'
                          }}
                        />
                      );
                    })()}
                    <Typography variant="h4" color={team.theme?.secondary_color || '#000'}>
                      {team.name} ({team.short_name})
                    </Typography>

                  </CardMedia>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      {/* Unified Dialog for Create/Edit */}
      <TeamDialog
        open={openDialog}
        onClose={handleCloseDialog}
        team={selectedTeam}
        tournamentId={tournamentId}
        onTeamSaved={handleTeamSaved}
      />
    </Box>
  );
}

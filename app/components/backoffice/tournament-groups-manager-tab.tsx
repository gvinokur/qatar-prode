'use client'

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import GroupDialog from './internal/group-dialog';
import {Team} from "../../db/tables-definition";
import {getCompleteTournamentGroups, getTeamsMap} from "../../actions/tournament-actions";
import {ExtendedGroupData} from "../../definitions";

interface TournamentGroupsProps {
  tournamentId: string;
}

const TournamentGroups: React.FC<TournamentGroupsProps> = ({ tournamentId }) => {
  const [groups, setGroups] = useState<ExtendedGroupData[]>([]);
  const [teams, setTeams] = useState<{[key:string]:Team}>({});
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<ExtendedGroupData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [allGroups, teamsData] = await Promise.all([
          getCompleteTournamentGroups(tournamentId),
          getTeamsMap(tournamentId),
        ]);

        // Sort groups alphabetically by letter
        const sortedGroups = allGroups.sort((a, b) => a.group_letter.localeCompare(b.group_letter));
        setGroups(sortedGroups);
        setTeams(teamsData);
      } catch (error) {
        console.error('Error loading tournament data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tournamentId]);

  const handleOpenCreateDialog = () => {
    setCurrentGroup(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (group: ExtendedGroupData) => {
    setCurrentGroup(group);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentGroup(null);
  };

  const handleGroupSaved = (updatedGroups: ExtendedGroupData[]) => {
    // Sort groups alphabetically by letter
    const sortedGroups = updatedGroups.sort((a, b) => a.group_letter.localeCompare(b.group_letter));
    setGroups(sortedGroups);
    setOpenDialog(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  const getAvailableTeams = (): {[key:string]: Team} => {
    const availableTeams = {...teams};
    groups.filter(group => group.group_letter !== currentGroup?.group_letter).forEach(group => {
      group.teams.forEach(team => {
        delete availableTeams[team.team_id];
      });
    });
    return availableTeams;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Tournament Groups</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Create Group
        </Button>
      </Box>
      {groups.length === 0 ? (
        <Alert severity="info">
          No groups found for this tournament.
        </Alert>
      ) : (
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={3}>
            {groups.map((group) => (
              <Grid
                key={group.id}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4
                }}>
                <Paper
                  elevation={3}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4
                    }}
                  >
                    <Typography variant="h6">
                      Group {group.group_letter}
                    </Typography>
                    <Box>
                      <Button
                        variant="contained"
                        size="small"
                        color="secondary"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEditDialog(group)}
                      >
                        Edit
                      </Button>
                    </Box>
                  </Box>
                  <Divider />
                  <Box p={2} sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Teams:
                    </Typography>
                    {group.teams && group.teams.length > 0 ? (
                      <List dense disablePadding>
                        {group.teams.map((team, index) => (
                          <React.Fragment key={team.team_id}>
                            <ListItem disablePadding sx={{ py: 0.5 }}>
                              <ListItemText
                                primary={teams[team.team_id]?.name}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  sx: { display: 'flex', alignItems: 'center' }
                                }}
                              />
                            </ListItem>
                            {index < group.teams.length - 1 && (
                              <Divider component="li" variant="inset" sx={{ ml: 0 }} />
                            )}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No teams in this group
                      </Typography>
                    )}
                  </Box>
                  {group.sort_by_games_between_teams && (
                    <Box sx={{ p: 1.5, bgcolor: 'grey.100', borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">
                        Uses head-to-head results for tiebreakers
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      <GroupDialog
        open={openDialog}
        onClose={handleCloseDialog}
        group={currentGroup}
        tournamentId={tournamentId}
        availableTeams={getAvailableTeams()}
        onSave={handleGroupSaved}
      />
    </Box>
  );
};

export default TournamentGroups;

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  FormHelperText,
  CircularProgress, Paper, FormControlLabel, Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {Team, TournamentGroup, TournamentGroupTeam} from "../../../db/tables-definition";
import {ExtendedGroupData} from "../../../definitions";
import {createOrUpdateTournamentGroup} from "../../../actions/tournament-actions";

interface GroupDialogProps {
  open: boolean;
  onClose: () => void;
  group: ExtendedGroupData | null;
  tournamentId: string;
  availableTeams: {[key:string]: Team };
  onSave: (groups: ExtendedGroupData[]) => void;
}

const GroupDialog: React.FC<GroupDialogProps> = ({
  open,
  onClose,
  group,
  tournamentId,
  availableTeams,
  onSave
}) => {
  const [letter, setLetter] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [unselectedTeams, setUnselectedTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [letterError, setLetterError] = useState<string | null>(null);
  const [sortByGamesBetweenTeams, setSortByGamesBetweenTeams] = useState(false);

  useEffect(() => {
    if (open) {
      if (group) {
        setLetter(group.group_letter);
        setSelectedTeams(group.teams.map(team => availableTeams[team.team_id]));

        // Filter out teams that are already in the group
        const teamIds = (group.teams || []).map(team => team.team_id);
        setUnselectedTeams(Object.values(availableTeams).filter(team => !teamIds.includes(team.id)));
        setSortByGamesBetweenTeams(group.sort_by_games_between_teams || false);
      } else {
        setLetter('');
        setSelectedTeams([]);
        setUnselectedTeams([...Object.values(availableTeams)]);
      }
      setError(null);
      setLetterError(null);
    }
  }, [open, group, availableTeams]);

  const handleLetterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setLetter(value);

    if (value.trim() === '') {
      setLetterError('Group letter is required');
    } else if (!/^[A-Z]$/.test(value)) {
      setLetterError('Group letter must be a single uppercase letter');
    } else {
      setLetterError(null);
    }
  };

  const handleAddTeam = (team: Team) => {
    setSelectedTeams([...selectedTeams, team]);
    setUnselectedTeams(unselectedTeams.filter(t => t.id !== team.id));
  };

  const handleRemoveTeam = (team: Team) => {
    setUnselectedTeams([...unselectedTeams, team]);
    setSelectedTeams(selectedTeams.filter(t => t.id !== team.id));
  };

  const handleSave = async () => {
    if (letter.trim() === '') {
      setLetterError('Group letter is required');
      return;
    }

    if (!/^[A-Z]$/.test(letter)) {
      setLetterError('Group letter must be a single uppercase letter');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const teamIds = selectedTeams.map(team => team.id);

      console.log('teamIds', teamIds)
      const updatedGroups = await createOrUpdateTournamentGroup(tournamentId, {
        id: group?.id,
        group_letter: letter,
        sort_by_games_between_teams: sortByGamesBetweenTeams,
      }, teamIds)
      setLoading(false)
      onSave(updatedGroups);
    } catch (err) {
      console.error('Error saving group:', err);
      setError('Failed to save group. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {group ? `Edit Group ${group.group_letter}` : 'Create New Group'}
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <TextField
            label="Group Letter"
            value={letter}
            onChange={handleLetterChange}
            fullWidth
            margin="normal"
            error={!!letterError}
            helperText={letterError}
            inputProps={{ maxLength: 1 }}
            placeholder="A"
          />
          <FormHelperText>Enter a single uppercase letter (A-Z)</FormHelperText>
        </Box>

        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Group Rules Configuration
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={sortByGamesBetweenTeams}
                onChange={(e) => setSortByGamesBetweenTeams(e.target.checked)}
                color="primary"
              />
            }
            label="Sort by games between teams"
          />
          <FormHelperText>
            When enabled, direct matches between tied teams will be prioritized in group standings
          </FormHelperText>
        </Paper>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
          {/* Selected Teams */}
          <Box flex={1}>
            <Typography variant="subtitle1" gutterBottom>
              Teams in Group {letter || ''}
            </Typography>
            <List
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                height: 300,
                overflow: 'auto',
                bgcolor: 'background.paper'
              }}
            >
              {selectedTeams.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No teams added" secondary="Add teams from the list on the right" />
                </ListItem>
              ) : (
                selectedTeams.map(team => (
                  <ListItem key={team.id} divider>
                    <ListItemText primary={team.name} />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleRemoveTeam(team)} color="error">
                        <RemoveIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          </Box>

          {/* Available Teams */}
          <Box flex={1}>
            <Typography variant="subtitle1" gutterBottom>
              Available Teams
            </Typography>
            <List
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                height: 300,
                overflow: 'auto',
                bgcolor: 'background.paper'
              }}
            >
              {unselectedTeams.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No teams available" secondary="All teams have been added to a group" />
                </ListItem>
              ) : (
                unselectedTeams.sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                  <ListItem key={team.id} divider>
                    <ListItemText primary={team.name} />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleAddTeam(team)} color="primary">
                        <AddIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        </Box>

        {error && (
          <Box mt={2}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={loading || !!letterError}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupDialog;

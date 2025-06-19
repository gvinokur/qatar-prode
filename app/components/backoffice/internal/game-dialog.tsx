'use client'

import React, {useState, useEffect, useCallback} from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Typography,
  RadioGroup,
  Radio,
  FormControlLabel,
  Divider,
  FormLabel, Autocomplete
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import SaveIcon from '@mui/icons-material/Save';
import {GameNew, GameUpdate, PlayoffRound, Team} from "../../../db/tables-definition";
import { createOrUpdateGame } from "../../../actions/game-actions";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import UTC from "dayjs/plugin/utc";
import {ExtendedGameData, ExtendedGroupData} from "../../../definitions";
import {GameWinnerSelector, GroupPositionSelector} from "./game-rule-selectors";

interface GameDialogProps {
  open: boolean;
  onClose: () => void;
  game: ExtendedGameData | null;
  nextGameNumber?: number;
  tournamentId: string;
  teams: {[key: string]: Team};
  groups: ExtendedGroupData[];
  playoffStages: PlayoffRound[];
  onSave: () => void;
}

dayjs.extend(UTC);
dayjs.extend(timezone);

const GameDialog: React.FC<GameDialogProps> = ({
  open,
  onClose,
  game,
  nextGameNumber = 1,
  tournamentId,
  teams,
  groups,
  playoffStages,
  onSave
}) => {
  // Basic game info
  const [gameNumber, setGameNumber] = useState<number | null>(null);
  const [gameDate, setGameDate] = useState<Date | null>(new Date());
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState(dayjs.tz.guess());
  const [gameType, setGameType] = useState<'group' | 'playoff'>('group');

  // Group-specific fields
  const [groupId, setGroupId] = useState<string | ''>('');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');

  // Playoff-specific fields
  const [playoffStage, setPlayoffStage] = useState<PlayoffRound | undefined | null>(null);
  const [homeTeamRule, setHomeTeamRule] = useState('');
  const [awayTeamRule, setAwayTeamRule] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const findPlayoffStage = useCallback((stageId?: string) => {
    return playoffStages.find(stage => stage.id === stageId);
  }, [playoffStages]);

  useEffect(() => {
    if (open) {
      if (game) {
        // Edit mode - populate form with game data
        setGameNumber(game.game_number || nextGameNumber);
        setGameDate(game.game_date);
        setLocation(game.location || '');

        // Determine game type
        if (game.game_type === 'group') {
          setGameType('group');
          setGroupId(game.group?.tournament_group_id || '');
          setPlayoffStage(null);
        } else {
          setGameType('playoff');
          setPlayoffStage(findPlayoffStage(game.playoffStage?.tournament_playoff_round_id));
          setGroupId('');
        }

        setHomeTeamId(game.home_team || '');
        setAwayTeamId(game.away_team || '');
        // For playoff games, we would need to set team rules here
        // This would require additional fields in the Game type
      } else {
        // Create mode - reset form
        setGameNumber(nextGameNumber);
        setGameDate(new Date());
        setLocation('');
        setGameType('group');
        setGroupId('');
        setPlayoffStage(null);
        setHomeTeamId('');
        setAwayTeamId('');
        setHomeTeamRule('');
        setAwayTeamRule('');
      }

      setError(null);
      setFormErrors({});
    }
  }, [open, game, findPlayoffStage, nextGameNumber]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!gameNumber && gameNumber !== 0) errors.gameNumber = 'Game number is required';
    if (!gameDate) errors.gameDate = 'Game date is required';

    // Validate based on game type
    if (gameType === 'group') {
      if (!groupId) {
        errors.groupId = 'Group is required';
      }
      if (!homeTeamId) errors.homeTeamId = 'Home team is required';
      if (!awayTeamId) errors.awayTeamId = 'Away team is required';
      if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
        errors.awayTeamId = 'Away team must be different from home team';
      }
    } else {
      if (!playoffStage) {
        errors.playoffStageId = 'Playoff round is required';
      }
      // For playoff games, we might validate team rules here
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const timezones = Intl.supportedValuesOf('timeZone');

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const gameData: GameNew | GameUpdate = {
        id: game?.id,
        tournament_id: tournamentId,
        game_date: gameDate!,
        game_local_timezone: timezone,
        location,
        game_number: Number(gameNumber),
        game_type: gameType === 'group' ? 'group' :
          playoffStage?.round_order === 1 ? 'first_round' :
            'other_round',
        home_team: gameType === 'group' ? homeTeamId : null,
        away_team: gameType === 'group' ? awayTeamId : null,
        // For playoff games, we would include team rules here
        home_team_rule: gameType === 'playoff' && homeTeamRule || undefined,
        away_team_rule: gameType === 'playoff' && awayTeamRule || undefined,
      };

      await createOrUpdateGame(gameData, groupId, playoffStage?.id);
      onSave();
    } catch (err: any) {
      console.error('Error saving game:', err);
      setError(err.message || 'Failed to save game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const findTeamsForGroup = () => {
    if (groupId) {
      return groups
        .find((group) => group.id === groupId)?.teams
          .map((team: {team_id: string}) => teams[team.team_id]) || [];
    }
    return [];
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {game ? 'Edit Game' : 'Create New Game'}
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Basic Game Information
          </Typography>

          <Grid container spacing={3}>
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3
              }}>
              <TextField
                label="Game Number"
                type="number"
                value={gameNumber}
                onChange={(e) => setGameNumber(e.target.value === '' ? null : Number(e.target.value))}
                fullWidth
                required
                error={!!formErrors.gameNumber}
                helperText={formErrors.gameNumber || "Used for ordering games"}
                disabled={loading}
                InputProps={{ inputProps: { min: 1 } }}
                margin="normal"
                focused
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 4
              }}>
              <TextField
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
                disabled={loading}
                placeholder="Enter location name"
                margin="normal"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 5
              }}
            >
              <Autocomplete
                options={timezones}
                disableClearable
                getOptionLabel={option => option}
                value={timezone}
                disabled={loading}
                fullWidth
                onChange={(e, v) => setTimezone(v)}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={'Game Timezone'}
                    variant="outlined"
                    margin="normal"
                  />
                )}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 6
              }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Game Date & Time (Your Time)"
                  value={dayjs(gameDate)}
                  onChange={(newDate) => setGameDate(newDate?.toDate() || null)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      error: !!formErrors.gameDate,
                      helperText: formErrors.gameDate,
                      disabled: loading
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 6
              }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Game Date & Time (Local Time)"
                  value={dayjs(gameDate).tz(timezone)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      disabled: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid size={12}>
              <FormControl component="fieldset" margin="normal">
                <FormLabel component="legend">Game Type</FormLabel>
                <RadioGroup
                  row
                  name="game-type"
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value as 'group' | 'playoff')}
                >
                  <FormControlLabel
                    value="group"
                    control={<Radio />}
                    label="Group Stage"
                    disabled={loading}
                  />
                  <FormControlLabel
                    value="playoff"
                    control={<Radio />}
                    label="Playoff Round"
                    disabled={loading}
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Group-specific fields */}
        {gameType === 'group' && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Group Stage Details
            </Typography>

            <Grid container spacing={3}>
              <Grid size={12}>
                <FormControl fullWidth error={!!formErrors.groupId} margin="normal">
                  <InputLabel>Group</InputLabel>
                  <Select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    label="Group"
                    disabled={loading}
                  >
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        Group {group.group_letter}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.groupId && (
                    <FormHelperText error>{formErrors.groupId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <FormControl fullWidth error={!!formErrors.homeTeamId} margin="normal">
                  <InputLabel>Home Team</InputLabel>
                  <Select
                    value={homeTeamId}
                    onChange={(e) => setHomeTeamId(e.target.value)}
                    label="Home Team"
                    disabled={loading}
                  >
                    {findTeamsForGroup().map((team) => (
                      <MenuItem key={`home-${team.id}`} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.homeTeamId && (
                    <FormHelperText error>{formErrors.homeTeamId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <FormControl fullWidth error={!!formErrors.awayTeamId} margin="normal">
                  <InputLabel>Away Team</InputLabel>
                  <Select
                    value={awayTeamId}
                    onChange={(e) => setAwayTeamId(e.target.value)}
                    label="Away Team"
                    disabled={loading}
                  >
                    {findTeamsForGroup().map((team) => (
                      <MenuItem key={`away-${team.id}`} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.awayTeamId && (
                    <FormHelperText error>{formErrors.awayTeamId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Playoff-specific fields */}
        {gameType === 'playoff' && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Playoff Round Details
            </Typography>

            <Grid container spacing={3}>
              <Grid size={12}>
                <FormControl fullWidth error={!!formErrors.playoffStageId} margin="normal">
                  <InputLabel>Playoff Round</InputLabel>
                  <Select
                    value={playoffStage?.id || ''}
                    onChange={(e) => setPlayoffStage(findPlayoffStage(e.target.value))}
                    label="Playoff Round"
                    disabled={loading}
                  >
                    {playoffStages.map((stage) => (
                      <MenuItem key={stage.id} value={stage.id}>
                        {stage.round_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.playoffStageId && (
                    <FormHelperText error>{formErrors.playoffStageId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <Typography variant="subtitle2" gutterBottom>
                  Home Team Rule
                </Typography>
                {playoffStage?.round_order === 1 ? (
                  <GroupPositionSelector
                    value={homeTeamRule}
                    onChange={setHomeTeamRule}
                    groups={groups}
                    disabled={loading}
                  />
                ) : (
                  <GameWinnerSelector
                    value={homeTeamRule}
                    onChange={setHomeTeamRule}
                    currentGameNumber={Number(gameNumber) || 999}
                    disabled={loading}
                  />
                )}
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <Typography variant="subtitle2" gutterBottom>
                  Away Team Rule
                </Typography>
                {playoffStage?.round_order === 1 ? (
                  <GroupPositionSelector
                    value={awayTeamRule}
                    onChange={setAwayTeamRule}
                    groups={groups}
                    disabled={loading}
                  />
                ) : (
                  <GameWinnerSelector
                    value={awayTeamRule}
                    onChange={setAwayTeamRule}
                    currentGameNumber={Number(gameNumber) || 999}
                    disabled={loading}
                  />
                )}
              </Grid>
            </Grid>
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
          startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Game'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GameDialog;

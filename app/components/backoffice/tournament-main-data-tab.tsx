'use client'

import {useState, useEffect, useCallback} from 'react';
import {
  Box,
  Grid,
  Paper,
  Snackbar,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button, FormControlLabel, Switch
} from "@mui/material";
import {PlayoffRound, Theme, Tournament} from '../../db/tables-definition';
import {createOrUpdateTournament, getTournamentById, getPlayoffRounds} from '../../actions/tournament-actions';
import { MuiColorInput } from 'mui-color-input';
import LinkIcon from '@mui/icons-material/Link';
import ImagePicker from "../friend-groups/image-picker";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PlayoffRoundDialog from './internal/playoff-round-dialog';
import {getThemeLogoUrl} from "../../utils/theme-utils";

type Props = {
  tournamentId: string;
  onUpdate?: (updatedTournament: Tournament) => void;
}

export default function TournamentMainDataTab({ tournamentId, onUpdate }: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [longName, setLongName] = useState<string>('');
  const [shortName, setShortName] = useState<string>('');
  const [theme, setTheme] = useState<Theme>({
    primary_color: '#1976d2',
    secondary_color: '#dc004e',
    web_page: '',
    logo: '',
    is_s3_logo: false,
    s3_logo_key: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [devOnly, setDevOnly] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState(false)
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  // Playoff rounds state
  const [playoffRounds, setPlayoffRounds] = useState<PlayoffRound[]>([]);
  const [loadingPlayoffRounds, setLoadingPlayoffRounds] = useState<boolean>(false);
  const [playoffRoundDialogOpen, setPlayoffRoundDialogOpen] = useState<boolean>(false);
  const [currentPlayoffRound, setCurrentPlayoffRound] = useState<PlayoffRound | null>(null);
  const [playoffRoundSuccess, setPlayoffRoundSuccess] = useState<boolean>(false);

  //active state
  const [isActive, setIsActive] = useState<boolean>(false);

  // Fetch playoff rounds
  const fetchPlayoffRounds = useCallback(async () => {
    setLoadingPlayoffRounds(true);
    try {
      const rounds = await getPlayoffRounds(tournamentId);
      // Sort by round_order
      const sortedRounds = rounds.sort((a, b) => a.round_order - b.round_order);
      setPlayoffRounds(sortedRounds);
    } catch (err: any) {
      console.error('Error loading playoff rounds:', err);
      setError(err.message || 'Error loading playoff rounds');
    } finally {
      setLoadingPlayoffRounds(false);
    }
  }, [tournamentId]);

  // Fetch tournament data when component mounts or tournamentId changes
  useEffect(() => {
    async function fetchTournamentData() {
      setLoadingData(true);
      setDataError(null);

      try {
        const tournamentData = await getTournamentById(tournamentId);
        if (!tournamentData) {
          throw new Error('Tournament not found');
        }

        setTournament(tournamentData);
        setLongName(tournamentData.long_name || '');
        setShortName(tournamentData.short_name || '');
        setDevOnly(tournamentData.dev_only || false);
        setDisplayName(tournamentData.display_name || false);
        setTheme({
          primary_color: tournamentData.theme?.primary_color || '#1976d2',
          secondary_color: tournamentData.theme?.secondary_color || '#dc004e',
          web_page: tournamentData.theme?.web_page || '',
          logo: tournamentData.theme?.logo || '',
          is_s3_logo: tournamentData.theme?.is_s3_logo || false,
          s3_logo_key: tournamentData.theme?.s3_logo_key || ''
        });
        setIsActive(tournamentData.is_active);

        // Fetch playoff rounds
        await fetchPlayoffRounds();
      } catch (err: any) {
        console.error('Error loading tournament:', err);
        setDataError(err.message || 'Error loading tournament data');
      } finally {
        setLoadingData(false);
      }
    }

    fetchTournamentData();
  }, [tournamentId, fetchPlayoffRounds]);



  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update tournament data
      const formData = new FormData();
      formData.append('tournament', JSON.stringify({
        long_name: longName,
        short_name: shortName,
        theme: theme,
        dev_only: devOnly,
        display_name: displayName,
      }));

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const updatedTournament = await createOrUpdateTournament(tournamentId, formData);

      setSuccess(true);

      // Update local state with new data
      if (updatedTournament) {
        setTournament(updatedTournament as Tournament);

        // If onUpdate callback is provided, call it with updated data
        if (onUpdate) {
          onUpdate(updatedTournament as Tournament);
        }
      }
    } catch (err: any) {
      console.error('Error updating tournament:', err);
      setError(err.message || 'Error updating tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleActivationToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newActiveState = event.target.checked;
    setLoading(true);
    setError(null);

    try {
      // Create a minimal update with just the is_active field
      const formData = new FormData();
      formData.append('tournament', JSON.stringify({
        is_active: newActiveState
      }));

      const updatedTournament = await createOrUpdateTournament(tournamentId, formData);

      if (updatedTournament) {
        setTournament(updatedTournament as Tournament);
        setIsActive(updatedTournament.is_active || false);

        // If onUpdate callback is provided, call it with updated data
        if (onUpdate) {
          onUpdate(updatedTournament as Tournament);
        }

        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Error updating tournament activation:', err);
      setError(err.message || 'Error updating tournament activation status');
      // Revert the switch state on error
      setIsActive(!newActiveState);
    } finally {
      setLoading(false);
    }
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
    }
  };

  // Handle color change
  const handleColorChange = (color: string, type: 'primary_color' | 'secondary_color') => {
    setTheme(prev => ({
      ...prev,
      [type]: color
    }));
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSuccess(false);
    setPlayoffRoundSuccess(false);
  };

  // Open playoff round dialog for creation
  const handleOpenCreatePlayoffRoundDialog = () => {
    setCurrentPlayoffRound(null);
    setPlayoffRoundDialogOpen(true);
  };

  // Open playoff round dialog for editing
  const handleOpenEditPlayoffRoundDialog = (round: PlayoffRound) => {
    setCurrentPlayoffRound(round);
    setPlayoffRoundDialogOpen(true);
  };

  // Close playoff round dialog
  const handleClosePlayoffRoundDialog = () => {
    setPlayoffRoundDialogOpen(false);
    setCurrentPlayoffRound(null);
  };

  // Handle playoff round saved
  const handlePlayoffRoundSaved = async () => {
    await fetchPlayoffRounds();
    setPlayoffRoundSuccess(true);
  };

  // Calculate next order for new playoff rounds
  const getNextPlayoffRoundOrder = () => {
    return playoffRounds.length > 0
      ? Math.max(...playoffRounds.map(r => r.round_order)) + 1
      : 1;
  };

  // Show loading state while fetching data
  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error if data loading failed
  if (dataError || !tournament) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {dataError || 'Failed to load tournament data'}
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tournament Information
          <FormControlLabel
            sx={{
              paddingLeft: '10px',
              float: 'right',
            }}
            control={
              <Switch
                checked={isActive}
                onChange={handleActivationToggle}
                color="primary"
                disabled={loading}
              />
            }
            label={isActive ? "Active" : "Inactive"}
          />
        </Typography>

        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              label="Long Name"
              fullWidth
              value={longName}
              onChange={(e) => setLongName(e.target.value)}
              required
              margin="normal"
              helperText="The full name of the tournament (e.g. 'FIFA World Cup 2022')"
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              label="Short Name"
              fullWidth
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              required
              margin="normal"
              helperText="A shorter version of the name (e.g. 'World Cup 2022')"
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Typography variant="subtitle2" gutterBottom>
              Primary Color
            </Typography>
            <MuiColorInput
              value={theme.primary_color || '#000000'}
              onChange={(color) => handleColorChange(color, 'primary_color')}
              format="hex"
              fullWidth
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Typography variant="subtitle2" gutterBottom>
              Secondary Color
            </Typography>
            <MuiColorInput
              value={theme.secondary_color || '#ffffff'}
              onChange={(color) => handleColorChange(color, 'secondary_color')}
              format="hex"
              fullWidth
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              label="External Website"
              fullWidth
              value={theme.web_page || ''}
              onChange={(e) => setTheme(prev => ({ ...prev, web_page: e.target.value }))}
              margin="normal"
              helperText="Official tournament website (optional)"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid
            alignContent={'center'}
            size={{
              xs: 12,
              md: 6,
              lg: 3
            }}>
            <FormControlLabel
              labelPlacement={'start'}
              control={
                <Switch
                  checked={devOnly}
                  onChange={(e) => setDevOnly(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Development Mode Only</Typography>
                  <Typography variant="caption" color="text.secondary">
                    When enabled, this tournament will only be visible in development mode
                  </Typography>
                </Box>
              }
            />
          </Grid>
          <Grid
            alignContent={'center'}
            size={{
              xs: 12,
              md: 6,
              lg: 3
            }}>
            <FormControlLabel
              labelPlacement={'start'}
              control={
                <Switch
                  checked={displayName}
                  onChange={(e) => setDisplayName(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Display Name</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Display the name of the tournament in the banner
                  </Typography>
                </Box>
              }
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Typography variant="subtitle2" gutterBottom>
              Tournament Logo
            </Typography>
            <ImagePicker
              id="logo"
              name="logo"
              defaultValue={getThemeLogoUrl(theme) || undefined}
              onChange={handleLogoChange}
              onBlur={() => {}}
              aspectRatio={3/1}
              aspectRatioTolerance={1}
              previewWidth={450}
              previewBackgroundColor={theme.primary_color}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2">
                Playoff Rounds
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenCreatePlayoffRoundDialog}
              >
                Add Round
              </Button>
            </Box>

            {loadingPlayoffRounds ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : playoffRounds.length === 0 ? (
              <Alert severity="info">
                No playoff rounds defined for this tournament.
              </Alert>
            ) : (
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {playoffRounds.map((round) => (
                    <ListItem key={round.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleOpenEditPlayoffRoundDialog(round)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={round.round_name}
                        secondary={
                          `Order: ${round.round_order} | ` +
                          `Games: ${round.total_games}` +
                          (round.is_final && ' | Final Game' || '') +
                          (round.is_third_place && ' | Third Place Game' || '')
                      }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            loading={loading}
            type="submit"
            variant="contained"
            color="primary"
          >
            Save Changes
          </Button>
        </Box>
      </Paper>
      {/* Playoff Round Dialog */}
      <PlayoffRoundDialog
        open={playoffRoundDialogOpen}
        onClose={handleClosePlayoffRoundDialog}
        onSave={handlePlayoffRoundSaved}
        tournamentId={tournamentId}
        round={currentPlayoffRound}
        nextOrder={getNextPlayoffRoundOrder()}
      />
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Tournament information updated successfully
        </Alert>
      </Snackbar>
      <Snackbar
        open={playoffRoundSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Playoff round saved successfully
        </Alert>
      </Snackbar>
    </Box>
  );
}

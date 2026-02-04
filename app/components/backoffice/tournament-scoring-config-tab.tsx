'use client'

import { Box } from "../mui-wrappers";
import {
  Backdrop,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  TextField,
  Typography,
  Alert,
  Chip
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  getTournamentScoringConfigAction,
  updateTournamentScoringConfigAction,
  getRecommendedScoringValues
} from "../../actions/tournament-scoring-actions";
import { BackofficeTabsSkeleton } from "../skeletons";

type Props = {
  readonly tournamentId: string
}

interface ScoringConfig {
  game_exact_score_points: number;
  game_correct_outcome_points: number;
  champion_points: number;
  runner_up_points: number;
  third_place_points: number;
  individual_award_points: number;
  qualified_team_points: number;
  exact_position_qualified_points: number;
  max_silver_games: number;
  max_golden_games: number;
}

export default function TournamentScoringConfigTab({ tournamentId }: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [recommended, setRecommended] = useState<ScoringConfig | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const data = await getTournamentScoringConfigAction(tournamentId);
        setConfig(data);

        // Fetch recommended values
        const recommendedData = await getRecommendedScoringValues(tournamentId);
        setRecommended(recommendedData);
      } catch (error) {
        setErrorMessage('Error loading scoring configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [tournamentId]);

  const handleFieldChange = (field: keyof ScoringConfig) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 0;
    setConfig(prev => prev ? { ...prev, [field]: value } : null);
  };

  const applyRecommended = () => {
    if (recommended) {
      setConfig(recommended);
      setSuccessMessage('Recommended values applied! Remember to save.');
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');

      await updateTournamentScoringConfigAction(tournamentId, config);

      setSuccessMessage('Scoring configuration saved successfully!');
    } catch (error) {
      setErrorMessage('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const scoringFields: { key: keyof ScoringConfig; label: string; description: string }[] = [
    { key: 'game_exact_score_points', label: 'Exact Score Points', description: 'Points for guessing exact game score' },
    { key: 'game_correct_outcome_points', label: 'Correct Outcome Points', description: 'Points for guessing correct winner' },
    { key: 'champion_points', label: 'Champion Points', description: 'Points for guessing tournament champion' },
    { key: 'runner_up_points', label: 'Runner-up Points', description: 'Points for guessing runner-up' },
    { key: 'third_place_points', label: 'Third Place Points', description: 'Points for guessing third place' },
    { key: 'individual_award_points', label: 'Individual Award Points', description: 'Points for each correct individual award' },
    { key: 'qualified_team_points', label: 'Qualified Team Points', description: 'Points for team qualifying (wrong position)' },
    { key: 'exact_position_qualified_points', label: 'Exact Position + Qualified Points', description: 'Points for exact position + qualification' },
  ];

  const boostFields: { key: keyof ScoringConfig; label: string; description: string }[] = [
    { key: 'max_silver_games', label: 'Max Silver Boosts', description: 'Maximum 2x boost games per user (0 to disable)' },
    { key: 'max_golden_games', label: 'Max Golden Boosts', description: 'Maximum 3x boost games per user (0 to disable)' },
  ];

  return (
    <Box pt={2}>
      {loading ? (
        <BackofficeTabsSkeleton />
      ) : config ? (
        <Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          {/* Game Scoring Section */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              title="Game Prediction Scoring"
              subheader="Configure points for individual game predictions"
            />
            <CardContent>
              <Grid container spacing={3}>
                {scoringFields.map(field => (
                  <Grid key={field.key} size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label={field.label}
                      helperText={
                        <span>
                          {field.description}
                          {recommended && (
                            <Chip
                              label={`Recommended: ${recommended[field.key]}`}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </span>
                      }
                      value={config[field.key]}
                      onChange={handleFieldChange(field.key)}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Boost Configuration Section */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              title="Game Boost Configuration"
              subheader="Configure silver (2x) and golden (3x) game boost limits"
            />
            <CardContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                Users can select games to apply multipliers before they start. Set to 0 to disable boosts for this tournament.
              </Alert>
              <Grid container spacing={3}>
                {boostFields.map(field => (
                  <Grid key={field.key} size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label={field.label}
                      helperText={
                        <span>
                          {field.description}
                          {recommended && (
                            <Chip
                              label={`Recommended: ${recommended[field.key]}`}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </span>
                      }
                      value={config[field.key]}
                      onChange={handleFieldChange(field.key)}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={applyRecommended}
                    disabled={!recommended || saving}
                  >
                    Apply Recommended Values
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    Based on tournament size and structure
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={saveConfig}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

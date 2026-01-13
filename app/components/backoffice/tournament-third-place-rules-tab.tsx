'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  getThirdPlaceRulesForTournament,
  upsertThirdPlaceRuleAction,
  deleteThirdPlaceRuleAction
} from '../../actions/third-place-rules-actions';

interface TournamentThirdPlaceRulesTabProps {
  tournamentId: string;
}

const TournamentThirdPlaceRulesTab: React.FC<TournamentThirdPlaceRulesTabProps> = ({
  tournamentId
}) => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<any | null>(null);

  // Form state
  const [combinationKey, setCombinationKey] = useState('');
  const [rulesJson, setRulesJson] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getThirdPlaceRulesForTournament(tournamentId);
      setRules(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load third-place rules');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleOpenDialog = (rule?: any) => {
    if (rule) {
      setCurrentRule(rule);
      setCombinationKey(rule.combination_key);
      setRulesJson(JSON.stringify(rule.rules, null, 2));
    } else {
      setCurrentRule(null);
      setCombinationKey('');
      setRulesJson('{}');
    }
    setJsonError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentRule(null);
    setSaving(false);
  };

  const validateAndSave = async () => {
    // Validate combination key
    if (!combinationKey.trim()) {
      setJsonError('Combination key is required');
      return;
    }

    if (!/^[A-Z]+$/.test(combinationKey)) {
      setJsonError('Combination key must contain only uppercase letters (e.g., "ABCDEFGH")');
      return;
    }

    // Validate JSON
    let parsedRules;
    try {
      parsedRules = JSON.parse(rulesJson);
    } catch {
      setJsonError('Invalid JSON format. Please check your syntax.');
      return;
    }

    if (typeof parsedRules !== 'object' || parsedRules === null || Array.isArray(parsedRules)) {
      setJsonError('Rules must be a JSON object (not an array)');
      return;
    }

    setSaving(true);
    try {
      await upsertThirdPlaceRuleAction(tournamentId, combinationKey, parsedRules);
      handleCloseDialog();
      loadRules();
    } catch (err: any) {
      setJsonError(err.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
      try {
        await deleteThirdPlaceRuleAction(ruleId);
        loadRules();
      } catch (err: any) {
        setError(err.message || 'Failed to delete rule');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box pt={2}>
      <Card sx={{ maxWidth: '1200px', mr: 'auto', ml: 'auto' }}>
        <CardHeader
          title="Third-Place Assignment Rules"
          subheader="Configure how third-place teams are assigned to playoff bracket positions"
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Rule
            </Button>
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>What are third-place rules?</strong>
            </Typography>
            <Typography variant="body2">
              When multiple groups have third-place teams that qualify for playoffs, this table determines
              which bracket position each team gets based on which groups they came from. For example, if
              groups A, B, C, D, E, F, G, and H all have qualifying third-place teams, the combination key
              would be &ldquo;ABCDEFGH&rdquo; and the rules define which group plays in which playoff position.
            </Typography>
          </Alert>

          {rules.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No rules configured
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add rules to define third-place team assignments for playoff brackets.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Your First Rule
              </Button>
            </Paper>
          ) : (
            <Paper elevation={0} variant="outlined">
              <List>
                {rules.map((rule, index) => (
                  <React.Fragment key={rule.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        py: 2
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                        <Typography variant="h6" component="div">
                          Combination: <strong>{rule.combination_key}</strong>
                        </Typography>
                        <Box>
                          <IconButton onClick={() => handleOpenDialog(rule)} size="small" color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(rule.id)} size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography
                        component="pre"
                        variant="body2"
                        sx={{
                          mt: 1,
                          p: 2,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          fontFamily: 'monospace'
                        }}
                      >
                        {JSON.stringify(rule.rules, null, 2)}
                      </Typography>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentRule ? 'Edit Third-Place Rule' : 'Add Third-Place Rule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Combination Key"
              value={combinationKey}
              onChange={(e) => setCombinationKey(e.target.value.toUpperCase())}
              placeholder="ABCDEFGH"
              helperText="Sorted group letters of qualified third-place teams (e.g., ABCDEFGH for 8 qualifiers from groups A-H)"
              sx={{ mb: 3 }}
              disabled={!!currentRule}
            />

            <TextField
              fullWidth
              multiline
              rows={14}
              label="Rules (JSON)"
              value={rulesJson}
              onChange={(e) => {
                setRulesJson(e.target.value);
                setJsonError(null);
              }}
              error={!!jsonError}
              helperText={jsonError || 'JSON object mapping bracket positions to group letters'}
              sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              slotProps={{
                input: {
                  style: { fontFamily: 'monospace' }
                }
              }}
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Example format for 2026 World Cup (8 third-place qualifiers):</strong>
              </Typography>
              <Typography
                component="pre"
                variant="body2"
                sx={{
                  mt: 1,
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  fontFamily: 'monospace'
                }}
              >
{`{
  "A/B/C/D/F": "A",
  "C/D/F/G/H": "C",
  "C/E/F/H/I": "E",
  "E/H/I/J/K": "H",
  "B/E/F/I/J": "B",
  "A/E/H/I/J": "A",
  ...
}`}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Each key is a bracket position identifier, and each value is the group letter whose
                third-place team plays in that position.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={validateAndSave}
            variant="contained"
            color="primary"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentThirdPlaceRulesTab;

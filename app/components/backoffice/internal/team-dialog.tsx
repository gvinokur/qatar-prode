'use client'

import { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  Typography,
  Alert,
  Box
} from '@mui/material';
import { MuiColorInput } from 'mui-color-input';
import { Team } from '../../../db/tables-definition';
import ImagePicker from '../../friend-groups/image-picker';
import { createTeam, updateTeam } from '../../../actions/team-actions';
import {getThemeLogoUrl} from "../../../utils/theme-utils";

interface TeamDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly tournamentId: string;
  readonly team?: Team | null; // Optional team for edit mode
  readonly onTeamSaved: (_team: Team) => void;
}

export default function TeamDialog({
  open,
  onClose,
  tournamentId,
  team,
  onTeamSaved
}: TeamDialogProps) {
  // Determine if we're in edit mode
  const isEditMode = !!team;

  // State for form fields
  const [name, setName] = useState<string>('');
  const [shortName, setShortName] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#1976d2');
  const [secondaryColor, setSecondaryColor] = useState<string>('#dc004e');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with team data when in edit mode
  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setShortName(team.short_name || '');
      setPrimaryColor(team.theme?.primary_color || '#1976d2');
      setSecondaryColor(team.theme?.secondary_color || '#dc004e');
    } else {
      // Reset form for create mode
      resetForm();
    }
  }, [team, open]);

  // Reset form to default values
  const resetForm = () => {
    setName('');
    setShortName('');
    setPrimaryColor('#1976d2');
    setSecondaryColor('#dc004e');
    setLogoFile(null);
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!name.trim()) {
        throw new Error('Team name is required');
      }

      if (shortName.length !== 3) {
        throw new Error('Short name must be exactly 3 letters');
      }

      // Create form data
      const formData = new FormData();
      formData.append('team', JSON.stringify({
        name: name.trim(),
        short_name: shortName.toUpperCase(),
        theme: {
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo: team?.theme?.logo, // Keep existing logo if in edit mode
          s3_logo_key: team?.theme?.s3_logo_key,// Keep existing logo key if in edit mode
          is_s3_logo: team?.theme?.is_s3_logo // Keep existing logo key if in edit mode
        }
      }));

      // Add logo file if selected
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      let savedTeam;

      if (isEditMode && team) {
        // Update existing team
        savedTeam = await updateTeam(team.id, formData);
      } else {
        // Create new team
        savedTeam = await createTeam(formData, tournamentId);
      }

      // Reset form
      resetForm();

      // Notify parent component
      onTeamSaved(savedTeam);
    } catch {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} team`);
      setError(`Error ${isEditMode ? 'updating' : 'creating'} team`);
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

  // Handle dialog close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? `Edit Team: ${team?.name}` : 'Create New Team'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              label="Team Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              margin="normal"
              helperText="Full team name (e.g. 'Argentina')"
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
              onChange={(e) => setShortName(e.target.value.slice(0, 3))}
              required
              margin="normal"
              helperText="3-letter code (e.g. 'ARG')"
              slotProps={{ htmlInput: { maxLength: 3 } }}
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
              value={primaryColor}
              onChange={(color) => setPrimaryColor(color)}
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
              value={secondaryColor}
              onChange={(color) => setSecondaryColor(color)}
              format="hex"
              fullWidth
            />
          </Grid>

          <Grid size={12}>
            <Typography variant="subtitle2" gutterBottom>
              Team Logo
            </Typography>
            <Box sx={{
              borderRadius: 1,
              p: 1
            }}>
              <ImagePicker
                id="logo"
                name="logo"
                defaultValue={getThemeLogoUrl(team?.theme) || undefined}
                onChange={handleLogoChange}
                onBlur={() => {}}
                aspectRatio={0.6}
                aspectRatioTolerance={1}
                previewWidth={200}
                previewBackgroundColor={primaryColor}
                allowedTypes={['image/jpeg', 'image/png', 'image/svg+xml']}
                imageType="Team Logo"
              />
            </Box>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          loading={loading}
          onClick={handleSubmit}
          variant="contained"
        >
          {isEditMode ? 'Save Changes' : 'Create Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

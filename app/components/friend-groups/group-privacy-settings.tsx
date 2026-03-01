'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Stack
} from '@mui/material';
import {
  Lock as LockIcon,
  Public as PublicIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { Button } from '../mui-wrappers/';
import { useTranslations } from 'next-intl';
import { updateGroupPrivacyAction } from '../../actions/prode-group-actions';
import PublicGroupPreviewDialog from './public-group-preview-dialog';

interface GroupPrivacySettingsProps {
  readonly groupId: string;
  readonly groupName: string;
  readonly initialIsPublic: boolean;
  readonly initialDescription: string | null;
}

export default function GroupPrivacySettings({
  groupId,
  groupName,
  initialIsPublic,
  initialDescription
}: GroupPrivacySettingsProps) {
  const t = useTranslations('groups.privacy');
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const descriptionLength = description.length;
  const isDescriptionValid = !isPublic || description.trim().length > 0;

  const handleVisibilityChange = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue === null) return; // don't allow deselection
    const newIsPublic = newValue === 'public';

    if (!newIsPublic && isPublic) {
      // Switching from public to private — show confirmation
      setConfirmDialogOpen(true);
    } else {
      setIsPublic(newIsPublic);
    }
  };

  const handleConfirmMakePrivate = () => {
    setIsPublic(false);
    setConfirmDialogOpen(false);
  };

  const handleSave = async () => {
    if (!isDescriptionValid) return;

    setSaving(true);
    try {
      const result = await updateGroupPrivacyAction(groupId, isPublic, description.trim() || undefined);
      if ('error' in result) {
        setSnackbar({ open: true, message: result.error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: t('saved'), severity: 'success' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        🔒 {t('settingsTitle')}
      </Typography>

      {/* Public/Private Toggle */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Group Visibility
        </Typography>
        <ToggleButtonGroup
          value={isPublic ? 'public' : 'private'}
          exclusive
          onChange={handleVisibilityChange}
          size="small"
        >
          <ToggleButton value="private" aria-label={t('private')}>
            <LockIcon fontSize="small" sx={{ mr: 0.5 }} />
            {t('private')}
          </ToggleButton>
          <ToggleButton value="public" aria-label={t('public')}>
            <PublicIcon fontSize="small" sx={{ mr: 0.5 }} />
            {t('public')}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Description field (only shown when public) */}
      {isPublic && (
        <Box sx={{ mb: 2 }}>
          <TextField
            label={t('description')}
            placeholder={t('descriptionPlaceholder')}
            multiline
            rows={3}
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${descriptionLength} / 500 — ${t('descriptionHelper')}`}
            error={isPublic && description.trim().length === 0 && descriptionLength > 0}
          />
          {isPublic && description.trim().length === 0 && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {t('descriptionRequired')}
            </Typography>
          )}
        </Box>
      )}

      {/* Public tip */}
      {isPublic && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('makePublicTip')}
        </Alert>
      )}

      {/* Actions */}
      <Stack direction="row" spacing={2}>
        {isPublic && (
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => setPreviewOpen(true)}
            disabled={!description.trim()}
          >
            {t('previewInDiscovery')}
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={!isDescriptionValid}
        >
          {t('saveSettings')}
        </Button>
      </Stack>

      {/* Confirmation dialog for making private */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>{t('private')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('makePrivateConfirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmMakePrivate} color="warning" variant="contained">
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <PublicGroupPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        groupName={groupName}
        description={description}
      />

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

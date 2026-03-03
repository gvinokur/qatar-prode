'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Stack
} from '@mui/material';
import { Button } from '../mui-wrappers/';
import { useTranslations } from 'next-intl';
import PrivacyIndicatorIcon from './privacy-indicator-icon';

interface PublicGroupPreviewDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly groupName: string;
  readonly description: string;
}

export default function PublicGroupPreviewDialog({
  open,
  onClose,
  groupName,
  description
}: PublicGroupPreviewDialogProps) {
  const tDiscovery = useTranslations('groups.discovery');
  const tPrivacy = useTranslations('groups.privacy');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{tPrivacy('previewInDiscovery')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {tDiscovery('subtitle')}
        </Typography>
        {/* Preview card */}
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <PrivacyIndicatorIcon isPublic={true} size="small" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {groupName}
            </Typography>
          </Box>
          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {description}
            </Typography>
          )}
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              👥 {tDiscovery('memberCount', { count: 1 })}
            </Typography>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">{tPrivacy('saveSettings')}</Button>
      </DialogActions>
    </Dialog>
  );
}

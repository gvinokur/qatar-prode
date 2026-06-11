'use client';

import React, { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { removeGroupMembersAction } from '@/app/actions/prode-group-actions';

interface Member {
  id: string;
  nombre: string;
  is_admin: boolean;
}

interface RemoveMembersDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (ids: string[]) => void;
  groupId: string;
  members: Member[];
  ownerId: string;
  isOwner: boolean;
}

export default function RemoveMembersDialog({
  open,
  onClose,
  onSuccess,
  groupId,
  members,
  ownerId,
  isOwner,
}: Readonly<RemoveMembersDialogProps>) {
  const t = useTranslations('groups.joinRequests.removeMembersDialog');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removableMembers = members.filter(m => {
    if (m.id === ownerId) return false;
    if (m.is_admin && !isOwner) return false;
    return true;
  });

  const handleToggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    const ids = Array.from(selected);
    setLoading(true);
    setError(null);
    try {
      await removeGroupMembersAction(groupId, ids);
      setSelected(new Set());
      onSuccess(ids);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelected(new Set());
    setError(null);
    onClose();
  };

  const selectedCount = selected.size;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent sx={{ px: 0, pb: 0 }}>
        {error && (
          <Box px={3} pb={1}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}
        {removableMembers.length === 0 ? (
          <Box px={3} pb={2}>
            <Typography variant="body2" color="text.secondary">
              No members available to remove.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {removableMembers.map((member, index) => (
              <React.Fragment key={member.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  dense
                  onClick={() => handleToggle(member.id)}
                  sx={{ cursor: 'pointer', px: 3 }}
                >
                  <Checkbox
                    edge="start"
                    checked={selected.has(member.id)}
                    tabIndex={-1}
                    disableRipple
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <ListItemAvatar sx={{ minWidth: 36 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                      {member.nombre[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.nombre}
                    secondary={member.is_admin ? t('roles.admin') : t('roles.member')}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
        {selectedCount > 0 && (
          <Box px={3} py={1} sx={{ borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              {t('selectionCount', { count: selectedCount })}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('cancelButton')}
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={selectedCount === 0 || loading}
          onClick={handleConfirm}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {t('confirmButton', { count: selectedCount })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

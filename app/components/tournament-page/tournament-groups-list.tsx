'use client'

import { useState } from 'react';
import { Box, Typography, Button, Grid } from "../mui-wrappers/";
import {
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import type { TournamentGroupStats } from "../../definitions";
import TournamentGroupCard from "./tournament-group-card";
import FriendGroupsLandingEmptyState from "../friend-groups/FriendGroupsLandingEmptyState";
import { createDbGroup } from "../../actions/prode-group-actions";
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

interface UserJoinRequest {
  id: string;
  group_id: string;
  group_name?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: Date;
  resolved_at?: Date | null;
}

interface TournamentGroupsListProps {
  readonly groups: TournamentGroupStats[];
  readonly tournamentId: string;
  readonly pendingRequests?: UserJoinRequest[];
}

type GroupForm = {
  name: string;
}

export default function TournamentGroupsList({ groups, tournamentId, pendingRequests = [] }: TournamentGroupsListProps) {
  const tCreate = useTranslations('groups.create');
  const tList = useTranslations('groups.list');
  const tActions = useTranslations('groups.actions');
  const tDiscovery = useTranslations('groups.discovery');
  const locale = useLocale();
  const router = useRouter();

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, reset } = useForm<GroupForm>();

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    reset();
  };

  const createGroup = async (group: GroupForm) => {
    setLoading(true);
    try {
      await createDbGroup(group.name);
      // Refresh the page to show the new group
      globalThis.location.reload();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
      setOpenCreateDialog(false);
    }
  };

  const handleDiscoverGroups = () => {
    router.push(`/${locale}/tournaments/${tournamentId}/friend-groups/discover`);
  };

  // Show empty state if no groups and no actively pending requests
  const activePendingRequests = pendingRequests.filter(req => req.status === 'pending');
  if (groups.length === 0 && activePendingRequests.length === 0) {
    return (
      <>
        <Grid container maxWidth={'868px'} mx={{ md: 'auto' }} sx={{ height: '100%' }}>
          <Grid size={12} sx={{ height: '100%' }}>
            <FriendGroupsLandingEmptyState
              onCreateGroup={() => setOpenCreateDialog(true)}
              onDiscoverGroups={handleDiscoverGroups}
            />
          </Grid>
        </Grid>
        {/* Create Dialog */}
        <Dialog
          open={openCreateDialog}
          onClose={handleCloseCreateDialog}
          slotProps={{
            paper: {
              // @ts-ignore
              component: 'form',
              onSubmit: (e: React.FormEvent) => {
                e.preventDefault();
                handleSubmit(createGroup)();
              }
            }
          }}
        >
          <DialogTitle>{tCreate('title')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {tCreate('description')}
            </DialogContentText>
            <Controller
              control={control}
              name="name"
              rules={{
                required: tCreate('nameField.required')
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  autoFocus
                  margin="dense"
                  label={tCreate('nameField.label')}
                  type="text"
                  fullWidth
                  variant="standard"
                  error={fieldState.error !== undefined}
                  helperText={fieldState.error?.message || ''}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button disabled={loading} color="secondary" onClick={handleCloseCreateDialog}>
              {tCreate('buttons.cancel')}
            </Button>
            <Button loading={loading} color="primary" type="submit">
              {tCreate('buttons.create')}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Grid container maxWidth={'868px'} mt={1} mx={{ md: 'auto' }} spacing={2}>
        <Grid size={12}>
          <Box sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
            {/* Header with Actions */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                {tList('title')}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => setOpenCreateDialog(true)}
                >
                  {tActions('create')}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={handleDiscoverGroups}
                >
                  {tDiscovery('discoverGroups')}
                </Button>
              </Stack>
            </Stack>

            {/* Groups Grid */}
            <Grid container spacing={3}>
              {/* Approved Groups */}
              {groups.map((group) => (
                <Grid size={{ xs: 12, sm: 12, md: 6 }} key={group.groupId}>
                  <TournamentGroupCard group={group} tournamentId={tournamentId} />
                </Grid>
              ))}

              {/* Pending Requests as Blurred Cards */}
              {pendingRequests.filter(req => req.status === 'pending').map((request) => {
                // Create a mock TournamentGroupStats for pending requests
                const pendingGroup: TournamentGroupStats = {
                  groupId: request.group_id,
                  groupName: request.group_name || 'Unknown Group',
                  userPosition: 0,
                  totalParticipants: 0,
                  userPoints: 0,
                  leaderName: '---',
                  leaderPoints: 0,
                  isOwner: false
                };

                return (
                  <Grid size={{ xs: 12, sm: 12, md: 6 }} key={request.id}>
                    <TournamentGroupCard
                      group={pendingGroup}
                      tournamentId={tournamentId}
                      isPending={true}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Grid>
      </Grid>

      {/* Create Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={handleCloseCreateDialog}
        slotProps={{
          paper: {
            // @ts-ignore
            component: 'form',
            onSubmit: (e: React.FormEvent) => {
              e.preventDefault();
              handleSubmit(createGroup)();
            }
          }
        }}
      >
        <DialogTitle>{tCreate('title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {tCreate('description')}
          </DialogContentText>
          <Controller
            control={control}
            name="name"
            rules={{
              required: tCreate('nameField.required')
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                autoFocus
                margin="dense"
                label={tCreate('nameField.label')}
                type="text"
                fullWidth
                variant="standard"
                error={fieldState.error !== undefined}
                helperText={fieldState.error?.message || ''}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} color="secondary" onClick={handleCloseCreateDialog}>
            {tCreate('buttons.cancel')}
          </Button>
          <Button loading={loading} color="primary" type="submit">
            {tCreate('buttons.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

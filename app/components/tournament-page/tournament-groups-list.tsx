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
import EmptyGroupsState from "./empty-groups-state";
import JoinGroupDialog from "./join-group-dialog";
import { createDbGroup } from "../../actions/prode-group-actions";
import { useTranslations } from 'next-intl';

interface TournamentGroupsListProps {
  readonly groups: TournamentGroupStats[];
  readonly tournamentId: string;
}

type GroupForm = {
  name: string;
}

export default function TournamentGroupsList({ groups, tournamentId }: TournamentGroupsListProps) {
  const tCreate = useTranslations('groups.create');
  const tList = useTranslations('groups.list');
  const tActions = useTranslations('groups.actions');

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
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

  // Show empty state if no groups
  if (groups.length === 0) {
    return (
      <>
        <Grid container maxWidth={'868px'} mt={1} mx={{ md: 'auto' }}>
          <Grid size={12}>
            <EmptyGroupsState
              onCreateGroup={() => setOpenCreateDialog(true)}
              onJoinGroup={() => setOpenJoinDialog(true)}
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
            <Button disabled={loading} onClick={handleCloseCreateDialog}>
              {tCreate('buttons.cancel')}
            </Button>
            <Button loading={loading} type="submit">
              {tCreate('buttons.create')}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Join Dialog */}
        <JoinGroupDialog open={openJoinDialog} onClose={() => setOpenJoinDialog(false)} />
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
                  color="primary"
                  size="small"
                  onClick={() => setOpenJoinDialog(true)}
                >
                  {tActions('join')}
                </Button>
              </Stack>
            </Stack>

            {/* Groups Grid */}
            <Grid container spacing={3}>
              {groups.map((group) => (
                <Grid size={{ xs: 12, sm: 12, md: 6 }} key={group.groupId}>
                  <TournamentGroupCard group={group} tournamentId={tournamentId} />
                </Grid>
              ))}
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
          <Button disabled={loading} onClick={handleCloseCreateDialog}>
            {tCreate('buttons.cancel')}
          </Button>
          <Button loading={loading} type="submit">
            {tCreate('buttons.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Dialog */}
      <JoinGroupDialog open={openJoinDialog} onClose={() => setOpenJoinDialog(false)} />
    </>
  );
}

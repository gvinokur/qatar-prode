'use client'

import {
  Box, Button, Card,
  CardActions,
  CardContent,
  CardHeader, Chip, Collapse, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText, TextField, useTheme
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  Groups as GroupsIcon,
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  WorkspacePremium as WorkspacePremiumIcon,
} from "@mui/icons-material";
import { useState, useTransition } from "react";
import {ExpandMore} from './expand-more';
import {Controller, useForm} from "react-hook-form";
import * as React from "react";
import {createDbGroup, deleteGroup} from "../../actions/prode-group-actions";
import { toggleFavoriteGroupAction, setMainGroupAction } from "../../actions/favorite-group-actions";
import InviteFriendsDialog from "../invite-friends-dialog";
import Link from "next/link";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import FriendGroupsSidebarEmptyState from "../friend-groups/FriendGroupsSidebarEmptyState";

type GroupItem = { id: string; name: string; isOwner: boolean }

type Props = {
  userGroups: { id: string, name: string}[]
  participantGroups: {id: string, name: string}[]
  tournamentId?: string
  isActive?: boolean
  pendingRequests?: { id: string; group_id: string; group_name?: string | null }[]
  groupRanks?: Record<string, number>
  favoriteGroupIds?: string[]
  mainGroupId?: string | null
}

type GroupForm = {
  name: string
}

function sortGroups(groups: GroupItem[], favoriteIds: string[], mainGroupId: string | null): GroupItem[] {
  return [...groups].sort((a, b) => {
    const aIsMain = a.id === mainGroupId
    const bIsMain = b.id === mainGroupId
    if (aIsMain !== bIsMain) return aIsMain ? -1 : 1

    const aIsFav = favoriteIds.includes(a.id)
    const bIsFav = favoriteIds.includes(b.id)
    if (aIsFav !== bIsFav) return aIsFav ? -1 : 1

    if (aIsFav && bIsFav) return a.name.localeCompare(b.name)
    return 0
  })
}

export default function FriendGroupsList({
  userGroups: initialUserGroups,
  participantGroups,
  tournamentId,
  isActive = false,
  pendingRequests = [],
  groupRanks,
  favoriteGroupIds: initialFavoriteGroupIds = [],
  mainGroupId: initialMainGroupId = null,
} : Props) {
  const t = useTranslations('groups');
  const tFavorites = useTranslations('groups.favorites');
  const theme = useTheme();
  const locale = useLocale();
  const router = useRouter();

  const [ownedGroups, setOwnedGroups] = useState(initialUserGroups);
  const [localFavoriteIds, setLocalFavoriteIds] = useState<string[]>(initialFavoriteGroupIds)
  const [localMainGroupId, setLocalMainGroupId] = useState<string | null>(initialMainGroupId)
  const [, startTransition] = useTransition()

  // Combine all groups for unified sorting
  const allGroups: GroupItem[] = [
    ...ownedGroups.map(g => ({ ...g, isOwner: true })),
    ...participantGroups.map(g => ({ ...g, isOwner: false })),
  ]
  const sortedGroups = sortGroups(allGroups, localFavoriteIds, localMainGroupId)

  const isEmpty = Boolean(tournamentId && allGroups.length === 0 && pendingRequests.length === 0);

  // Primary group for subheader: main group if set, otherwise first in sorted list
  const primaryGroup = localMainGroupId
    ? sortedGroups.find(g => g.id === localMainGroupId) ?? sortedGroups[0]
    : sortedGroups[0]
  const primaryGroupRank = primaryGroup ? (groupRanks?.[primaryGroup.id] ?? null) : null;
  const groupCount = allGroups.length
  const groupCountWithOptionalRank = primaryGroupRank !== null && primaryGroup
    ? t('header.groupCountWithRank', { count: groupCount, rank: primaryGroupRank, groupName: primaryGroup.name })
    : t('header.groupCount', { count: groupCount });
  const groupCountText = groupCount > 0 ? groupCountWithOptionalRank : t('header.noGroups');

  const [expanded, setExpanded] = useState(isEmpty);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openConfirmDeleteGroup, setOpenConfirmDeleteGroup] = useState<string | false>(false)
  const [loading, setLoading] = useState(false)
  const { control, handleSubmit } = useForm<GroupForm>()

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false)
  }

  const handleGroupDelete = async () => {
    setLoading(true)
    if(openConfirmDeleteGroup) {
      deleteGroup(openConfirmDeleteGroup)
      setOwnedGroups(ownedGroups.filter(group => group.id !== openConfirmDeleteGroup))
    }
    setLoading(false)
    setOpenConfirmDeleteGroup(false)
  }

  const createGroup = async (group: GroupForm) => {
    setLoading(true)
    const newGroup = await createDbGroup(group.name)
    setOwnedGroups([...ownedGroups, newGroup])
    setLoading(false)
    setOpenCreateDialog(false)
  }

  const handleToggleFavorite = (groupId: string) => {
    const isFav = localFavoriteIds.includes(groupId)
    if (isFav) {
      setLocalFavoriteIds(localFavoriteIds.filter(id => id !== groupId))
      if (localMainGroupId === groupId) setLocalMainGroupId(null)
    } else {
      setLocalFavoriteIds([...localFavoriteIds, groupId])
    }
    startTransition(async () => {
      await toggleFavoriteGroupAction(groupId)
    })
  }

  const handleSetMain = (groupId: string) => {
    if (localMainGroupId === groupId) {
      // Already main — no-op (crown click on the main just stays)
      return
    }
    setLocalMainGroupId(groupId)
    // Ensure it's also a favorite
    if (!localFavoriteIds.includes(groupId)) {
      setLocalFavoriteIds([...localFavoriteIds, groupId])
    }
    startTransition(async () => {
      await setMainGroupAction(groupId)
    })
  }

  return (
    <>
      <Card sx={{
        ...(isActive && {
          borderLeft: 3,
          borderColor: 'primary.main',
          backgroundColor: 'action.selected',
        })
      }}>
        <CardHeader
          title={t('title')}
          slotProps={{ title: { variant: 'h6' } }}
          subheader={[
            isActive ? t('status.youAreHere') : null,
            groupCountText,
          ].filter(Boolean).join(' · ')}
          sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
          action={
            <ExpandMore
              expand={expanded}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label={t('actions.expandMore')}
            >
              <ExpandMoreIcon />
            </ExpandMore>
          }
        />
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ borderBottom: `${theme.palette.primary.contrastText} 1px solid`, borderTop: `${theme.palette.primary.contrastText} 1px solid` }}>
          {isEmpty ? (
            <>
              <FriendGroupsSidebarEmptyState
                onLearnMore={() => router.push(`/${locale}/tournaments/${tournamentId}/friend-groups`)}
              />
              <Box sx={{ mt: 1 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateDialog(true)}
                >
                  {t('actions.create')}
                </Button>
              </Box>
            </>
          ) : (
            <List sx={{ width: '100%'}} disablePadding>
            {sortedGroups.map(group => {
              const rank = groupRanks?.[group.id];
              const isFav = localFavoriteIds.includes(group.id)
              const isMain = localMainGroupId === group.id
              return (
                <ListItem
                  key={group.id}
                  alignItems='flex-start'
                  disableGutters
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleFavorite(group.id)}
                        aria-label={isFav ? tFavorites('removeFavorite') : tFavorites('addFavorite')}
                        sx={{ color: isFav ? 'warning.main' : 'action.disabled', p: 0.5 }}
                      >
                        {isFav ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                      </IconButton>
                      {group.isOwner && (
                        <>
                          <IconButton title={t('actions.delete')} color="secondary" onClick={() => setOpenConfirmDeleteGroup(group.id)}>
                            <DeleteIcon/>
                          </IconButton>
                          <InviteFriendsDialog
                            trigger={
                              <IconButton title={t('actions.invite')} color="primary">
                                <ShareIcon/>
                              </IconButton>}
                            groupId={group.id}
                            groupName={group.name}
                            tournamentId={tournamentId} />
                        </>
                      )}
                    </Box>
                  }
                >
                  <ListItemText>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {isMain && (
                        <IconButton
                          size="small"
                          onClick={() => handleSetMain(group.id)}
                          aria-label={tFavorites('mainGroupLabel')}
                          sx={{ color: 'warning.main', p: 0.25 }}
                        >
                          <WorkspacePremiumIcon fontSize="small" />
                        </IconButton>
                      )}
                      {rank !== undefined && (
                        <Chip label={`#${rank}`} size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                      )}
                      <Link href={tournamentId ? `/${locale}/tournaments/${tournamentId}/friend-groups/${group.id}` : `/${locale}/friend-groups/${group.id}`}>
                        {group.name}
                      </Link>
                    </Box>
                  </ListItemText>
                </ListItem>
              );
            })}
            {pendingRequests.length > 0 && allGroups.length > 0 && <ListItem divider/>}
            {pendingRequests.map(request => (
              <ListItem key={request.id} disableGutters sx={{ gap: 1 }}>
                <ListItemText
                  primary={
                    tournamentId ? (
                      <Link href={`/${locale}/tournaments/${tournamentId}/friend-groups/join/${request.group_id}`}>
                        {request.group_name || t('pendingRequests.unknownGroup')}
                      </Link>
                    ) : (
                      request.group_name || t('pendingRequests.unknownGroup')
                    )
                  }
                  slotProps={{ primary: { color: 'text.secondary', noWrap: true } }}
                />
                <Chip
                  label={t('pendingRequests.status.pending')}
                  color="warning"
                  size="small"
                  sx={{ flexShrink: 0 }}
                />
              </ListItem>
            ))}
            <ListItem disableGutters sx={{ justifyContent: 'center', pt: 1 }}>
              <Button
                size="small"
                variant="text"
                color="secondary"
                onClick={() => setOpenCreateDialog(true)}
                startIcon={<AddIcon />}
              >
                {t('actions.create')}
              </Button>
            </ListItem>
            </List>
          )}
          </CardContent>
        </Collapse>
        <CardActions sx={{ justifyContent: 'center', px: 2, py: 1.5 }}>
            {tournamentId && (groupCount >= 1 || pendingRequests.length > 0) && (
              <Button
                component={Link}
                href={`/${locale}/tournaments/${tournamentId}/friend-groups`}
                variant="outlined"
                color="secondary"
                startIcon={<GroupsIcon />}
                size="small"
                fullWidth
              >
                {t('actions.view')}
              </Button>
            )}
            {tournamentId && groupCount === 0 && pendingRequests.length === 0 && (
              <Button
                component={Link}
                href={`/${locale}/tournaments/${tournamentId}/friend-groups/discover`}
                variant="outlined"
                color="secondary"
                startIcon={<SearchIcon />}
                size="small"
                fullWidth
              >
                {t('discovery.discoverGroups')}
              </Button>
            )}
          </CardActions>
      </Card>
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog}
              slotProps={{
                paper: {
                  //@ts-ignore
                  component: 'form',
                  onSubmit: (e: React.FormEvent) => {
                    e.preventDefault();
                    handleSubmit(createGroup)();
                  }
                }
              }}>
        <DialogTitle>{t('create.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('create.description')}
          </DialogContentText>
          <Controller
            control={control}
            name={'name'}
            rules={{
              required: t('create.nameField.required'),
            }}
            render={({field, fieldState}) => (
              <TextField
                {...field}
                autoFocus
                margin="dense"
                label={t('create.nameField.label')}
                type="text"
                fullWidth
                variant="standard"
                error={fieldState.error!== undefined}
                helperText={fieldState.error?.message || ''}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} color="secondary" onClick={handleCloseCreateDialog}>{t('create.buttons.cancel')}</Button>
          <Button loading={loading} color="primary" type='submit'>{t('create.buttons.create')}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!openConfirmDeleteGroup} onClose={() => setOpenConfirmDeleteGroup(false)}>
        <DialogTitle>{t('delete.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('delete.confirmation')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} color="secondary" onClick={() => setOpenConfirmDeleteGroup(false)}>{t('create.buttons.cancel')}</Button>
          <Button loading={loading} color="secondary" onClick={handleGroupDelete}>{t('actions.delete')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

'use client'

import {
  Button, Card,
  CardActions,
  CardContent,
  CardHeader, Collapse, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText, TextField, useTheme
} from "@mui/material";
import {Delete as DeleteIcon, Share as ShareIcon, ExpandMore as ExpandMoreIcon, Groups as GroupsIcon} from "@mui/icons-material";
import {useState} from "react";
import {ExpandMore} from './expand-more';
import {Controller, useForm} from "react-hook-form";
import * as React from "react";
import {createDbGroup, deleteGroup} from "../../actions/prode-group-actions";
import InviteFriendsDialog from "../invite-friends-dialog";
import Link from "next/link";
import { useLocale, useTranslations } from 'next-intl';

type Props = {
  userGroups: { id: string, name: string}[]
  participantGroups: {id: string, name: string}[]
  tournamentId?: string
  isActive?: boolean
}

type GroupForm = {
  name: string
}

export default function FriendGroupsList({
  userGroups:initialUserGroups,
  participantGroups,
  tournamentId,
  isActive = false,
} : Props) {
  const t = useTranslations('groups');
  const theme = useTheme();
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openConfirmDeleteGroup, setOpenConfirmDeleteGroup] = useState<string | false>(false)
  const [loading, setLoading] = useState(false)
  const { control, handleSubmit } =useForm<GroupForm>()
  const [userGroups, setUserGroups] = useState(initialUserGroups);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false)
  }

  const handleGroupDelete = async () => {
    setLoading(true)
    if(openConfirmDeleteGroup) {
      // Delete the group on the backend
      deleteGroup(openConfirmDeleteGroup)
      setUserGroups(userGroups.filter(group => group.id !== openConfirmDeleteGroup))
    }
    setLoading(false)
    setOpenConfirmDeleteGroup(false)
  }

  const createGroup = async (group: GroupForm) => {
    setLoading(true)
    const newGroup = await createDbGroup(group.name)
    setUserGroups([
      ...userGroups,
      newGroup
    ])
    setLoading(false)
    setOpenCreateDialog(false)
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
          subheader={isActive ? t('status.youAreHere') : undefined}
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
          <List sx={{ width: '100%'}} disablePadding >
            {userGroups.map(userGroup => (
              <ListItem key={userGroup.id}
                        alignItems='flex-start'
                        disableGutters
                        secondaryAction={
                          <>
                            <IconButton title={t('actions.delete')} onClick={() => setOpenConfirmDeleteGroup(userGroup.id)}>
                              <DeleteIcon/>
                            </IconButton>
                            <InviteFriendsDialog
                              trigger={
                                <IconButton title={t('actions.invite')}>
                                  <ShareIcon/>
                                </IconButton>}
                              groupId={userGroup.id}
                              groupName={userGroup.name} />
                          </>
                        }>
                <ListItemText>
                  <Link href={tournamentId ? `/${locale}/tournaments/${tournamentId}/friend-groups/${userGroup.id}` : `/${locale}/friend-groups/${userGroup.id}`}>
                    {userGroup.name}
                  </Link>
                </ListItemText>
              </ListItem>
            ))}
            {(userGroups.length > 0 && participantGroups.length > 0) &&  <ListItem divider/>}
            {participantGroups.map(participantGroup => (
              <ListItem key={participantGroup.id} disableGutters>
                <ListItemText>
                  <Link href={tournamentId ? `/${locale}/tournaments/${tournamentId}/friend-groups/${participantGroup.id}` : `/${locale}/friend-groups/${participantGroup.id}`}>
                    {participantGroup.name}
                  </Link>
                </ListItemText>
              </ListItem>
            ))}
          </List>
        </CardContent>
        </Collapse>
        <CardActions sx={{ justifyContent: 'space-around', px: 2, py: 1.5 }}>
          <Button onClick={() => setOpenCreateDialog(true)}>{t('actions.create')}</Button>
          {tournamentId && (userGroups.length + participantGroups.length) > 1 && (
            <Button component={Link} href={`/${locale}/tournaments/${tournamentId}/friend-groups`} startIcon={<GroupsIcon />}>
              {t('actions.view')}
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
          <Button disabled={loading} onClick={handleCloseCreateDialog}>{t('create.buttons.cancel')}</Button>
          <Button loading={loading} type='submit'>{t('create.buttons.create')}</Button>
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
          <Button disabled={loading} onClick={() => setOpenConfirmDeleteGroup(false)}>{t('create.buttons.cancel')}</Button>
          <Button loading={loading} onClick={handleGroupDelete}>{t('actions.delete')}</Button>
        </DialogActions>
      </Dialog>
    </>

  )
}

'use client'

import {
  Button, Card,
  CardActions,
  CardContent,
  CardHeader, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText, TextField, useTheme
} from "@mui/material";
import {Delete as DeleteIcon, Share as ShareIcon} from "@mui/icons-material";
import {LoadingButton} from "@mui/lab";
import {useState} from "react";
import {Controller, useForm} from "react-hook-form";
import * as React from "react";
import {createDbGroup, deleteGroup} from "../../actions/prode-group-actions";
import InviteFriendsDialog from "../invite-friends-dialog";


type Props = {
  userGroups: { id: string, name: string}[]
  participantGroups: {id: string, name: string}[]
}

type GroupForm = {
  name: string
}

export default function FriendGroupsList({
  userGroups:initialUserGroups,
  participantGroups: initialParticipantGroups,
} : Props) {
  const theme = useTheme();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openConfirmDeleteGroup, setOpenConfirmDeleteGroup] = useState<string | false>(false)
  const [loading, setLoading] = useState(false)
  const { control, handleSubmit } =useForm<GroupForm>()
  const [userGroups, setUserGroups] = useState(initialUserGroups);
  const [participantGroups, setParticipantGroups] = useState(initialParticipantGroups)

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
      <Card>
        <CardHeader title='Grupos de Amigos' sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}/>
        <CardContent sx={{ borderBottom: `${theme.palette.primary.contrastText} 1px solid`, borderTop: `${theme.palette.primary.contrastText} 1px solid` }}>
          <List sx={{ width: '100%'}} disablePadding >
            {userGroups.map(userGroup => (
              <ListItem key={userGroup.id}
                        alignItems='flex-start'
                        disableGutters
                        secondaryAction={
                          <>
                            <IconButton title='Borrar Grupo' onClick={() => setOpenConfirmDeleteGroup(userGroup.id)}>
                              <DeleteIcon/>
                            </IconButton>
                            <InviteFriendsDialog
                              trigger={
                                <IconButton title='Invitar Amigos'>
                                  <ShareIcon/>
                                </IconButton>}
                              groupId={userGroup.id}
                              groupName={userGroup.name} />
                          </>
                        }>
                <ListItemText><Link href={`/friend-groups/${userGroup.id}`}>{userGroup.name}</Link></ListItemText>
              </ListItem>
            ))}
            {(userGroups.length > 0 && participantGroups.length > 0) &&  <ListItem divider/>}
            {participantGroups.map(participantGroup => (
              <ListItem key={participantGroup.id} disableGutters>
                <ListItemText>
                  <Link href={`/friend-groups/${participantGroup.id}`}>{participantGroup.name}</Link>
                </ListItemText>
              </ListItem>
            ))}
          </List>
        </CardContent>
        <CardActions>
          <Button onClick={() => setOpenCreateDialog(true)}>Crear Nuevo Grupo</Button>
        </CardActions>
      </Card>
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog}
              PaperProps={{
                //@ts-ignore
                component: 'form',
                onSubmit: handleSubmit(createGroup)
              }}>
        <DialogTitle>Crear Grupo de Amigos</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Un grupo de amigos te permite tener un ranking privado de aciertos.
            Crea tantos grupos de amigos como quieras, tu mismo pronostico va a ser usado para calcular tu posicion en todos.
          </DialogContentText>
          <Controller
            control={control}
            name={'name'}
            rules={{
              required: 'El nombre del grupo es obligatorio',
            }}
            render={({field, fieldState}) => (
              <TextField
                {...field}
                autoFocus
                margin="dense"
                label="Nombre"
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
          <Button disabled={loading} onClick={handleCloseCreateDialog}>Cancelar</Button>
          <LoadingButton loading={loading} type='submit'>Crear</LoadingButton>
        </DialogActions>
      </Dialog>
      <Dialog open={!!openConfirmDeleteGroup} onClose={() => setOpenConfirmDeleteGroup(false)}>
        <DialogTitle>Borrar Grupo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Estas seguro que queres borrar este grupo?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={() => setOpenConfirmDeleteGroup(false)}>Cancelar</Button>
          <LoadingButton loading={loading} onClick={handleGroupDelete}>Borrar</LoadingButton>
        </DialogActions>
      </Dialog>
    </>

  )
}

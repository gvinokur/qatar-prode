import type { NextPage } from 'next'
import {
  query,
  initThinBackend,
  createRecord,
  getCurrentUserId,
  ProdeGroup
} from 'thin-backend';
import {ChangeEvent, useEffect, useState} from 'react';
import {
  Button,
  Card,
  CardActions, CardContent,
  CardHeader,
  Dialog, DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid, IconButton, List, ListItem, ListItemText, TextField, Link
} from "@mui/material";
import {LoadingButton} from "@mui/lab";
import { Share as ShareIcon } from "@mui/icons-material";


initThinBackend({ host: process.env.NEXT_PUBLIC_BACKEND_URL });

const Home: NextPage = () => {
  const [open, setOpen] = useState(false);
  const [openSharingDialog, setOpenSharingDialog] = useState<string | false>(false);
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const [userGroups, setUserGroups] = useState<ProdeGroup[]>([])
  const [participantGroups, setParticipantGroups] = useState<ProdeGroup[]>([])

  useEffect(() => {
    const getData = async () => {
      const userGroups = await query('prode_groups').where('ownerUserId', getCurrentUserId()).fetch();
      const groupParticipantIn = await query('prode_group_participants').where('userId', getCurrentUserId()).fetch();
      const participantGroups = await query('prode_groups').whereIn('id', groupParticipantIn.map(groupParticipant => groupParticipant.prodeGroupId)).fetch();
      setUserGroups(userGroups);
      setParticipantGroups(participantGroups);
    }

    getData()
  }, [getCurrentUserId()])

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleGroupNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value)
  }
  const handleGroupCreate = async () => {
    setLoading(true)
    await createRecord('prode_groups', { ownerUserId: getCurrentUserId(), name: groupName });
    setLoading(false)
    handleClose()
  }

  return (
    <>
      <Grid container>
        <Grid item>
          <Card>
            <CardHeader title='Principal'/>
            <CardActions>
              <Button href='/predictions/groups/group-a'>Completar Pronostico</Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item>
          <Card>
            <CardHeader title='Grupos de Amigos'/>
            <CardContent>
              <List>
                {userGroups.map(userGroup => (
                  <ListItem key={userGroup.id}
                    secondaryAction={
                      <IconButton title='Invitar Amigos' onClick={() => setOpenSharingDialog(userGroup.id)}>
                        <ShareIcon/>
                      </IconButton>
                    }>
                    <ListItemText><Link href={`/friend-groups/${userGroup.id}`}>{userGroup.name}</Link></ListItemText>
                  </ListItem>
                ))}
                <ListItem divider/>
                {participantGroups.map(participantGroup => (
                  <ListItem key={participantGroup.id}>
                    <ListItemText>
                      <Link href={`/friend-groups/${participantGroup.id}`}>{participantGroup.name}</Link>
                    </ListItemText>
                  </ListItem>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button onClick={handleClickOpen}>Crear Nuevo Grupo</Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Crear Grupo de Amigos</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Un grupo de amigos te permite tener un ranking privado de aciertos.
            Crea tantos grupos de amigos como quieras, tu mismo pronostico va a ser usado para calcular tu posicion en todos.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Nombre"
            type="text"
            fullWidth
            variant="standard"
            onChange={handleGroupNameChange}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={handleClose}>Cancelar</Button>
          <LoadingButton loading={loading} onClick={handleGroupCreate}>Crear</LoadingButton>
        </DialogActions>
      </Dialog>
      <Dialog open={!!openSharingDialog} onClose={() => setOpenSharingDialog(false)}>
        <DialogTitle>Compartir Link</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Copia el siguiente link y compartilo con tus amigos para que se unan a tu grupo
            &nbsp;<Link onClick={() => navigator.clipboard.writeText(`${window.location.origin}/friend-groups/join/${openSharingDialog}`)}>{`${window.location.origin}/friend-groups/join/${openSharingDialog}`}</Link>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={() => setOpenSharingDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Home

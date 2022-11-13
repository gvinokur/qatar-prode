import type { NextPage } from 'next'
import {
  query,
  initThinBackend,
  createRecord,
  getCurrentUserId,
  ProdeGroup, updateRecord, deleteRecord
} from 'thin-backend';
import {ChangeEvent, useEffect, useState} from 'react';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Link,
  useTheme,
  Collapse,
  styled,
  IconButtonProps,
  Typography
} from "@mui/material";
import {LoadingButton} from "@mui/lab";
import {ExpandMore as ExpandMoreIcon, Share as ShareIcon, Delete as DeleteIcon} from "@mui/icons-material";
import {useCurrentUser} from "thin-backend-react";

const rules = [
  '1 Punto por Ganador/Empate acertado - 1 punto extra por resultado exacto',
  'Partido de playoffs solo cuenta si los equipos tambien son correctos',
  'Se permite cambiar los pronosticos entre la finalizacion de la primera ronda y el comienzo de cada partido de octavos.',
  '1 Punto por cada  clasificado a 8vos acertado',
  '5 Puntos por campeon (no se puede cambiar despues de comenzado el mundial)',
  '3 Puntos por subcampeon',
  '1 Punto por tercer puesto'
]

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const Home: NextPage = () => {
  const [openSharingDialog, setOpenSharingDialog] = useState<string | false>(false);
  const [groupName, setGroupName] = useState('')
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false)
  const [userGroups, setUserGroups] = useState<ProdeGroup[]>([])
  const [participantGroups, setParticipantGroups] = useState<ProdeGroup[]>([])
  const [expanded, setExpanded] = useState(false)
  const [openConfirmDeleteGroup, setOpenConfirmDeleteGroup] = useState<string | false>(false)
  const theme = useTheme()

  const user = useCurrentUser();

  useEffect(() => {
    const getData = async () => {
      const userGroups = await query('prode_groups').where('ownerUserId', getCurrentUserId()).fetch();
      const groupParticipantIn = await query('prode_group_participants').where('userId', getCurrentUserId()).fetch();
      const participantGroups = await query('prode_groups').whereIn('id', groupParticipantIn.map(groupParticipant => groupParticipant.prodeGroupId)).fetch();
      setUserGroups(userGroups);
      setParticipantGroups(participantGroups);
    }
    getData()
  }, [getCurrentUserId(), user])

  const handleClickOpenGrupo = () => {
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
    const createdGroup = await createRecord('prode_groups', { ownerUserId: getCurrentUserId(), name: groupName });
    setUserGroups([
      ...userGroups,
      createdGroup
    ])
    setLoading(false)
    handleClose()
  }

  const handleGroupDelete = async () => {
    setLoading(true)
    if(openConfirmDeleteGroup) {
      await deleteRecord('prode_groups', openConfirmDeleteGroup);
      setUserGroups(userGroups.filter(group => group.id !== openConfirmDeleteGroup))
    }
    setLoading(false)
    setOpenConfirmDeleteGroup(false)
  }

  const handleExpandClick = () => {
    setExpanded(!expanded);
  }

  return (
    <>
      <Grid container spacing={2} p={2}>
        <Grid item xs={12} md={4} >
          <Card>
            <CardHeader
              title='Reglas Generales'
              sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
              action={
                <ExpandMore
                  expand={expanded}
                  onClick={handleExpandClick}
                  aria-expanded={expanded}
                  aria-label="show more"
                >
                  <ExpandMoreIcon />
                </ExpandMore>
              }
            />
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <CardContent sx={{ borderBottom: `${theme.palette.primary.contrastText} 1px solid`, borderTop: `${theme.palette.primary.contrastText} 1px solid` }}>
                <List disablePadding>
                  {rules.map((rule, index) => (
                    <ListItem
                      key={index}
                      alignItems='flex-start'
                      disableGutters>
                      <ListItemText>{rule}</ListItemText>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Collapse>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
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
                        <IconButton title='Invitar Amigos' onClick={() => setOpenSharingDialog(userGroup.id)}>
                          <ShareIcon/>
                        </IconButton>
                      </>
                    }>
                    <ListItemText><Link href={`/friend-groups/${userGroup.id}`}>{userGroup.name}</Link></ListItemText>
                  </ListItem>
                ))}
                {(userGroups.length > 0 && participantGroups.length > 0) &&  <ListItem divider/>}
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
              <Button onClick={handleClickOpenGrupo}>Crear Nuevo Grupo</Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title='Mis Estadisticas'
              sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
            />
            <CardContent>
              <Typography variant='body1'>Under Construction</Typography>
            </CardContent>
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
            &nbsp;{!!openSharingDialog && <Link onClick={() => navigator.clipboard.writeText(`${window.location.origin}/friend-groups/join/${openSharingDialog}`)}>{`${window.location.origin}/friend-groups/join/${openSharingDialog}`}</Link>}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={() => setOpenSharingDialog(false)}>Cancelar</Button>
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

export default Home

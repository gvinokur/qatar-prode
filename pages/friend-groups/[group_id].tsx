import {
  createRecord,
  getCurrentUserId,
  initThinBackend,
  ProdeGroup,
  ProdeGroupParticipant,
  query,
  User
} from "thin-backend";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Table,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import {useEffect, useState} from "react";
import Image from "next/image";


type ProdeGroupPageProps = {
  group: ProdeGroup,
  groupParticipants: ProdeGroupParticipant[]
}

initThinBackend({ host: process.env.NEXT_PUBLIC_BACKEND_URL });

const ProdeGroupPage = ({ group, groupParticipants}: ProdeGroupPageProps) => {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    const getUsers = async () => {
      const users = await query('users').whereIn('id', [group.ownerUserId, ...groupParticipants.map(participant => participant.userId)]).fetch();
      setUsers(users);
    };

    getUsers();
  }, [group, groupParticipants])
  return (
    <Box p={2}>
      <Grid container spacing={2}>
        <Grid item>
          {group.name.toLowerCase() === 'welltech' && (
            <Image src={'/welltech-logo.jpeg'} alt={'Grupo Welltech'} height={60} width={150}/>
          )}
        </Grid>
        <Grid item>
          <Typography variant={'h2'}>
            {group.name}
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item>
          <Card>
            <CardHeader title='Tabla de Posiciones'/>
            <CardContent>
              <Table>
                <TableHead>
                  <TableCell>P</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Puntos Totales</TableCell>
                  <TableCell>Puntos Fase de Grupos</TableCell>
                  <TableCell>Puntos Playoffs</TableCell>
                </TableHead>
                {users.map((user, index) => (
                  <TableRow key={user.id} selected={user.id === getCurrentUserId()}>
                    <TableCell>{index+1}</TableCell>
                    <TableCell>{user.nickname || user.email}</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>0</TableCell>
                  </TableRow>
                ))}
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export const getServerSideProps = async ({params}: {params: { group_id: string} }) => {
  const currentUserId = getCurrentUserId();
  const group: ProdeGroup = await query('prode_groups').where('id', params.group_id).fetchOne();
  const groupParticipants: ProdeGroupParticipant[] = await query('prode_group_participants').where('prodeGroupId', params.group_id).fetch();
  return {
    props: {
      group,
      groupParticipants
    }
  }
}

export default ProdeGroupPage

'use server'

import {joinGroup} from "../../../actions/prode-group-actions";
import {Box, Alert, Snackbar, Typography} from "../../../components/mui-wrappers";
import {redirect} from "next/navigation";
import {ProdeGroup} from "../../../db/tables-definition";
import { getLoggedInUser } from "../../../actions/user-actions";
import { findProdeGroupById, findParticipantsInGroup } from "../../../db/prode-group-repository";

type Props = {
  params: Promise<{
    id: string
  }>,
  searchParams: Promise<{
    openSignin?: string
  }>
}
export default async function JoinGroup(props : Props){
  const params = await props.params
  const searchParams = await props.searchParams
  const user = await getLoggedInUser()
  
  if(!user) {
    if(!searchParams.openSignin) {
      redirect(`/friend-groups/join/${params.id}/?openSignin=true`)
    } else {
      return (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="info" variant="filled">
            <Typography variant="h6" fontWeight={'bold'}>
              Debes iniciar sesión o registrarte para poder unirte al grupo.
            </Typography>
          </Alert>
        </Snackbar>
      )
    }
  }

  // Check if user is already a participant
  const targetGroup = await findProdeGroupById(params.id)
  if (!targetGroup) {
    return (
      <Box>
        <Alert variant="filled" severity="error">
          El grupo al que te estas tratando de unir no existe u ocurrió un error, por favor chequea de vuelta con el administrador.
        </Alert>
      </Box>
    )
  }

  const participants = await findParticipantsInGroup(targetGroup.id)
  const isAlreadyParticipant = participants.some((p: { user_id: string }) => p.user_id === user.id)
  
  if (isAlreadyParticipant) {
    redirect(`/friend-groups/${targetGroup.id}`)
  }

  try {
    const joinedGroup = await joinGroup(params.id);
    if(joinedGroup) {
      redirect(`/friend-groups/${joinedGroup.id}?recentlyJoined`)
    }
  } catch (e) {
    console.log(e)
  }

  return (
    <Box>
      <Alert variant="filled" severity="error">
        El grupo al que te estas tratando de unir no existe u ocurrió un error, por favor chequea de vuelta con el administrador.
      </Alert>
    </Box>
  )
}

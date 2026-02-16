'use server'

import {joinGroup} from "../../../../actions/prode-group-actions";
import {Box, Alert, Snackbar, Typography} from "../../../../components/mui-wrappers";
import {redirect} from "next/navigation";
import { getLoggedInUser } from "../../../../actions/user-actions";
import { findProdeGroupById, findParticipantsInGroup } from "../../../../db/prode-group-repository";

type Props = {
  readonly params: Promise<{
    id: string
  }>,
  readonly searchParams: Promise<{
    openSignin?: string
  }>
}
export default async function JoinGroup(props : Props){
  const params = await props.params
  const searchParams = await props.searchParams
  const user = await getLoggedInUser()
  
  if(!user) {
    if(!searchParams.openSignin) {
      redirect(`/es/friend-groups/join/${params.id}/?openSignin=true`)
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
  
  if (isAlreadyParticipant || targetGroup.owner_user_id === user.id) {
    redirect(`/es/friend-groups/${targetGroup.id}`)
  }
  let joinedGroup
  try {
    joinedGroup = await joinGroup(params.id);
  } catch {
    }

  if(joinedGroup) {
    redirect(`/es/friend-groups/${joinedGroup.id}?recentlyJoined`)
  }

  return (
    <Box>
      <Alert variant="filled" severity="error">
        El grupo al que te estas tratando de unir no existe u ocurrió un error, por favor chequea de vuelta con el administrador.
      </Alert>
    </Box>
  )
}

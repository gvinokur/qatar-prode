'use server'

import {joinGroup} from "../../../actions/prode-group-actions";
import {Box, Alert, Snackbar, Typography} from "../../../components/mui-wrappers";
import {redirect} from "next/navigation";
import {ProdeGroup} from "../../../db/tables-definition";
import { getLoggedInUser } from "../../../actions/user-actions";


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
  let group: ProdeGroup | undefined
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
  try {
    group = await joinGroup(params.id);
  } catch (e) {
    console.log(e)
  }

  if(group) {
    redirect(`/friend-groups/${group.id}?recentlyJoined`)
  }

  return (
    <Box>
      <Alert variant="filled" severity="error">
        El grupo al que te estas tratando de unir no existe u ocurrió un error, por favor chequea de vuelta con el administrador.
      </Alert>
    </Box>
  )

}

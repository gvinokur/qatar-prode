'use server'

import {joinGroup} from "../../../actions/prode-group-actions";
import {Box, Alert} from "../../../components/mui-wrappers";
import {redirect} from "next/navigation";
import {ProdeGroup} from "../../../db/tables-definition";


type Props = {
  params: Promise<{
    id: string
  }>
}
export default async function JoinGroup(props : Props){
  const params = await props.params
  let group: ProdeGroup | undefined
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

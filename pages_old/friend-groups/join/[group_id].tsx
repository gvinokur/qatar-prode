import {createRecord, getCurrentUserId, initThinBackend, ProdeGroup, query} from "thin-backend";
import {Box} from "@mui/material";
import {useEffect} from "react";
import {useRouter} from "next/router";

initThinBackend({ host: process.env.NEXT_PUBLIC_BACKEND_URL });

const JoinGroup = ( {group}: { group: ProdeGroup}) => {
  const router = useRouter()
  useEffect(() => {
    const createRecordAndForward = async () => {
      if (group.ownerUserId !== getCurrentUserId()) {
        await createRecord('prode_group_participants', {prodeGroupId: group.id, userId: getCurrentUserId()})
      }
      await router.push(`/friend-groups/${group.id}`)
    }
    if (group) {
      createRecordAndForward();
    }
  }, [group, router])
  return (
    <Box>
      {!group && 'El grupo al que te estas tratando de unir no existe, por favor chequea de vuelta con el administrador.'}
      {group && 'Uniendose al grupo ...'}
    </Box>
  )
}

export const getServerSideProps = async ({params}: {params: { group_id: string} }) => {
  const currentUserId = getCurrentUserId();
  const group: ProdeGroup = await query('prode_groups').where('id', params.group_id).fetchOne();
  return {
    props: {
      group
    }
  }
}

export default JoinGroup

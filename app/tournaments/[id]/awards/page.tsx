'use server'

import {Box, Alert, AlertTitle} from "../../../components/mui-wrappers";

type Props = {
  params: {
    id: string
  }
  searchParams: {[k:string]:string}
}

export default async function Awards({ params, searchParams}: Props) {


  return (
    <Box>
      <Alert variant={'filled'} severity={'warning'}>
        <AlertTitle>Premios Inviduales no disponibles</AlertTitle>
        Esta seccion estara disponible una vez que se den a conocer las nominas de los equipos participantes en el torneo
      </Alert>
    </Box>
  )
}

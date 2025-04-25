'use client'

import {Alert, AlertTitle, Box, Button, Snackbar} from "../mui-wrappers";
import {usePathname} from "next/navigation";
import {useState} from "react";

type Props = {
  tournamentId: string
}

export default function EmptyAwardsSnackbar({ tournamentId } : Props) {
  const [open, setOpen] = useState<boolean>(true)
  const pathname  = usePathname()
  if(pathname.match(/awards/)) {
    return (<></>);
  }


  return (
    <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={open} autoHideDuration={4000} onClose={() => {setOpen(false)}}>
      <Alert severity="warning" sx={{ width: '100%' }} action={(
        <Button href={`/tournaments/${tournamentId}/awards`}>
          Ir a Premios
        </Button>
      )}>
        <AlertTitle>Pronostico de Premios no Finalizado</AlertTitle>
        <Box>Hemos detectado que no has elegido quien sera el campeon o los premios individuales.</Box>
        <Box>La seleccion de dichas predicciones cierra 5 dias luego del inicio del campeonato.</Box>
        <Box>Puedes ir a la pagina de premios para hacer tus predicciones.</Box>
      </Alert>
    </Snackbar>
  )
}

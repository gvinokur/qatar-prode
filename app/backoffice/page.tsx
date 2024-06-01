'use server'

import {getLoggedInUser} from "../actions/user-actions";
import {redirect} from "next/navigation";
import {Alert, AlertTitle, Box} from "../components/mui-wrappers";
import BackofficeTabs from "../components/backoffice/backoffice-tabs";

export default async function Backoffice() {
  const user = await  getLoggedInUser()
  if(!user?.isAdmin) {
    redirect('/')
  }

  return (
    <Box p={2}>
      <Alert variant={'filled'} severity={"warning"}>
        <AlertTitle>Consola de administracion</AlertTitle>
        Estas en la consola de administracion, cualquie accion que tomes puede afectar la usabilidad general de la pagina.
      </Alert>
      <BackofficeTabs tabs={[
        {
          label: 'Tournament Management',
          component: (
            <div>Some logic about tournaments</div>
          )
        },
        {
          label: 'Tournament Game Management',
          component: (
            <div>Some logic about tournament games</div>
          )
        },
        {
          label: 'Overall Awards Management',
          component: (
            <div>Some logic about tournaments awards</div>
          )
        }
      ]}/>
    </Box>
  )
}

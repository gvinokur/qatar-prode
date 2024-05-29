'use client'

import {useState} from "react";
import {Alert, AlertTitle, Snackbar} from '@mui/material';

export default function JoinMessage() {
  const [open, setOpen] =  useState<boolean>(true)

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={() => setOpen(false)}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
    >
      <Alert
        severity="success"
        variant="filled"
        sx={{ width: '100%' }}
      >
        <AlertTitle>Bienvenido!!</AlertTitle>
        Gracias por unirte a este grupo. <br/>
        Ahora vas a poder competir contra un montón de amigos.
      </Alert>
    </Snackbar>
  )
}

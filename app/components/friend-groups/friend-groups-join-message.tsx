'use client'

import {useState} from "react";
import {Alert, AlertTitle, Snackbar} from '@mui/material';
import { useTranslations } from 'next-intl';

export default function JoinMessage() {
  const t = useTranslations('groups.joinMessage');
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
        <AlertTitle>{t('title')}</AlertTitle>
        {t('body')}
      </Alert>
    </Snackbar>
  )
}

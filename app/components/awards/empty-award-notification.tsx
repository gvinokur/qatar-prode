'use client'

import {Alert, AlertTitle, Box, Button, Snackbar} from "../mui-wrappers";
import {usePathname} from "next/navigation";
import {useState} from "react";
import { useTranslations } from 'next-intl';

type Props = {
  tournamentId: string
}

export default function EmptyAwardsSnackbar({ tournamentId } : Props) {
  const [open, setOpen] = useState<boolean>(true)
  const pathname  = usePathname()
  const t = useTranslations('awards')
  if(pathname.match(/awards/)) {
    return (<></>);
  }

  return (
    <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={open} autoHideDuration={4000} onClose={() => {setOpen(false)}}>
      <Alert severity="warning" sx={{ width: '100%' }} action={(
        <Button href={`/tournaments/${tournamentId}/awards`}>
          {t('notification.button')}
        </Button>
      )}>
        <AlertTitle>{t('notification.title')}</AlertTitle>
        <Box>{t('notification.message')} {t('notification.deadline')} {t('notification.action')}</Box>
      </Alert>
    </Snackbar>
  )
}

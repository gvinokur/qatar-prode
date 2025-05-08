'use client';

import { useEffect, useState } from 'react';
import {
  Snackbar,
  Button,
  Alert,
  AlertTitle,
  Stack
} from '@mui/material';
import { useSession } from 'next-auth/react';
import {subscribeUser} from "../actions/notifiaction-actions";
import {PushSubscription} from "web-push";
import {
  checkExistingSubscription,
  isNotificationSupported,
  subscribeToNotifications,
  urlBase64ToUint8Array
} from "../utils/notifications-utils";


export default function NotificationsSubscriptionPrompt() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [openUnregister, setOpenUnregister] = useState(false)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkNotificationEligibility = async () => {
      // Don't show if user isn't logged in
      if (status !== 'authenticated' || !session?.user?.id) {
        setLoading(false);
        return;
      }

      // Check if user has opted out
      const neverAskAgain = localStorage.getItem('notification-never-ask-again') === 'true';
      if (neverAskAgain) {
        setLoading(false);
        return;
      }

      const dontAskUntil = localStorage.getItem('notification-dont-ask-until')
      if(dontAskUntil) {
        const expires: number = Number.parseInt(dontAskUntil, 10)
        if(expires > Date.now()) {
          setLoading(false)
          return
        }
      }

      // Check browser support
      if (!isNotificationSupported()) {
        setLoading(false);
        return;
      }

      // Check notification hasn't been denied yet
      if (Notification.permission === 'denied') {
        setLoading(false);
        return;
      }

      // Check if already subscribed
      const isSubscribed = await checkExistingSubscription();
      console.log(isSubscribed)
      if (isSubscribed) {
        setLoading(false);
        return;
      }

      // If we get here, we should show the prompt
      setOpen(true);
      setLoading(false);
    };

    checkNotificationEligibility();
  }, [session, status]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleNeverAskAgain = () => {
    localStorage.setItem('notification-never-ask-again', 'true');
    setOpen(false);
  };

  const handleNotNow= () => {
    //don't ask for a day
    localStorage.setItem('notification-dont-ask-until', (Date.now() + 24 * 60 * 60 * 1000).toString());
    setOpen(false);
  }


  const handleSubscribe = async () => {
    try {
      // Request permission
      await subscribeToNotifications()
      setOpen(false);
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  };

  if (loading || (!open && !openUnregister)) {
    return null;
  }

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ maxWidth: '500px', width: '100%' }}
    >
      <Alert
        severity="info"
        variant="filled"
        sx={{ width: '100%' }}
      >
        <AlertTitle>Notificaciones</AlertTitle>
        <p>¿Te gustaría recibir notificaciones para estar al día con las últimas actualizaciones?</p>
        <Stack direction="row" spacing={1} mt={1} justifyContent="flex-end">
          <Button
            size="small"
            color="inherit"
            onClick={handleNeverAskAgain}
            sx={{ opacity: 0.7 }}
          >
            No preguntar más
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={handleNotNow}
          >
            Ahora no
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={handleSubscribe}
            sx={{ fontWeight: 'bold' }}
          >
            Activar
          </Button>
        </Stack>
      </Alert>
    </Snackbar>
  );
}

'use client'

import {useEffect, useState} from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle, FormControlLabel, Grid, Switch,
  TextField
} from "@mui/material";
import {Controller, useForm} from "react-hook-form";
import { updateNickname } from "../../actions/user-actions";
import { useSession } from "next-auth/react";
import {
  checkExistingSubscription,
  isNotificationSupported,
  subscribeToNotifications, unsubscribeFromNotifications
} from "../../utils/notifications-utils";

type NicknameFormData = {
  nickname: string,
  enableNotifications: boolean,
}

type UserSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
}

export default function UserSettingsDialog({ open, onClose }: UserSettingsDialogProps) {
  const { update, data:session } = useSession();
  const [loading, setLoading] = useState(false);
  const [disableNotifications, setDisableNotifications] = useState<boolean>(false)
  const { register, handleSubmit, setValue, control } = useForm<NicknameFormData>({
    defaultValues: {
      nickname: session?.user.nickname || session?.user?.name || '',
      enableNotifications: false
    }
  });

  useEffect(() => {
    console.log('notification supported', isNotificationSupported())
    setDisableNotifications(!isNotificationSupported())

    checkExistingSubscription().then(isSubscribed => {
      console.log('is subscribed', isSubscribed)
      setValue('enableNotifications', isSubscribed)
    });

  }, [setValue])

  const handleNicknameSet = async ({ nickname, enableNotifications }: NicknameFormData) => {
    setLoading(true);
    await updateNickname(nickname);
    await update({
      name: nickname,
      nickname
    });
    console.log('also need to update notifications', enableNotifications)
    if(enableNotifications) {
      await subscribeToNotifications()
    } else {
      await unsubscribeFromNotifications()
    }
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}
      PaperProps={{
        //@ts-ignore
        component: 'form',
        onSubmit: handleSubmit(handleNicknameSet)
      }}>
      <DialogTitle>Configuracion de Usuario</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus={true}
          margin="dense"
          label="Apodo"
          type="text"
          fullWidth
          variant="standard"
          {...register('nickname')}
        />
        <Controller
          control={control}
          name={'enableNotifications'}
          render={
            ({field}) => (
              <FormControlLabel
                sx={{mt:2, mx:0, width: '100%', justifyContent: 'space-between'}}
                control={
                  <Switch
                    checked={field.value}
                    disabled={disableNotifications}
                    onClick={() => setValue('enableNotifications', !field.value)}
                  />
                }
                label={'Recibir Notificationes'}
                labelPlacement='start'
              />)
          }/>

      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={onClose}>Cancelar</Button>
        <Button loading={loading} type='submit'>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

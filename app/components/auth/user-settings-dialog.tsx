'use client'

import {useEffect, useState} from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, FormControlLabel, Switch,
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
  readonly open: boolean;
  readonly onClose: () => void;
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
    setDisableNotifications(!isNotificationSupported())

    checkExistingSubscription().then(isSubscribed => {
      setValue('enableNotifications', isSubscribed)
    }).catch(error => {
      console.error('Failed to check existing subscription:', error);
      // Default to false if we can't check the subscription
      setValue('enableNotifications', false);
    });

  }, [setValue])

  const handleNicknameSet = async ({ nickname, enableNotifications }: NicknameFormData) => {
    setLoading(true);
    await updateNickname(nickname);
    await update({
      name: nickname,
      nickname
    });
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
      slotProps={{
        paper: {
          //@ts-ignore
          component: 'form',
          onSubmit: handleSubmit(handleNicknameSet)
        }
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

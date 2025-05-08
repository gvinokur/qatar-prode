'use client'

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from "@mui/material";
import { useForm } from "react-hook-form";
import { updateNickname } from "../../actions/user-actions";
import { useSession } from "next-auth/react";

type NicknameFormData = {
  nickname: string
}

type UserSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
}

export default function UserSettingsDialog({ open, onClose }: UserSettingsDialogProps) {
  const { update, data:session } = useSession();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<NicknameFormData>({
    defaultValues: {
      nickname: session?.user.nickname || session?.user?.name || ''
    }
  });

  const handleNicknameSet = async ({ nickname }: NicknameFormData) => {
    setLoading(true);
    await updateNickname(nickname);
    await update({
      name: nickname,
      nickname
    });
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
      <DialogTitle>Cambiar tu apodo</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Este es el nombre que tus amigos van a ver en las tablas de todos tus grupos
        </DialogContentText>
        <TextField
          autoFocus={true}
          margin="dense"
          label="Apodo"
          type="text"
          fullWidth
          variant="standard"
          {...register('nickname')}
        />
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={onClose}>Cancelar</Button>
        <Button loading={loading} type='submit'>Cambiar</Button>
      </DialogActions>
    </Dialog>
  );
}

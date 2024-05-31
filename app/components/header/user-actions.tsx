'use client'

import { useEffect, useState} from "react";
import * as React from "react";
import {
  Avatar,
  Box, Button,
  Dialog, DialogActions,
  DialogContent, DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem, TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {LoadingButton} from "@mui/lab";
import {useSearchParams, useRouter} from "next/navigation";
import LoginOrSignupDialog from "../auth/login-or-signup-dialog";
import {signOut, useSession} from "next-auth/react";
import {updateNickname} from "../../actions/user-actions";
import {useForm} from "react-hook-form";
import tournaments from "../../../data/tournaments";
import {generateDbTournament} from "../../actions/backoffice-actions";
import {AdapterUser} from "next-auth/adapters";

type UserActionProps = {
  user?: AdapterUser
}

type NicknameFormData = {
  nickname: string
}

export default function UserActions({ user }: UserActionProps) {
  const searchParams = useSearchParams()
  const { update} = useSession()
  const [openLoginDialog, setOpenLoginDialog] = useState(!!searchParams?.get('openSignin') && !user);
  const [openNicknameDialog, setOpenNicknameDialog] = useState(false);
  const [availableTournaments, setAvailableTournaments] = useState<string[]>();
  const [loading, setLoading] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const {register, handleSubmit} = useForm<NicknameFormData>()
  const router = useRouter()

  useEffect(() => {
    if(user?.isAdmin) {
      const availableTournaments = tournaments.map(tournament => tournament.tournament_name)
      setAvailableTournaments(availableTournaments)
    }
  }, [user, setAvailableTournaments])

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpen = () => {
    setOpenNicknameDialog(true);
  };

  const handleCloseNicknameDialog = () => {
    setOpenNicknameDialog(false);
  };
  const handleNicknameSet = async ({nickname}: NicknameFormData) => {
    setLoading(true)
    await updateNickname(nickname)
    await update({
      name: nickname,
      nickname
    })
    setLoading(false)
    handleCloseNicknameDialog()
  }

  const handleOpenLoginDialog = () => {
    setOpenLoginDialog(true);
  };

  const handleCloseLoginDialog = () => {
    setOpenLoginDialog(false);
  };

  const handleLogout = async () => {
    console.log('logout')
    await signOut({
      redirect: false
    })
    console.log('logged out')
    router.push("/");
    router.refresh();
  }

  const handleCreateTournament = (tournamentName: string) => async () => {
    await generateDbTournament(tournamentName, true)
  }

  // @ts-ignore
  return (
    <>
      {user ? (
        <Box sx={{ flexGrow: 0 }}>
          <Tooltip title="Open settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar alt={(user.nickname || user.email || '')}>{(user.nickname || user.email || 'U')[0]}</Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            <MenuItem onClick={handleCloseUserMenu}>
              <Typography textAlign="center" onClick={handleOpen}>Cambiar Apodo</Typography>
            </MenuItem>
            {user.isAdmin && availableTournaments && (<MenuItem divider={true} sx={{ padding: '0px'}}/>)}
            {user.isAdmin && availableTournaments &&
              availableTournaments.map(tournamentName => (
                <MenuItem key={tournamentName} onClick={handleCreateTournament(tournamentName)}>
                  Crear el torneo {tournamentName}
                </MenuItem>
              ))
            }
            {user.isAdmin && availableTournaments && (<MenuItem divider={true} sx={{ padding: '0px'}}/>)}
            <MenuItem onClick={() => { handleLogout(); handleCloseUserMenu();}}>
              <Typography textAlign="center">Salir</Typography>
            </MenuItem>
          </Menu>
        </Box>
    ) : (
      <Box sx={{ flexGrow: 0 }}>
        <Button
          onClick={handleOpenLoginDialog}
          sx={{ my: 2, color: 'white', display: 'block' }}
        >
          Log In
        </Button>
      </Box>
    )}
      <Dialog open={openNicknameDialog} onClose={handleCloseNicknameDialog}
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
            defaultValue={user?.nickname}
            fullWidth
            variant="standard"
            { ...register('nickname')}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={handleCloseNicknameDialog}>Cancelar</Button>
          <LoadingButton loading={loading} type='submit'>Cambiar</LoadingButton>
        </DialogActions>
      </Dialog>
      <LoginOrSignupDialog openLoginDialog={openLoginDialog} handleCloseLoginDialog={handleCloseLoginDialog}/>
    </>
  )
}

'use client'

import { useEffect, useState} from "react";
import * as React from "react";
import {
  Avatar,
  Box, Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import {useSearchParams, useRouter} from "next/navigation";
import LoginOrSignupDialog from "../auth/login-or-signup-dialog";
import {signOut} from "next-auth/react";
import {User} from "next-auth";
import UserSettingsDialog from "../auth/user-settings-dialog";

type UserActionProps = {
  user?: User
}

export default function UserActions({ user }: UserActionProps) {
  const searchParams = useSearchParams()
  const [forceOpen, setForceOpen] = useState(false)
  const [openLoginDialog, setOpenLoginDialog] = useState(forceOpen);
  const [openNicknameDialog, setOpenNicknameDialog] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const router = useRouter()

  useEffect(() => {
    if(!!searchParams?.get('openSignin') && !user) {
      setForceOpen(true)
      setOpenLoginDialog(true)
    }
    if (searchParams.get('verified')) {
      setOpenLoginDialog(true)
    }
  }, [searchParams, user]);

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

  const handleOpenLoginDialog = () => {
    setOpenLoginDialog(true);
  };

  const handleCloseLoginDialog = (forceClose?: boolean) => {
    if(!forceOpen || forceClose || user) {
      setOpenLoginDialog(false);
    }
  };

  const handleLogout = async () => {
    await signOut({
      redirect: false
    })
    router.push("/");
    router.refresh();
  }

  // @ts-ignore
  return (
    <>
      {user ? (
        <Box sx={{ flexGrow: 0 }}>
          <Tooltip title="Abrir Menu de Usuario">
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
              <Typography textAlign="center" onClick={handleOpen}>Configuracion</Typography>
            </MenuItem>
            {user.isAdmin && (
              <MenuItem onClick={() => router.push('/backoffice')}>
                Ir al Back Office
              </MenuItem>
            )}
            <MenuItem onClick={() => { handleLogout(); handleCloseUserMenu();}} divider={true}>
              <Typography textAlign="center">Salir</Typography>
            </MenuItem>
            <MenuItem onClick={() => router.push('/delete-account')}>
              Delete Account
            </MenuItem>
          </Menu>
        </Box>
    ) : (
      <Box sx={{ flexGrow: 0 }}>
        <Button
          onClick={handleOpenLoginDialog}
          sx={{ my: 2, color: 'white' }}
        >
          Log In
        </Button>
      </Box>
    )}
      <UserSettingsDialog
        open={openNicknameDialog}
        onClose={handleCloseNicknameDialog}
      />
      <LoginOrSignupDialog 
        openLoginDialog={openLoginDialog} 
        handleCloseLoginDialog={handleCloseLoginDialog}
      />
    </>
  )
}

'use client'

import { useEffect, useState} from "react";
import * as React from "react";
import {
  Avatar,
  Box, Button,
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
import OnboardingDialogClient from "../onboarding/onboarding-dialog-client";
import { useLocale, useTranslations } from 'next-intl';

type UserActionProps = {
  user?: User
}

export default function UserActions({ user }: UserActionProps) {
  const locale = useLocale()
  const t = useTranslations('navigation')
  const searchParams = useSearchParams()
  const [forceOpen, setForceOpen] = useState(false)
  const [openLoginDialog, setOpenLoginDialog] = useState(forceOpen);
  const [openNicknameDialog, setOpenNicknameDialog] = useState(false);
  const [openOnboardingDialog, setOpenOnboardingDialog] = useState(false);
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

  const handleOpenOnboarding = () => {
    setOpenOnboardingDialog(true);
    handleCloseUserMenu();
  };

  const handleCloseOnboarding = () => {
    setOpenOnboardingDialog(false);
  };

  const handleLogout = async () => {
    await signOut({
      redirect: false
    })
    router.push(`/${locale}`);
    router.refresh();
  }

  // @ts-ignore
  return (
    <>
      {user ? (
        <Box sx={{ flexGrow: 0 }}>
          <Tooltip title={t('header.userMenu.tooltip')}>
            <Avatar
              onClick={handleOpenUserMenu}
              alt={(user.nickname || user.email || '')}
              sx={{
                width: 40,
                height: 40,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }}
            >
              {(user.nickname || user.email || 'U')[0]}
            </Avatar>
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
              <Typography textAlign="center" onClick={handleOpen}>{t('header.userMenu.settings')}</Typography>
            </MenuItem>
            <MenuItem onClick={handleOpenOnboarding}>
              <Typography textAlign="center">{t('header.userMenu.tutorial')}</Typography>
            </MenuItem>
            {user.isAdmin && (
              <MenuItem onClick={() => router.push(`/${locale}/backoffice`)}>
                {t('header.userMenu.backoffice')}
              </MenuItem>
            )}
            <MenuItem onClick={() => { handleLogout(); handleCloseUserMenu();}} divider={true}>
              <Typography textAlign="center">{t('header.userMenu.logout')}</Typography>
            </MenuItem>
            <MenuItem onClick={() => router.push(`/${locale}/delete-account`)}>
              {t('header.userMenu.deleteAccount')}
            </MenuItem>
          </Menu>
        </Box>
    ) : (
      <Box sx={{ flexGrow: 0 }}>
        <Button
          onClick={handleOpenLoginDialog}
          sx={{ my: 2, color: 'white' }}
        >
          {t('header.login')}
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
      {openOnboardingDialog && (
        <OnboardingDialogClient
          initialOpen={true}
          onClose={handleCloseOnboarding}
        />
      )}
    </>
  )
}

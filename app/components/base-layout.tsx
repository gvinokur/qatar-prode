'use client'

import * as React from "react";
import {
  AppBar,
  Typography,
  Box,
  Avatar, Grid, useTheme, IconButton

} from "@mui/material";
import UserActions from "./header/user-actions";
import Link from "next/link";
import {AdapterUser} from "next-auth/adapters";
import {useContext} from "react";
import {AppThemeModeContext} from "./context-providers/theme-provider";
import {DarkMode, Light, LightMode} from "@mui/icons-material";

type FrameProps = {
  user?: AdapterUser
  children?: React.ReactNode | React.ReactNode[],
}

type Page = {
  name: string,
  link: string,
  children?: Page[]
}

const pages: Page[] = [ {
  name: 'Home',
  link: '/'
}, {
  name: 'Torneos',
  link: '/tournaments'
}]

export default function BaseLayout(props: FrameProps) {
  const theme = useTheme()
  const {themeMode, switchThemeMode } = useContext(AppThemeModeContext)
  return (
    <>
      <AppBar position={'sticky'}>
        <Box
          display={'flex'}
          flexDirection={'row'}
          px={2}
          py={1}
          gap={2}
          justifyContent={'space-between'}
        >
          <Box>
            <Link href={'/'}>
              <Avatar
                variant={"rounded"}
                src={'/logo.webp'}
                alt='la-maquina-prode'
                sx={{
                  backgroundColor: 'white',
                  height: 60,
                  width: 60,
                  mr: 2,
                }}/>
            </Link>
          </Box>
          <Typography
            variant="h6"
            noWrap
            alignContent={'center'}
            sx={{
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer'
            }}>
            <Link href={'/'}>La Maquina Prode</Link>
          </Typography>
          <Box
            alignContent={'center'}
            display={'flex'}
            flexDirection={'row'}
            justifyContent={'flex-end'}
            flexWrap={'wrap'}
            minWidth={'96px'}
          >
            <IconButton title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`} onClick={switchThemeMode}
                        sx={{mr: 1}}>
              {themeMode === 'light' &&
                  <DarkMode sx={{height: 24, width: 24, color: theme.palette.primary.contrastText}}/>}
              {themeMode === 'dark' &&
                  <LightMode sx={{height: 24, width: 24, color: theme.palette.primary.contrastText}}/>}
            </IconButton>
            <UserActions user={props.user}/>
          </Box>
        </Box>
      </AppBar>
      <Box>{props.children}</Box>
    </>
  )
}

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
        <Grid container xs={12} pl={2} pr={2} pt={1} pb={1} spacing={2}>
          <Grid item xs={3}>
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
          </Grid>
          <Grid item xs={6} alignSelf={'center'} textAlign={'center'}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                cursor: 'pointer'}}>
              <Link href={'/'}>La Maquina Prode</Link>
            </Typography>
          </Grid>
          <Grid
            item
            xs={3}
            alignContent={'center'}
            display={'flex'}
            flexDirection={'row'}
            justifyContent={'flex-end'}
            flexWrap={'wrap'}
          >
            <IconButton title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`} onClick={switchThemeMode} sx={{ mr: 2 }}>
              {themeMode === 'light' && <DarkMode sx={{ height: 24, width: 24, color: theme.palette.primary.contrastText  }} />}
              {themeMode === 'dark' && <LightMode sx={{ height: 24, width: 24, color: theme.palette.primary.contrastText  }} />}
            </IconButton>
            <UserActions user={props.user}/>
          </Grid>
        </Grid>
      </AppBar>
      <Box sx={{ backgroundColor: theme.palette.background.default }}>{props.children}</Box>
    </>
  )
}

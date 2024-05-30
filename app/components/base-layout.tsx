'use client'

import * as React from "react";
import {
  AppBar,
  Toolbar,
  Paper,
  Typography,
  IconButton,
  Box,
  Button, Avatar, Container, CssBaseline,

} from "@mui/material";
import {
  Menu as MenuIcon
} from '@mui/icons-material'
import Image from 'next/image';
import UserActions from "./header/user-actions";
import Link from "next/link";
import {AdapterUser} from "next-auth/adapters";

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
  return (
    <>
      <AppBar position={'sticky'}>
        <Toolbar>
          <Link href={'/'}>
            <Avatar
              variant={"rounded"}
              src={'/logo.png'}
              alt='la-maquina-prode'
              sx={{
                height: 48,
                width: 48,
                mr: 2,
                display: { xs: 'none', md: 'flex' }
              }}/>
          </Link>
          <Typography
            variant="h6"
            noWrap
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              flexGrow: 0,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer'}}>
            <Link href={'/'}>La Maquina Prode</Link>
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              //onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
          </Box>

          <Link href={'/'}>
            <Avatar
              variant={"rounded"}
              src={'/logo.png'}
              alt='la-maquina-prode'
              sx={{
                height: 48,
                width: 48,
                mr: 1,
                display: { xs: 'flex', md: 'none' }
              }}/>
          </Link>

          <Typography
            variant="h6"
            noWrap
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer'}}>
            <Link href={'/'}>La Maquina Prode</Link>
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 0 }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                <Link href={page.link}>{page.name}</Link>
              </Button>
            ))}
          </Box>

          <UserActions user={props.user}/>
        </Toolbar>
      </AppBar>
      <main>{props.children}</main>
    </>
  )
}

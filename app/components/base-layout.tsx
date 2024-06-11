'use client'

import * as React from "react";
import {
  AppBar,
  Typography,
  Box,
  Avatar, Grid

} from "@mui/material";
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
        <Grid container xs={12} pl={2} pr={2} pt={1} pb={1} spacing={2}>
          <Grid item xs={3}>
            <Link href={'/'}>
              <Avatar
                variant={"rounded"}
                src={'/logo.png'}
                alt='la-maquina-prode'
                sx={{
                  height: 48,
                  width: 48,
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
          <Grid item xs={3} textAlign={'right'}>
            <UserActions user={props.user}/>
          </Grid>
        </Grid>
      </AppBar>
      <Box>{props.children}</Box>
    </>
  )
}

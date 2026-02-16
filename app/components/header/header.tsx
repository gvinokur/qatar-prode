'use server'

import * as React from "react";
import {
  AppBar,
  Typography,
  Box,
  Avatar,
} from "@mui/material";
import UserActions from "./user-actions";
import Link from "next/link";
import {User} from "next-auth";
import ThemeSwitcher from "./theme-switcher";
import LanguageSwitcher from "./language-switcher";
import { getLocale } from 'next-intl/server';

type FrameProps = {
  readonly user?: User
}

export default async function Header(props: FrameProps) {
  const locale = await getLocale();

  return (
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
          <Link href={`/${locale}`}>
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
          <Link href={`/${locale}`}>La Maquina Prode</Link>
        </Typography>
        <Box
          alignContent={'center'}
          display={'flex'}
          flexDirection={'row'}
          justifyContent={'flex-end'}
          flexWrap={'wrap'}
          minWidth={'96px'}
        >
          <ThemeSwitcher />
          <LanguageSwitcher />
          <UserActions user={props.user}/>
        </Box>
      </Box>
    </AppBar>
  )
}

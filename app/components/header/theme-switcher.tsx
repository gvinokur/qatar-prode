'use client'

import {DarkMode, LightMode} from "@mui/icons-material";
import {IconButton, useTheme} from "@mui/material";
import {useTheme as useNextTheme} from "next-themes";

export default function ThemeSwitcher() {
  const theme = useTheme()
  const {resolvedTheme: themeMode, setTheme } = useNextTheme()

  const switchThemeMode = async () => {
    const newThemeMode = themeMode === 'light' ? 'dark' : 'light'
    setTheme(newThemeMode)
  }

  return (
    <IconButton title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`} onClick={switchThemeMode}
                sx={{mr: 1}}>
      {themeMode === 'light' &&
          <DarkMode sx={{height: 24, width: 24, color: theme.palette.primary.contrastText}}/>}
      {themeMode === 'dark' &&
          <LightMode sx={{height: 24, width: 24, color: theme.palette.primary.contrastText}}/>}
    </IconButton>
  )
}

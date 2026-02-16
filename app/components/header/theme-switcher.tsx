'use client'

import {DarkMode, LightMode} from "@mui/icons-material";
import {Avatar, useTheme} from "@mui/material";
import {useTheme as useNextTheme} from "next-themes";

export default function ThemeSwitcher() {
  const theme = useTheme()
  const {resolvedTheme: themeMode, setTheme } = useNextTheme()

  const switchThemeMode = async () => {
    const newThemeMode = themeMode === 'light' ? 'dark' : 'light'
    setTheme(newThemeMode)
  }

  return (
    <Avatar
      onClick={switchThemeMode}
      title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
      sx={{
        width: 40,
        height: 40,
        cursor: 'pointer',
        bgcolor: 'action.hover',
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: 'action.selected',
          transform: 'scale(1.05)',
        }
      }}
    >
      {themeMode === 'light' && <DarkMode sx={{fontSize: 20}}/>}
      {themeMode === 'dark' && <LightMode sx={{fontSize: 20}}/>}
    </Avatar>
  )
}

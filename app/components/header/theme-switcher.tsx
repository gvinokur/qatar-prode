'use client'

import {DarkMode, LightMode} from "@mui/icons-material";
import {Avatar, useTheme} from "@mui/material";
import {useTheme as useNextTheme} from "next-themes";
import { useTranslations } from 'next-intl';

export default function ThemeSwitcher() {
  const theme = useTheme()
  const {resolvedTheme: themeMode, setTheme } = useNextTheme()
  const t = useTranslations('common');

  const switchThemeMode = async () => {
    const newThemeMode = themeMode === 'light' ? 'dark' : 'light'
    setTheme(newThemeMode)
  }

  return (
    <Avatar
      role="button"
      tabIndex={0}
      onClick={switchThemeMode}
      title={t('theme.switchTo', {
        mode: themeMode === 'light' ? t('theme.dark') : t('theme.light')
      })}
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
      {themeMode === 'light' && <DarkMode sx={{fontSize: 20, color: theme.palette.primary.contrastText}}/>}
      {themeMode === 'dark' && <LightMode sx={{fontSize: 20, color: theme.palette.primary.contrastText}}/>}
    </Avatar>
  )
}

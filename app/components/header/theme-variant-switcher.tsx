'use client'

import {useState} from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip
} from '@mui/material'
import PaletteIcon from '@mui/icons-material/Palette'
import CheckIcon from '@mui/icons-material/Check'
import {useThemeVariant, ThemeVariant} from '../context-providers/theme-variant-provider'
import {useTranslations} from 'next-intl'

const themeVariants: Array<{
  value: ThemeVariant
  labelKey: string
  icon: string
  description: string
}> = [
  {
    value: 'violet',
    labelKey: 'violet',
    icon: '👑',
    description: 'Royal Sports - Soft Violet'
  },
  {
    value: 'rose',
    labelKey: 'rose',
    icon: '🍷',
    description: 'Refined Competition - Rose Red'
  },
  {
    value: 'olive',
    labelKey: 'olive',
    icon: '🏆',
    description: 'Classic Championship - Olive Green'
  }
]

export default function ThemeVariantSwitcher() {
  const {variant, setVariant} = useThemeVariant()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const t = useTranslations('common')

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleVariantChange = (newVariant: ThemeVariant) => {
    setVariant(newVariant)
    handleClose()
  }

  const currentTheme = themeVariants.find(t => t.value === variant)

  return (
    <>
      <Tooltip title={t('theme.changeColorScheme') || 'Change color scheme'}>
        <IconButton
          onClick={handleOpen}
          aria-label="theme variant selector"
          sx={{
            color: 'text.primary',
            '& .MuiSvgIcon-root': {
              fontSize: '1.5rem'
            }
          }}
        >
          <PaletteIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 250,
            mt: 1,
            borderRadius: 2,
          }
        }}
      >
        {themeVariants.map((themeVariant) => (
          <MenuItem
            key={themeVariant.value}
            onClick={() => handleVariantChange(themeVariant.value)}
            selected={variant === themeVariant.value}
            sx={{
              py: 1.5,
              px: 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, fontSize: '1.5rem' }}>
              {themeVariant.icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {themeVariant.description}
                  {variant === themeVariant.value && (
                    <CheckIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                  )}
                </Box>
              }
              primaryTypographyProps={{
                fontSize: '0.95rem',
                fontWeight: variant === themeVariant.value ? 600 : 400
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

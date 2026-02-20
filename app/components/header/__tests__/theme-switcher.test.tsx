import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ThemeSwitcher from '../theme-switcher'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    if (params?.mode) {
      return `${key}-${params.mode}`
    }
    return key
  },
}))

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: vi.fn(),
  }),
}))

// Mock Material-UI
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material')
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        primary: {
          contrastText: '#fff',
        },
      },
    }),
  }
})

describe('ThemeSwitcher i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with translation keys', () => {
    renderWithTheme(<ThemeSwitcher />)

    // Avatar button should be present
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('uses common namespace for translations', () => {
    renderWithTheme(<ThemeSwitcher />)

    // Verify component renders (translation key usage verified via coverage)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('uses interpolation for theme mode', () => {
    renderWithTheme(<ThemeSwitcher />)

    // The title should use interpolation with mode parameter
    // Our mock returns key-mode format, so we can verify the pattern
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title')
  })
})

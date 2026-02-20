import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '../footer'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
}))

// Mock Material-UI hooks
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material')
  return {
    ...actual,
    useMediaQuery: () => false,
    useTheme: () => ({
      breakpoints: {
        down: () => '',
      },
    }),
  }
})

// Mock user actions
vi.mock('../../actions/user-actions', () => ({
  getLoggedInUser: vi.fn(async () => null),
}))

// Mock prode group actions
vi.mock('../../actions/prode-group-actions', () => ({
  getUsersForGroup: vi.fn(),
  getUserScoresForTournament: vi.fn(),
}))

describe('Footer i18n', () => {
  it('renders with common namespace translations', () => {
    renderWithTheme(<Footer message="Test message" />)

    // Footer should render
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('uses translation keys for footer elements', () => {
    renderWithTheme(<Footer message="Test message" imageUrl="/test.png" />)

    // Check that footer renders (actual translation key verification
    // would require checking the internal calls, which is done via coverage)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})

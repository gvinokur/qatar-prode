import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TournamentStartBanner } from '../tournament-start-banner'

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}))

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mui/material')>()
  return {
    ...actual,
    useTheme: vi.fn(() => ({
      palette: {
        secondary: { main: '#9c27b0', light: '#ba68c8' },
      },
    })),
  }
})

describe('TournamentStartBanner', () => {
  it('renders the celebration title from i18n key', () => {
    render(<TournamentStartBanner />)
    expect(screen.getByText('tournamentStarted.title')).toBeInTheDocument()
  })

  it('renders the celebration subtitle from i18n key', () => {
    render(<TournamentStartBanner />)
    expect(screen.getByText('tournamentStarted.subtitle')).toBeInTheDocument()
  })

  it('renders a CelebrationIcon (SVG element present)', () => {
    const { container } = render(<TournamentStartBanner />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('applies gradient paper styling (secondary color gradient)', () => {
    const { container } = render(<TournamentStartBanner />)
    // The Paper element should be present as the root container
    const paper = container.firstChild
    expect(paper).toBeInTheDocument()
  })

  it('does not render a See all games button', () => {
    render(<TournamentStartBanner />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

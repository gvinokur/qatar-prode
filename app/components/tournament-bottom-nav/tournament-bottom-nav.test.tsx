import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'
import TournamentBottomNav from './tournament-bottom-nav'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'es',
  useTranslations: () => (key: string) => {
    // Return translations matching what tests expect (mix of English/Spanish)
    const translations: Record<string, string> = {
      'bottomNav.home': 'Home',
      'bottomNav.results': 'Tablas',
      'bottomNav.rules': 'Reglas',
      'bottomNav.stats': 'Stats',
      'bottomNav.groups': 'Grupos',
    };
    return translations[key] || key;
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

describe('TournamentBottomNav', () => {
  const tournamentId = 'test-tournament'
  let mockPush: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn()
    } as any)
  })

  it('renders exactly 5 navigation tabs', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}`} />
    )

    const tabs = screen.getAllByRole('button')
    expect(tabs).toHaveLength(5)
  })

  it('does not render a "Tournament" tab', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}`} />
    )

    expect(screen.queryByText('Tournament')).not.toBeInTheDocument()
  })

  it('renders "Home" tab', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}`} />
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders "Tablas" tab (renamed from Resultados)', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}`} />
    )

    expect(screen.getByText('Tablas')).toBeInTheDocument()
    expect(screen.queryByText('Resultados')).not.toBeInTheDocument()
  })

  it('renders "Reglas" tab (new)', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}`} />
    )

    expect(screen.getByText('Reglas')).toBeInTheDocument()
  })

  it('renders "Stats" tab', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}`} />
    )

    expect(screen.getByText('Stats')).toBeInTheDocument()
  })

  it('renders "Grupos" tab (renamed from Friend Groups)', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}`} />
    )

    expect(screen.getByText('Grupos')).toBeInTheDocument()
    expect(screen.queryByText('Friend Groups')).not.toBeInTheDocument()
  })

  it('activates "main-home" tab when on home route', () => {
    const { container } = renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath="/es" />
    )

    const homeButton = screen.getByText('Home').closest('button')
    expect(homeButton).toHaveClass('Mui-selected')
  })

  it('activates "results" tab when on /results route', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}/results`} />
    )

    const tablasButton = screen.getByText('Tablas').closest('button')
    expect(tablasButton).toHaveClass('Mui-selected')
  })

  it('activates "rules" tab when on /rules route', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}/rules`} />
    )

    const reglasButton = screen.getByText('Reglas').closest('button')
    expect(reglasButton).toHaveClass('Mui-selected')
  })

  it('activates "stats" tab when on /stats route', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}/stats`} />
    )

    const statsButton = screen.getByText('Stats').closest('button')
    expect(statsButton).toHaveClass('Mui-selected')
  })

  it('activates "friend-groups" tab when on /friend-groups route', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}/friend-groups`} />
    )

    const gruposButton = screen.getByText('Grupos').closest('button')
    expect(gruposButton).toHaveClass('Mui-selected')
  })

  it('does not activate any tab when on tournament home (PARTIDOS)', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}`} />
    )

    // None of the bottom nav buttons should be selected (PARTIDOS is in top nav)
    const tabs = screen.getAllByRole('button')
    tabs.forEach(tab => {
      expect(tab).not.toHaveClass('Mui-selected')
    })
  })

  it('navigates to correct route when Home tab is clicked', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath={`/es/tournaments/${tournamentId}`} />
    )

    const homeTab = screen.getByText('Home').closest('button')
    if (homeTab) {
      fireEvent.click(homeTab)
      expect(mockPush).toHaveBeenCalledWith('/es')
    }
  })

  it('navigates to correct route when Tablas tab is clicked', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath="/es" />
    )

    const tablasTab = screen.getByText('Tablas').closest('button')
    if (tablasTab) {
      fireEvent.click(tablasTab)
      expect(mockPush).toHaveBeenCalledWith(`/es/tournaments/${tournamentId}/results`)
    }
  })

  it('navigates to correct route when Reglas tab is clicked', () => {
    renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath="/es" />
    )

    const reglasTab = screen.getByText('Reglas').closest('button')
    if (reglasTab) {
      fireEvent.click(reglasTab)
      expect(mockPush).toHaveBeenCalledWith(`/es/tournaments/${tournamentId}/rules`)
    }
  })

  it('all icons have fontSize of 24', () => {
    const { container } = renderWithTheme(
      <TournamentBottomNav tournamentId={tournamentId} currentPath="/es" />
    )

    const icons = container.querySelectorAll('svg')
    icons.forEach(icon => {
      expect(icon).toHaveStyle({ fontSize: '24px' })
    })
  })
})

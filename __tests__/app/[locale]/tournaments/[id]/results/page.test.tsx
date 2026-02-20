import { vi, describe, it, expect, beforeEach } from 'vitest'
import ResultsPage from '@/app/[locale]/tournaments/[id]/results/page'
import * as gameRepository from '@/app/db/game-repository'
import * as tournamentPlayoffRepository from '@/app/db/tournament-playoff-repository'
import * as tournamentActions from '@/app/actions/tournament-actions'
import { getTranslations } from 'next-intl/server'

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
}))

// Mock game repository
vi.mock('@/app/db/game-repository', () => ({
  findGamesInTournament: vi.fn(),
}))

// Mock playoff repository
vi.mock('@/app/db/tournament-playoff-repository', () => ({
  findPlayoffStagesWithGamesInTournament: vi.fn(),
}))

// Mock tournament actions
vi.mock('@/app/actions/tournament-actions', () => ({
  getTeamsMap: vi.fn(),
  getGroupStandingsForTournament: vi.fn(),
}))

// Mock components
vi.mock('@/app/components/mui-wrappers', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Typography: ({ children, variant, ...props }: any) => {
    const Component = variant === 'h4' ? 'h1' : 'p'
    return <Component {...props}>{children}</Component>
  },
}))

vi.mock('@/app/components/results-page/results-page-client', () => ({
  default: () => <div data-testid="results-page-client">Results Client</div>,
}))

vi.mock('@/app/components/results-page/loading-skeleton', () => ({
  default: () => <div data-testid="loading-skeleton">Loading...</div>,
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    Suspense: ({ children, fallback }: any) => (
      <div data-testid="suspense">
        {children || fallback}
      </div>
    ),
  }
})

const mockGetTranslations = vi.mocked(getTranslations)
const mockFindGamesInTournament = vi.mocked(gameRepository.findGamesInTournament)
const mockFindPlayoffStages = vi.mocked(tournamentPlayoffRepository.findPlayoffStagesWithGamesInTournament)
const mockGetTeamsMap = vi.mocked(tournamentActions.getTeamsMap)
const mockGetGroupStandings = vi.mocked(tournamentActions.getGroupStandingsForTournament)

describe('ResultsPage i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('English translations', () => {
    it('should display English page title with translation', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Results & Tables',
          'results.unavailable': 'Results not available',
          'results.unavailableDescription': 'Results will be shown here when matches begin',
          'results.error': 'Error loading results',
          'results.errorDescription': 'Please try again later',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockResolvedValue([])
      mockGetTeamsMap.mockResolvedValue({})
      mockGetGroupStandings.mockResolvedValue({
        groups: [
          {
            id: 'group-a',
            group_letter: 'A',
            standings: [],
          },
        ],
        qualifiedTeams: [],
      })
      mockFindPlayoffStages.mockResolvedValue([])

      const params = Promise.resolve({ id: 'tournament-1' })
      const result = await ResultsPage({ params })

      expect(mockGetTranslations).toHaveBeenCalledWith('tables')
      expect(mockT).toHaveBeenCalledWith('results.title')
      expect(result).toBeDefined()

      // Verify the component was called with correct parameters
      expect(mockFindGamesInTournament).toHaveBeenCalledWith('tournament-1', false)
      expect(mockGetTeamsMap).toHaveBeenCalledWith('tournament-1', 'tournament')
      expect(mockGetGroupStandings).toHaveBeenCalledWith('tournament-1')
      expect(mockFindPlayoffStages).toHaveBeenCalledWith('tournament-1')
    })

    it('should translate "unavailable" state in English', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Results & Tables',
          'results.unavailable': 'Results not available',
          'results.unavailableDescription': 'Results will be shown here when matches begin',
          'results.error': 'Error loading results',
          'results.errorDescription': 'Please try again later',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockResolvedValue([])
      mockGetTeamsMap.mockResolvedValue({})
      mockGetGroupStandings.mockResolvedValue({
        groups: [],
        qualifiedTeams: [],
      })
      mockFindPlayoffStages.mockResolvedValue([])

      const params = Promise.resolve({ id: 'tournament-1' })
      await ResultsPage({ params })

      expect(mockT).toHaveBeenCalledWith('results.unavailable')
      expect(mockT).toHaveBeenCalledWith('results.unavailableDescription')
    })

    it('should translate error state in English', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Results & Tables',
          'results.unavailable': 'Results not available',
          'results.unavailableDescription': 'Results will be shown here when matches begin',
          'results.error': 'Error loading results',
          'results.errorDescription': 'Please try again later',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockRejectedValue(new Error('Database error'))

      const params = Promise.resolve({ id: 'tournament-1' })
      await ResultsPage({ params })

      expect(mockT).toHaveBeenCalledWith('results.error')
      expect(mockT).toHaveBeenCalledWith('results.errorDescription')
    })
  })

  describe('Spanish translations', () => {
    it('should display Spanish page title with translation', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Resultados y Tablas',
          'results.unavailable': 'Resultados no disponibles',
          'results.unavailableDescription': 'Los resultados se mostrarán aquí cuando los partidos comiencen',
          'results.error': 'Error al cargar resultados',
          'results.errorDescription': 'Por favor, intenta nuevamente más tarde',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockResolvedValue([])
      mockGetTeamsMap.mockResolvedValue({})
      mockGetGroupStandings.mockResolvedValue({
        groups: [
          {
            id: 'group-a',
            group_letter: 'A',
            standings: [],
          },
        ],
        qualifiedTeams: [],
      })
      mockFindPlayoffStages.mockResolvedValue([])

      const params = Promise.resolve({ id: 'tournament-1' })
      const result = await ResultsPage({ params })

      expect(mockGetTranslations).toHaveBeenCalledWith('tables')
      expect(mockT).toHaveBeenCalledWith('results.title')
      expect(result).toBeDefined()
    })

    it('should translate "unavailable" state in Spanish', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Resultados y Tablas',
          'results.unavailable': 'Resultados no disponibles',
          'results.unavailableDescription': 'Los resultados se mostrarán aquí cuando los partidos comiencen',
          'results.error': 'Error al cargar resultados',
          'results.errorDescription': 'Por favor, intenta nuevamente más tarde',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockResolvedValue([])
      mockGetTeamsMap.mockResolvedValue({})
      mockGetGroupStandings.mockResolvedValue({
        groups: [],
        qualifiedTeams: [],
      })
      mockFindPlayoffStages.mockResolvedValue([])

      const params = Promise.resolve({ id: 'tournament-1' })
      await ResultsPage({ params })

      expect(mockT).toHaveBeenCalledWith('results.unavailable')
      expect(mockT).toHaveBeenCalledWith('results.unavailableDescription')
    })

    it('should translate error state in Spanish', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Resultados y Tablas',
          'results.unavailable': 'Resultados no disponibles',
          'results.unavailableDescription': 'Los resultados se mostrarán aquí cuando los partidos comiencen',
          'results.error': 'Error al cargar resultados',
          'results.errorDescription': 'Por favor, intenta nuevamente más tarde',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockRejectedValue(new Error('Database error'))

      const params = Promise.resolve({ id: 'tournament-1' })
      await ResultsPage({ params })

      expect(mockT).toHaveBeenCalledWith('results.error')
      expect(mockT).toHaveBeenCalledWith('results.errorDescription')
    })
  })

  describe('Data loading and rendering', () => {
    it('should load games with draftResult=false for official results only', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Results & Tables',
          'results.unavailable': 'Results not available',
          'results.unavailableDescription': 'Results will be shown here when matches begin',
          'results.error': 'Error loading results',
          'results.errorDescription': 'Please try again later',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockResolvedValue([
        {
          id: 'game-1',
          group_a_id: 'team-1',
          group_b_id: 'team-2',
          result_a: 1,
          result_b: 0,
        },
      ])
      mockGetTeamsMap.mockResolvedValue({})
      mockGetGroupStandings.mockResolvedValue({
        groups: [
          {
            id: 'group-a',
            group_letter: 'A',
            standings: [],
          },
        ],
        qualifiedTeams: [],
      })
      mockFindPlayoffStages.mockResolvedValue([])

      const params = Promise.resolve({ id: 'tournament-1' })
      await ResultsPage({ params })

      // Verify draftResult=false parameter
      expect(mockFindGamesInTournament).toHaveBeenCalledWith('tournament-1', false)
    })

    it('should load data in parallel for performance', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Results & Tables',
          'results.unavailable': 'Results not available',
          'results.unavailableDescription': 'Results will be shown here when matches begin',
          'results.error': 'Error loading results',
          'results.errorDescription': 'Please try again later',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockResolvedValue([])
      mockGetTeamsMap.mockResolvedValue({})
      mockGetGroupStandings.mockResolvedValue({
        groups: [
          {
            id: 'group-a',
            group_letter: 'A',
            standings: [],
          },
        ],
        qualifiedTeams: [],
      })
      mockFindPlayoffStages.mockResolvedValue([])

      const params = Promise.resolve({ id: 'tournament-1' })
      await ResultsPage({ params })

      // All data loaders should be called
      expect(mockFindGamesInTournament).toHaveBeenCalled()
      expect(mockGetTeamsMap).toHaveBeenCalled()
      expect(mockGetGroupStandings).toHaveBeenCalled()
      expect(mockFindPlayoffStages).toHaveBeenCalled()
    })

    it('should show results when both groups and playoffs exist', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Results & Tables',
          'results.unavailable': 'Results not available',
          'results.unavailableDescription': 'Results will be shown here when matches begin',
          'results.error': 'Error loading results',
          'results.errorDescription': 'Please try again later',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockResolvedValue([
        {
          id: 'game-1',
          group_a_id: 'team-1',
          group_b_id: 'team-2',
          result_a: 1,
          result_b: 0,
        },
      ])
      mockGetTeamsMap.mockResolvedValue({
        'team-1': { id: 'team-1', name: 'Team A' },
        'team-2': { id: 'team-2', name: 'Team B' },
      })
      mockGetGroupStandings.mockResolvedValue({
        groups: [
          {
            id: 'group-a',
            group_letter: 'A',
            standings: [],
          },
        ],
        qualifiedTeams: [],
      })
      mockFindPlayoffStages.mockResolvedValue([
        {
          id: 'stage-1',
          name: 'Round of 16',
          games: [],
        },
      ])

      const params = Promise.resolve({ id: 'tournament-1' })
      const result = await ResultsPage({ params })

      expect(result).toBeDefined()
      expect(mockT).toHaveBeenCalledWith('results.title')
    })
  })

  describe('Error handling', () => {
    it('should handle errors gracefully and show error message', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Results & Tables',
          'results.unavailable': 'Results not available',
          'results.unavailableDescription': 'Results will be shown here when matches begin',
          'results.error': 'Error loading results',
          'results.errorDescription': 'Please try again later',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockRejectedValue(new Error('Database connection failed'))

      const params = Promise.resolve({ id: 'tournament-1' })
      const result = await ResultsPage({ params })

      expect(result).toBeDefined()
      // Verify error translation keys are used
      expect(mockT).toHaveBeenCalledWith('results.error')
      expect(mockT).toHaveBeenCalledWith('results.errorDescription')
    })

    it('should catch and log errors when data loading fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Results & Tables',
          'results.unavailable': 'Results not available',
          'results.unavailableDescription': 'Results will be shown here when matches begin',
          'results.error': 'Error loading results',
          'results.errorDescription': 'Please try again later',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockGetTeamsMap.mockRejectedValue(new Error('Teams API error'))

      const params = Promise.resolve({ id: 'tournament-1' })
      await ResultsPage({ params })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading results page:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Translation key coverage', () => {
    it('should use all required translation keys in error state', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Results & Tables',
          'results.unavailable': 'Results not available',
          'results.unavailableDescription': 'Results will be shown here when matches begin',
          'results.error': 'Error loading results',
          'results.errorDescription': 'Please try again later',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockRejectedValue(new Error('Test error'))

      const params = Promise.resolve({ id: 'tournament-1' })
      await ResultsPage({ params })

      // Verify error-related translation keys are used (when error occurs, title is not called)
      const requiredKeys = [
        'results.error',
        'results.errorDescription',
      ]

      requiredKeys.forEach(key => {
        expect(mockT).toHaveBeenCalledWith(key)
      })
    })

    it('should use all required translation keys for unavailable state', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'results.title': 'Results & Tables',
          'results.unavailable': 'Results not available',
          'results.unavailableDescription': 'Results will be shown here when matches begin',
          'results.error': 'Error loading results',
          'results.errorDescription': 'Please try again later',
        }
        return translations[key] || key
      })

      mockGetTranslations.mockResolvedValue(mockT as any)
      mockFindGamesInTournament.mockResolvedValue([])
      mockGetTeamsMap.mockResolvedValue({})
      mockGetGroupStandings.mockResolvedValue({
        groups: [],
        qualifiedTeams: [],
      })
      mockFindPlayoffStages.mockResolvedValue([])

      const params = Promise.resolve({ id: 'tournament-1' })
      await ResultsPage({ params })

      // Verify all unavailable state translation keys are used
      const requiredKeys = [
        'results.unavailable',
        'results.unavailableDescription',
      ]

      requiredKeys.forEach(key => {
        expect(mockT).toHaveBeenCalledWith(key)
      })
    })
  })
})

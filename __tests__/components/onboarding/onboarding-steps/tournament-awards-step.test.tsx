import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import TournamentAwardsStep from '@/app/components/onboarding/onboarding-steps/tournament-awards-step'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { createMockTranslations } from '@/__tests__/utils/mock-translations'
import * as intl from 'next-intl'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => 'es')
}))

// Mock TeamSelector
vi.mock('@/app/components/awards/team-selector', () => ({
  default: ({ label, onChange, name }: any) => (
    <div data-testid={`team-selector-${name}`}>
      <label>{label}</label>
      <button onClick={() => onChange('test-team-id')}>
        Select Team
      </button>
    </div>
  ),
}))

// Mock demo data
vi.mock('@/app/components/onboarding/demo/demo-data', () => ({
  DEMO_TEAMS: [
    { id: 'team-1', short_name: 'T1' },
    { id: 'team-2', short_name: 'T2' },
  ],
  DEMO_PLAYERS: [
    { id: '1', name: 'Player One', team_id: 'team-1', position: 'FW', age_at_tournament: 25 },
    { id: '2', name: 'Player Two', team_id: 'team-2', position: 'GK', age_at_tournament: 22 },
  ],
}))

describe('TournamentAwardsStep', () => {
  beforeEach(() => {
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('onboarding.steps.tournamentAwards')
    )
  })

  describe('Basic Rendering', () => {
    it('renders title', () => {
      renderWithTheme(<TournamentAwardsStep />)
      expect(screen.getByText('[title]')).toBeInTheDocument()
    })

    it('renders instructions', () => {
      renderWithTheme(<TournamentAwardsStep />)
      expect(screen.getByText('[instructions]')).toBeInTheDocument()
    })

    it('renders podium header', () => {
      renderWithTheme(<TournamentAwardsStep />)
      expect(screen.getByText('[podiumHeader]')).toBeInTheDocument()
    })

    it('renders individual awards header', () => {
      renderWithTheme(<TournamentAwardsStep />)
      expect(screen.getByText('[individualAwardsHeader]')).toBeInTheDocument()
    })

    it('renders info tip', () => {
      renderWithTheme(<TournamentAwardsStep />)
      expect(screen.getByText('[infoTip]')).toBeInTheDocument()
    })
  })

  describe('Team Selectors', () => {
    it('renders champion team selector', () => {
      renderWithTheme(<TournamentAwardsStep />)
      expect(screen.getByTestId('team-selector-champion')).toBeInTheDocument()
    })

    it('renders runner-up team selector', () => {
      renderWithTheme(<TournamentAwardsStep />)
      expect(screen.getByTestId('team-selector-runnerUp')).toBeInTheDocument()
    })

    it('renders third place team selector', () => {
      renderWithTheme(<TournamentAwardsStep />)
      expect(screen.getByTestId('team-selector-thirdPlace')).toBeInTheDocument()
    })

    it('displays champion label', () => {
      renderWithTheme(<TournamentAwardsStep />)
      expect(screen.getByText('[champion.label]')).toBeInTheDocument()
    })

    it('displays runner-up label', () => {
      renderWithTheme(<TournamentAwardsStep />)
      expect(screen.getByText('[runnerUp.label]')).toBeInTheDocument()
    })

    it('displays third place label', () => {
      renderWithTheme(<TournamentAwardsStep />)
      expect(screen.getByText('[thirdPlace.label]')).toBeInTheDocument()
    })
  })

  describe('Player Awards Autocompletes', () => {
    it('renders best player autocomplete', () => {
      renderWithTheme(<TournamentAwardsStep />)
      const labels = screen.getAllByText('[bestPlayer.label]')
      expect(labels.length).toBeGreaterThan(0)
    })

    it('renders top scorer autocomplete', () => {
      renderWithTheme(<TournamentAwardsStep />)
      const labels = screen.getAllByText('[topScorer.label]')
      expect(labels.length).toBeGreaterThan(0)
    })

    it('renders best goalkeeper autocomplete', () => {
      renderWithTheme(<TournamentAwardsStep />)
      const labels = screen.getAllByText('[bestGoalkeeper.label]')
      expect(labels.length).toBeGreaterThan(0)
    })

    it('renders best young player autocomplete', () => {
      renderWithTheme(<TournamentAwardsStep />)
      const labels = screen.getAllByText('[bestYoungPlayer.label]')
      expect(labels.length).toBeGreaterThan(0)
    })
  })

  describe('Success Alerts', () => {
    it('shows team success alert when team is selected', async () => {
      renderWithTheme(<TournamentAwardsStep />)

      const selectButton = screen.getAllByText('Select Team')[0]
      fireEvent.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText('[podiumSuccessAlert]')).toBeInTheDocument()
      })
    })

    it('can close team success alert', async () => {
      renderWithTheme(<TournamentAwardsStep />)

      const selectButton = screen.getAllByText('Select Team')[0]
      fireEvent.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText('[podiumSuccessAlert]')).toBeInTheDocument()
      })

      // Find and click close button on the alert
      const alert = screen.getByText('[podiumSuccessAlert]').closest('.MuiAlert-root')
      const closeButton = alert?.querySelector('button')
      if (closeButton) {
        fireEvent.click(closeButton)
      }

      await waitFor(() => {
        expect(screen.queryByText('[podiumSuccessAlert]')).not.toBeInTheDocument()
      })
    })

    it('does not show duplicate team success alert', async () => {
      renderWithTheme(<TournamentAwardsStep />)

      const selectButtons = screen.getAllByText('Select Team')

      // First selection shows alert
      fireEvent.click(selectButtons[0])
      await waitFor(() => {
        expect(screen.getByText('[podiumSuccessAlert]')).toBeInTheDocument()
      })

      // Second selection while alert is visible should not show duplicate
      fireEvent.click(selectButtons[1])

      // Should still only have one alert
      const alerts = screen.queryAllByText('[podiumSuccessAlert]')
      expect(alerts).toHaveLength(1)
    })
  })

  describe('Layout', () => {
    it('renders within paper container', () => {
      const { container } = renderWithTheme(<TournamentAwardsStep />)
      expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument()
    })

    it('has divider between sections', () => {
      const { container } = renderWithTheme(<TournamentAwardsStep />)
      expect(container.querySelector('.MuiDivider-root')).toBeInTheDocument()
    })
  })

  describe('State Management', () => {
    it('handles champion selection', async () => {
      renderWithTheme(<TournamentAwardsStep />)

      const championSelector = screen.getByTestId('team-selector-champion')
      const selectButton = championSelector.querySelector('button')

      if (selectButton) {
        fireEvent.click(selectButton)
      }

      await waitFor(() => {
        expect(screen.getByText('[podiumSuccessAlert]')).toBeInTheDocument()
      })
    })

    it('handles runner-up selection', async () => {
      renderWithTheme(<TournamentAwardsStep />)

      const runnerUpSelector = screen.getByTestId('team-selector-runnerUp')
      const selectButton = runnerUpSelector.querySelector('button')

      if (selectButton) {
        fireEvent.click(selectButton)
      }

      await waitFor(() => {
        expect(screen.getByText('[podiumSuccessAlert]')).toBeInTheDocument()
      })
    })

    it('handles third place selection', async () => {
      renderWithTheme(<TournamentAwardsStep />)

      const thirdPlaceSelector = screen.getByTestId('team-selector-thirdPlace')
      const selectButton = thirdPlaceSelector.querySelector('button')

      if (selectButton) {
        fireEvent.click(selectButton)
      }

      await waitFor(() => {
        expect(screen.getByText('[podiumSuccessAlert]')).toBeInTheDocument()
      })
    })
  })
})

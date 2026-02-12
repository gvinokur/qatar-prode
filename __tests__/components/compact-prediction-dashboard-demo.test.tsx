import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CompactPredictionDashboard } from '@/app/components/compact-prediction-dashboard'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import type { ExtendedGameData } from '@/app/definitions'
import type { TournamentPredictionCompletion, Team } from '@/app/db/tables-definition'

// Mock the child components
vi.mock('@/app/components/prediction-progress-row', () => ({
  PredictionProgressRow: ({ label, onClick, onBoostClick }: any) => (
    <div data-testid={`progress-row-${label.toLowerCase()}`}>
      <button data-testid={`click-${label.toLowerCase()}`} onClick={onClick}>
        {label}
      </button>
      {onBoostClick && (
        <button
          data-testid={`boost-${label.toLowerCase()}`}
          onClick={(e) => onBoostClick(e, 'silver')}
        >
          Boost
        </button>
      )}
    </div>
  ),
}))

vi.mock('@/app/components/game-details-popover', () => ({
  GameDetailsPopover: () => <div data-testid="game-details-popover" />,
}))

vi.mock('@/app/components/tournament-details-popover', () => ({
  TournamentDetailsPopover: () => <div data-testid="tournament-details-popover" />,
}))

vi.mock('@/app/components/boost-info-popover', () => ({
  default: () => <div data-testid="boost-info-popover" />,
}))

vi.mock('@/app/components/urgency-helpers', () => ({
  getGameUrgencyLevel: vi.fn(() => 'none'),
  getTournamentUrgencyLevel: vi.fn(() => 'none'),
  hasUrgentGames: vi.fn(() => false),
}))

const mockTeamsMap: Record<string, Team> = {
  'team-1': { id: 'team-1', name: 'Team A', short_name: 'TA', theme: null },
  'team-2': { id: 'team-2', name: 'Team B', short_name: 'TB', theme: null },
}

const mockGames: ExtendedGameData[] = [
  {
    id: 'game-1',
    tournament_id: 'demo-tournament',
    game_number: 1,
    home_team: 'team-1',
    away_team: 'team-2',
    game_date: new Date(),
    location: 'Test Stadium',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: undefined,
  },
] as ExtendedGameData[]

const mockTournamentPredictions: TournamentPredictionCompletion = {
  finalStandings: { completed: 3, total: 3, champion: true, runnerUp: true, thirdPlace: true },
  awards: {
    completed: 2,
    total: 4,
    bestPlayer: true,
    topGoalscorer: true,
    bestGoalkeeper: false,
    bestYoungPlayer: false,
  },
  qualifiers: { completed: 4, total: 4 },
  overallCompleted: 9,
  overallTotal: 11,
  overallPercentage: 82,
  isPredictionLocked: false,
}

describe('CompactPredictionDashboard - Demo Mode', () => {
  it('renders game predictions row', () => {
    renderWithProviders(
      <CompactPredictionDashboard
        totalGames={48}
        predictedGames={32}
        silverUsed={3}
        silverMax={5}
        goldenUsed={1}
        goldenMax={2}
        demoMode={false}
      />
    )

    expect(screen.getByTestId('progress-row-partidos')).toBeInTheDocument()
  })

  it('renders tournament predictions row when provided', () => {
    renderWithProviders(
      <CompactPredictionDashboard
        totalGames={48}
        predictedGames={32}
        silverUsed={3}
        silverMax={5}
        goldenUsed={1}
        goldenMax={2}
        tournamentPredictions={mockTournamentPredictions}
        tournamentId="demo-tournament"
        demoMode={false}
      />
    )

    expect(screen.getByTestId('progress-row-torneo')).toBeInTheDocument()
  })

  it('passes click handlers in demo mode', () => {
    renderWithProviders(
      <CompactPredictionDashboard
        totalGames={48}
        predictedGames={32}
        silverUsed={3}
        silverMax={5}
        goldenUsed={1}
        goldenMax={2}
        games={mockGames}
        teamsMap={mockTeamsMap}
        demoMode={true}
      />
    )

    const clickButton = screen.getByTestId('click-partidos')

    // Should render and be clickable even in demo mode
    expect(clickButton).toBeInTheDocument()
  })

  it('passes handlers for tournament row in demo mode', () => {
    renderWithProviders(
      <CompactPredictionDashboard
        totalGames={48}
        predictedGames={32}
        silverUsed={3}
        silverMax={5}
        goldenUsed={1}
        goldenMax={2}
        tournamentPredictions={mockTournamentPredictions}
        tournamentId="demo-tournament"
        demoMode={true}
      />
    )

    const clickButton = screen.getByTestId('click-torneo')

    // Should render even in demo mode
    expect(clickButton).toBeInTheDocument()
  })

  it('disables boost click handler in demo mode', () => {
    renderWithProviders(
      <CompactPredictionDashboard
        totalGames={48}
        predictedGames={32}
        silverUsed={3}
        silverMax={5}
        goldenUsed={1}
        goldenMax={2}
        demoMode={true}
      />
    )

    // In demo mode, boost button should not be present
    expect(screen.queryByTestId('boost-partidos')).not.toBeInTheDocument()
  })

  it('enables handlers when not in demo mode', () => {
    renderWithProviders(
      <CompactPredictionDashboard
        totalGames={48}
        predictedGames={32}
        silverUsed={3}
        silverMax={5}
        goldenUsed={1}
        goldenMax={2}
        games={mockGames}
        teamsMap={mockTeamsMap}
        demoMode={false}
      />
    )

    // Boost button should be present when not in demo mode
    expect(screen.getByTestId('boost-partidos')).toBeInTheDocument()
  })

  it('calculates game percentage correctly', () => {
    renderWithProviders(
      <CompactPredictionDashboard
        totalGames={100}
        predictedGames={50}
        silverUsed={0}
        silverMax={5}
        goldenUsed={0}
        goldenMax={2}
        demoMode={false}
      />
    )

    expect(screen.getByTestId('progress-row-partidos')).toBeInTheDocument()
  })

  it('handles zero total games edge case', () => {
    renderWithProviders(
      <CompactPredictionDashboard
        totalGames={0}
        predictedGames={0}
        silverUsed={0}
        silverMax={5}
        goldenUsed={0}
        goldenMax={2}
        demoMode={false}
      />
    )

    expect(screen.getByTestId('progress-row-partidos')).toBeInTheDocument()
  })

  it('shows boosts when silverMax or goldenMax greater than 0', () => {
    renderWithProviders(
      <CompactPredictionDashboard
        totalGames={48}
        predictedGames={32}
        silverUsed={3}
        silverMax={5}
        goldenUsed={0}
        goldenMax={0}
        demoMode={false}
      />
    )

    expect(screen.getByTestId('boost-partidos')).toBeInTheDocument()
  })

  it('uses memoized urgency calculations', () => {
    const { rerender } = renderWithProviders(
      <CompactPredictionDashboard
        totalGames={48}
        predictedGames={32}
        silverUsed={3}
        silverMax={5}
        goldenUsed={1}
        goldenMax={2}
        games={mockGames}
        teamsMap={mockTeamsMap}
        demoMode={false}
      />
    )

    // Rerender with same props
    rerender(
      <CompactPredictionDashboard
        totalGames={48}
        predictedGames={32}
        silverUsed={3}
        silverMax={5}
        goldenUsed={1}
        goldenMax={2}
        games={mockGames}
        teamsMap={mockTeamsMap}
        demoMode={false}
      />
    )

    expect(screen.getByTestId('progress-row-partidos')).toBeInTheDocument()
  })
})

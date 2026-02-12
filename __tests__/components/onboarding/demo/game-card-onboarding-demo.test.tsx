import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GameCardOnboardingDemo from '@/app/components/onboarding/demo/game-card-onboarding-demo'
import { MockGuessesContextProvider } from '@/app/components/onboarding/demo/onboarding-demo-context'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import type { Game, Team } from '@/app/db/tables-definition'

// Mock FlippableGameCard
vi.mock('@/app/components/flippable-game-card', () => ({
  default: ({ game, homeScore, awayScore, homePenaltyWinner, awayPenaltyWinner, boostType }: any) => (
    <div data-testid="flippable-game-card">
      <div data-testid="game-id">{game.id}</div>
      <div data-testid="home-score">{homeScore}</div>
      <div data-testid="away-score">{awayScore}</div>
      <div data-testid="home-penalty">{String(homePenaltyWinner)}</div>
      <div data-testid="away-penalty">{String(awayPenaltyWinner)}</div>
      <div data-testid="boost-type">{boostType}</div>
    </div>
  ),
}))

const mockGame: Game = {
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
}

const mockTeamsMap: Record<string, Team> = {
  'team-1': { id: 'team-1', name: 'Team A', short_name: 'TA', theme: null },
  'team-2': { id: 'team-2', name: 'Team B', short_name: 'TB', theme: null },
}

describe('GameCardOnboardingDemo', () => {
  it('renders game type label', () => {
    renderWithTheme(
      <MockGuessesContextProvider>
        <GameCardOnboardingDemo
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPlayoffs={false}
          isEditing={false}
          onEditStart={vi.fn()}
          onEditEnd={vi.fn()}
          silverUsed={1}
          silverMax={5}
          goldenUsed={0}
          goldenMax={2}
          label="Partido de Grupo"
        />
      </MockGuessesContextProvider>
    )

    expect(screen.getByText('Partido de Grupo')).toBeInTheDocument()
  })

  it('renders playoff label with correct color', () => {
    renderWithTheme(
      <MockGuessesContextProvider>
        <GameCardOnboardingDemo
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPlayoffs={true}
          isEditing={false}
          onEditStart={vi.fn()}
          onEditEnd={vi.fn()}
          silverUsed={0}
          silverMax={5}
          goldenUsed={0}
          goldenMax={2}
          label="Partido de Playoff"
        />
      </MockGuessesContextProvider>
    )

    expect(screen.getByText('Partido de Playoff')).toBeInTheDocument()
  })

  it('renders demo note when provided', () => {
    renderWithTheme(
      <MockGuessesContextProvider>
        <GameCardOnboardingDemo
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPlayoffs={true}
          isEditing={false}
          onEditStart={vi.fn()}
          onEditEnd={vi.fn()}
          silverUsed={0}
          silverMax={5}
          goldenUsed={0}
          goldenMax={2}
          label="Partido de Playoff"
          demoNote="En empate, selecciona el ganador por penales"
        />
      </MockGuessesContextProvider>
    )

    expect(screen.getByText('En empate, selecciona el ganador por penales')).toBeInTheDocument()
  })

  it('passes guess values from context to FlippableGameCard', () => {
    renderWithTheme(
      <MockGuessesContextProvider>
        <GameCardOnboardingDemo
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPlayoffs={false}
          isEditing={false}
          onEditStart={vi.fn()}
          onEditEnd={vi.fn()}
          silverUsed={1}
          silverMax={5}
          goldenUsed={0}
          goldenMax={2}
          label="Partido de Grupo"
        />
      </MockGuessesContextProvider>
    )

    expect(screen.getByTestId('flippable-game-card')).toBeInTheDocument()
    expect(screen.getByTestId('game-id')).toHaveTextContent('game-1')
  })

  it('renders FlippableGameCard with all required props', () => {
    renderWithTheme(
      <MockGuessesContextProvider>
        <GameCardOnboardingDemo
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPlayoffs={false}
          isEditing={true}
          onEditStart={vi.fn()}
          onEditEnd={vi.fn()}
          silverUsed={2}
          silverMax={5}
          goldenUsed={1}
          goldenMax={2}
          label="Test Label"
        />
      </MockGuessesContextProvider>
    )

    expect(screen.getByTestId('flippable-game-card')).toBeInTheDocument()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GamesPredictionWidget } from '../games-prediction-widget'
import type { ActionCenterData } from '@/app/actions/hub-actions'
import type { ScoringRulesBySection } from '@/app/utils/scoring-rules-utils'

vi.mock('../games-info-widget', () => ({
  GamesInfoWidget: () => <div data-testid="games-info-widget" />,
}))

vi.mock('../games-active-widget', () => ({
  GamesActiveWidget: () => <div data-testid="games-active-widget" />,
}))

const defaultScoringRules: ScoringRulesBySection = {
  matches: ['1 point — correct winner/draw'],
  qualifiedTeams: ['qt-rule'],
  awards: ['awards-rule'],
}

const makeActionCenterData = (overrides: Partial<ActionCenterData> = {}): ActionCenterData => ({
  games: [],
  gameGuesses: {},
  teamsMap: {},
  tournamentMaxSilver: 0,
  tournamentMaxGolden: 0,
  mode: 'empty',
  qtAndAwardsOpen: false,
  msUntilPredictionLock: 0,
  tournamentFinished: false,
  firstGameDate: null,
  tournamentHasStarted: false,
  tournamentName: null,
  openerBackfill: false,
  totalGames: 64,
  predictedGames: 0,
  silverBoostsUsed: 0,
  goldenBoostsUsed: 0,
  awardsCompleted: 0,
  awardsTotal: 7,
  qualifiersCompleted: 0,
  qualifiersTotal: 32,
  tournamentJustStarted: false,
  scoringConfig: {
    game_exact_score_points: 2,
    game_correct_outcome_points: 1,
    champion_points: 5,
    runner_up_points: 3,
    third_place_points: 1,
    individual_award_points: 3,
    qualified_team_points: 1,
    exact_position_qualified_points: 2,
    max_silver_games: 0,
    max_golden_games: 0,
  },
  ...overrides,
})

const baseProps = {
  tournamentId: 't-1',
  scoringRules: defaultScoringRules,
  totalGames: 64,
  isStarted: false,
  isNearStart: false,
  isFinished: false,
  gamesHref: '/en/tournaments/t-1/games',
}

describe('GamesPredictionWidget', () => {
  it('renders null when isFinished=true', () => {
    const { container } = render(
      <GamesPredictionWidget
        {...baseProps}
        isFinished={true}
        actionCenterData={makeActionCenterData()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders GamesInfoWidget (logged-off) when actionCenterData=null regardless of isNearStart', () => {
    render(
      <GamesPredictionWidget
        {...baseProps}
        isNearStart={true}
        actionCenterData={null}
      />
    )
    expect(screen.getByTestId('games-info-widget')).toBeInTheDocument()
    expect(screen.queryByTestId('games-active-widget')).not.toBeInTheDocument()
  })

  it('renders GamesInfoWidget when isNearStart=false and isStarted=false (far pre-tournament)', () => {
    render(
      <GamesPredictionWidget
        {...baseProps}
        isNearStart={false}
        actionCenterData={makeActionCenterData()}
      />
    )
    expect(screen.getByTestId('games-info-widget')).toBeInTheDocument()
    expect(screen.queryByTestId('games-active-widget')).not.toBeInTheDocument()
  })

  it('renders GamesActiveWidget when isNearStart=true and isStarted=false (48h window)', () => {
    render(
      <GamesPredictionWidget
        {...baseProps}
        isNearStart={true}
        isStarted={false}
        actionCenterData={makeActionCenterData()}
      />
    )
    expect(screen.getByTestId('games-active-widget')).toBeInTheDocument()
    expect(screen.queryByTestId('games-info-widget')).not.toBeInTheDocument()
  })

  it('renders GamesActiveWidget when isNearStart=true and isStarted=true (tournament started)', () => {
    render(
      <GamesPredictionWidget
        {...baseProps}
        isNearStart={true}
        isStarted={true}
        actionCenterData={makeActionCenterData({ tournamentHasStarted: true })}
      />
    )
    expect(screen.getByTestId('games-active-widget')).toBeInTheDocument()
    expect(screen.queryByTestId('games-info-widget')).not.toBeInTheDocument()
  })
})

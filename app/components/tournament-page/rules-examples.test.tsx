import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import WinnerDrawExample from './rules-examples/winner-draw'
import ExactScoreExample from './rules-examples/exact-score'
import RoundOf16Example from './rules-examples/round-of-16'
import ChampionExample from './rules-examples/champion'
import RunnerUpExample from './rules-examples/runner-up'
import ThirdPlaceExample from './rules-examples/third-place'
import IndividualAwardsExample from './rules-examples/individual-awards'
import MatchPredictionTimeExample from './rules-examples/match-prediction-time'
import PodiumPredictionTimeExample from './rules-examples/podium-prediction-time'
import SinglePredictionExample from './rules-examples/single-prediction'
import GroupPositionExample from './rules-examples/group-position'
import QualifiedTeamsPredictionTimeExample from './rules-examples/qualified-teams-prediction-time'

describe('Rules Examples Components', () => {
  describe('Spanish translations', () => {
    it('renders WinnerDrawExample in Spanish with points', () => {
      renderWithProviders(<WinnerDrawExample points={1} />)
      expect(screen.getByText(/Si predices que Argentina ganará contra Brasil/i)).toBeInTheDocument()
      expect(screen.getByText(/1 punto/i)).toBeInTheDocument()
    })

    it('renders ExactScoreExample in Spanish with point values', () => {
      renderWithProviders(<ExactScoreExample total={2} correctOutcome={1} bonus={1} />)
      expect(screen.getByText(/Si predices que Argentina ganará 2-1/i)).toBeInTheDocument()
      expect(screen.getByText(/2 puntos/i)).toBeInTheDocument()
    })

    it('renders RoundOf16Example in Spanish with points', () => {
      renderWithProviders(<RoundOf16Example points={1} />)
      expect(screen.getByText(/Si predices que Argentina clasificará a dieciseisavos/i)).toBeInTheDocument()
      expect(screen.getByText(/1 punto/i)).toBeInTheDocument()
    })

    it('renders GroupPositionExample in Spanish with points', () => {
      renderWithProviders(<GroupPositionExample qualifiedPoints={1} exactPositionPoints={2} totalPoints={3} />)
      expect(screen.getByText(/Si predices que Argentina clasificará primero del Grupo A/i)).toBeInTheDocument()
      expect(screen.getByText(/3 puntos/i)).toBeInTheDocument()
    })

    it('renders ChampionExample in Spanish with points', () => {
      renderWithProviders(<ChampionExample points={5} />)
      expect(screen.getByText(/Si predices que Argentina será campeón/i)).toBeInTheDocument()
      expect(screen.getByText(/5 puntos/i)).toBeInTheDocument()
    })

    it('renders RunnerUpExample in Spanish with points', () => {
      renderWithProviders(<RunnerUpExample points={3} />)
      expect(screen.getByText(/Si predices que Brasil será subcampeón/i)).toBeInTheDocument()
      expect(screen.getByText(/3 puntos/i)).toBeInTheDocument()
    })

    it('renders ThirdPlaceExample in Spanish with points', () => {
      renderWithProviders(<ThirdPlaceExample points={1} />)
      expect(screen.getByText(/Si predices que Francia será tercero/i)).toBeInTheDocument()
      expect(screen.getByText(/1 punto/i)).toBeInTheDocument()
    })

    it('renders IndividualAwardsExample in Spanish with points', () => {
      renderWithProviders(<IndividualAwardsExample points={3} />)
      expect(screen.getByText(/Si predices que Lionel Messi ganará/i)).toBeInTheDocument()
      expect(screen.getByText(/3 puntos/i)).toBeInTheDocument()
    })

    it('renders MatchPredictionTimeExample in Spanish', () => {
      renderWithProviders(<MatchPredictionTimeExample />)
      expect(screen.getByText(/Si un partido comienza a las 15:00/i)).toBeInTheDocument()
    })

    it('renders PodiumPredictionTimeExample in Spanish', () => {
      renderWithProviders(<PodiumPredictionTimeExample />)
      expect(screen.getByText(/Si el torneo comienza el 1 de junio/i)).toBeInTheDocument()
    })

    it('renders SinglePredictionExample in Spanish', () => {
      renderWithProviders(<SinglePredictionExample />)
      expect(screen.getByText(/Solo puedes tener un pronostico activo/i)).toBeInTheDocument()
    })

    it('renders QualifiedTeamsPredictionTimeExample in Spanish', () => {
      renderWithProviders(<QualifiedTeamsPredictionTimeExample />)
      expect(screen.getByText(/Si el torneo comienza el 1 de junio, puedes modificar tus pronósticos de equipos clasificados hasta el 3 de junio/i)).toBeInTheDocument()
    })
  })

  describe('English translations', () => {
    it('renders WinnerDrawExample in English with points', () => {
      renderWithProviders(<WinnerDrawExample points={1} />, { locale: 'en' })
      expect(screen.getByText(/Example: If you predict Argentina will beat/i)).toBeInTheDocument()
      expect(screen.getByText(/you get 1 point/i)).toBeInTheDocument()
    })

    it('renders ExactScoreExample in English with point values', () => {
      renderWithProviders(<ExactScoreExample total={2} correctOutcome={1} bonus={1} />, { locale: 'en' })
      expect(screen.getByText(/Example: If you predict Argentina will win 2-1/i)).toBeInTheDocument()
      expect(screen.getByText(/you get 2 points/i)).toBeInTheDocument()
    })

    it('renders RoundOf16Example in English with points', () => {
      renderWithProviders(<RoundOf16Example points={1} />, { locale: 'en' })
      expect(screen.getByText(/Example: If you predict Argentina will qualify for the Round of 32/i)).toBeInTheDocument()
      expect(screen.getByText(/you get 1 point/i)).toBeInTheDocument()
    })

    it('renders GroupPositionExample in English with points', () => {
      renderWithProviders(<GroupPositionExample qualifiedPoints={1} exactPositionPoints={2} totalPoints={3} />, { locale: 'en' })
      expect(screen.getByText(/Example: If you predict Argentina will finish first in Group A/i)).toBeInTheDocument()
      expect(screen.getByText(/you get 3 additional points/i)).toBeInTheDocument()
    })

    it('renders ChampionExample in English with points', () => {
      renderWithProviders(<ChampionExample points={5} />, { locale: 'en' })
      expect(screen.getByText(/Example: If you predict Argentina will be champion/i)).toBeInTheDocument()
      expect(screen.getByText(/you get 5 points/i)).toBeInTheDocument()
    })

    it('renders RunnerUpExample in English with points', () => {
      renderWithProviders(<RunnerUpExample points={3} />, { locale: 'en' })
      expect(screen.getByText(/Example: If you predict Brazil will be runner-up/i)).toBeInTheDocument()
      expect(screen.getByText(/you get 3 points/i)).toBeInTheDocument()
    })

    it('renders ThirdPlaceExample in English with points', () => {
      renderWithProviders(<ThirdPlaceExample points={1} />, { locale: 'en' })
      expect(screen.getByText(/Example: If you predict France will be third/i)).toBeInTheDocument()
      expect(screen.getByText(/you get 1 point/i)).toBeInTheDocument()
    })

    it('renders IndividualAwardsExample in English with points', () => {
      renderWithProviders(<IndividualAwardsExample points={3} />, { locale: 'en' })
      expect(screen.getByText(/Example: If you predict Lionel Messi will win/i)).toBeInTheDocument()
      expect(screen.getByText(/you get 3 points/i)).toBeInTheDocument()
    })

    it('renders MatchPredictionTimeExample in English', () => {
      renderWithProviders(<MatchPredictionTimeExample />, { locale: 'en' })
      expect(screen.getByText(/Example: If a match starts at 3:00 PM/i)).toBeInTheDocument()
    })

    it('renders PodiumPredictionTimeExample in English', () => {
      renderWithProviders(<PodiumPredictionTimeExample />, { locale: 'en' })
      expect(screen.getByText(/Example: If the tournament starts on June 1st/i)).toBeInTheDocument()
    })

    it('renders SinglePredictionExample in English', () => {
      renderWithProviders(<SinglePredictionExample />, { locale: 'en' })
      expect(screen.getByText(/Example: You can only have one active prediction/i)).toBeInTheDocument()
    })

    it('renders QualifiedTeamsPredictionTimeExample in English', () => {
      renderWithProviders(<QualifiedTeamsPredictionTimeExample />, { locale: 'en' })
      expect(screen.getByText(/Example: If the tournament starts on June 1st, you can modify your qualified teams predictions until June 3rd/i)).toBeInTheDocument()
    })
  })

  // Pluralization tests for parameterized examples
  describe('Parameterized Examples Pluralization', () => {
    it('uses singular "punto" when points is 1', () => {
      renderWithProviders(<WinnerDrawExample points={1} />)
      expect(screen.getByText(/obtienes 1 punto/i)).toBeInTheDocument()
    })

    it('uses plural "puntos" when points is greater than 1', () => {
      renderWithProviders(<ChampionExample points={5} />)
      expect(screen.getByText(/obtienes 5 puntos/i)).toBeInTheDocument()
    })

    it('correctly handles ExactScoreExample with different point values', () => {
      renderWithProviders(<ExactScoreExample total={5} correctOutcome={2} bonus={3} />)
      expect(screen.getByText(/obtienes 5 puntos.*2 por el ganador.*3 extra por el resultado exacto/i)).toBeInTheDocument()
    })

    it('correctly handles GroupPositionExample with different point values', () => {
      renderWithProviders(<GroupPositionExample qualifiedPoints={2} exactPositionPoints={3} totalPoints={5} />)
      expect(screen.getByText(/obtienes 5 puntos adicionales.*2 por clasificar.*3 por posición exacta.*5 puntos totales/i)).toBeInTheDocument()
    })

    it('uses singular when ExactScoreExample has 1 bonus point', () => {
      renderWithProviders(<ExactScoreExample total={2} correctOutcome={1} bonus={1} />)
      expect(screen.getByText(/obtienes 2 puntos.*1 por el ganador.*1 extra por el resultado exacto/i)).toBeInTheDocument()
    })
  })
})

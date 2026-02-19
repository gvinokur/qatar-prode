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

describe('Rules Examples Components', () => {
  describe('Spanish translations', () => {
    it('renders WinnerDrawExample in Spanish', () => {
      renderWithProviders(<WinnerDrawExample />)
      expect(screen.getByText(/Si predices que Argentina ganará contra Brasil/i)).toBeInTheDocument()
    })

    it('renders ExactScoreExample in Spanish', () => {
      renderWithProviders(<ExactScoreExample />)
      expect(screen.getByText(/Si predices que Argentina ganará 2-1/i)).toBeInTheDocument()
    })

    it('renders RoundOf16Example in Spanish', () => {
      renderWithProviders(<RoundOf16Example />)
      expect(screen.getByText(/Si predices que Argentina clasificará a octavos/i)).toBeInTheDocument()
    })

    it('renders GroupPositionExample in Spanish', () => {
      renderWithProviders(<GroupPositionExample />)
      expect(screen.getByText(/Si predices que Argentina clasificará primero del Grupo A/i)).toBeInTheDocument()
    })

    it('renders ChampionExample in Spanish', () => {
      renderWithProviders(<ChampionExample />)
      expect(screen.getByText(/Si predices que Argentina será campeón/i)).toBeInTheDocument()
    })

    it('renders RunnerUpExample in Spanish', () => {
      renderWithProviders(<RunnerUpExample />)
      expect(screen.getByText(/Si predices que Brasil será subcampeón/i)).toBeInTheDocument()
    })

    it('renders ThirdPlaceExample in Spanish', () => {
      renderWithProviders(<ThirdPlaceExample />)
      expect(screen.getByText(/Si predices que Francia será tercero/i)).toBeInTheDocument()
    })

    it('renders IndividualAwardsExample in Spanish', () => {
      renderWithProviders(<IndividualAwardsExample />)
      expect(screen.getByText(/Si predices que Lionel Messi ganará/i)).toBeInTheDocument()
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
  })

  describe('English translations (EnOf pattern)', () => {
    it('renders WinnerDrawExample in English', () => {
      renderWithProviders(<WinnerDrawExample />, { locale: 'en' })
      expect(screen.getByText(/EnOf\(Ejemplo: Si predices que Argentina ganará/i)).toBeInTheDocument()
    })

    it('renders ExactScoreExample in English', () => {
      renderWithProviders(<ExactScoreExample />, { locale: 'en' })
      expect(screen.getByText(/EnOf\(Ejemplo: Si predices que Argentina ganará 2-1/i)).toBeInTheDocument()
    })

    it('renders RoundOf16Example in English', () => {
      renderWithProviders(<RoundOf16Example />, { locale: 'en' })
      expect(screen.getByText(/EnOf\(Ejemplo: Si predices que Argentina clasificará a octavos/i)).toBeInTheDocument()
    })

    it('renders GroupPositionExample in English', () => {
      renderWithProviders(<GroupPositionExample />, { locale: 'en' })
      expect(screen.getByText(/EnOf\(Ejemplo: Si predices que Argentina clasificará primero/i)).toBeInTheDocument()
    })

    it('renders ChampionExample in English', () => {
      renderWithProviders(<ChampionExample />, { locale: 'en' })
      expect(screen.getByText(/EnOf\(Ejemplo: Si predices que Argentina será campeón/i)).toBeInTheDocument()
    })

    it('renders RunnerUpExample in English', () => {
      renderWithProviders(<RunnerUpExample />, { locale: 'en' })
      expect(screen.getByText(/EnOf\(Ejemplo: Si predices que Brasil será subcampeón/i)).toBeInTheDocument()
    })

    it('renders ThirdPlaceExample in English', () => {
      renderWithProviders(<ThirdPlaceExample />, { locale: 'en' })
      expect(screen.getByText(/EnOf\(Ejemplo: Si predices que Francia será tercero/i)).toBeInTheDocument()
    })

    it('renders IndividualAwardsExample in English', () => {
      renderWithProviders(<IndividualAwardsExample />, { locale: 'en' })
      expect(screen.getByText(/EnOf\(Ejemplo: Si predices que Lionel Messi ganará/i)).toBeInTheDocument()
    })

    it('renders MatchPredictionTimeExample in English', () => {
      renderWithProviders(<MatchPredictionTimeExample />, { locale: 'en' })
      expect(screen.getByText(/EnOf\(Ejemplo: Si un partido comienza a las 15:00/i)).toBeInTheDocument()
    })

    it('renders PodiumPredictionTimeExample in English', () => {
      renderWithProviders(<PodiumPredictionTimeExample />, { locale: 'en' })
      expect(screen.getByText(/EnOf\(Ejemplo: Si el torneo comienza el 1 de junio/i)).toBeInTheDocument()
    })

    it('renders SinglePredictionExample in English', () => {
      renderWithProviders(<SinglePredictionExample />, { locale: 'en' })
      expect(screen.getByText(/EnOf\(Ejemplo: Solo puedes tener un pronostico activo/i)).toBeInTheDocument()
    })
  })
})

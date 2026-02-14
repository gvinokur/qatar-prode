import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import BoostIntroductionStep from '@/app/components/onboarding/onboarding-steps/boost-introduction-step'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { testFactories } from '@/__tests__/db/test-factories'

describe('BoostIntroductionStep', () => {
  describe('Component Rendering', () => {
    it('renders component with tournament prop', () => {
      const tournament = testFactories.tournament({
        id: 'euro-2024',
        long_name: 'UEFA Euro 2024',
        max_silver_games: 5,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Multiplica Tus Puntos con Boosts')).toBeInTheDocument()
      expect(screen.getByText('Usa tus boosts estratégicamente en partidos clave')).toBeInTheDocument()
    })

    it('renders all UI elements (cards, chips, alerts)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 5,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      // Check card titles
      expect(screen.getByText('Boost Plateado')).toBeInTheDocument()
      expect(screen.getByText('Boost Dorado')).toBeInTheDocument()

      // Check chips exist (using getAllByText due to multiple chips with similar text)
      expect(screen.getByText(/Tienes 5 boosts disponibles por torneo/)).toBeInTheDocument()
      expect(screen.getByText(/Tienes 3 boosts disponibles por torneo/)).toBeInTheDocument()

      // Check multiplier values
      expect(screen.getByText('Multiplica × 2')).toBeInTheDocument()
      expect(screen.getByText('Multiplica × 3')).toBeInTheDocument()

      // Check descriptions
      expect(screen.getByText('Duplica tus puntos en el partido que elijas')).toBeInTheDocument()
      expect(screen.getByText('Triplica tus puntos en tu partido más importante')).toBeInTheDocument()

      // Check alert content
      expect(screen.getByText('Puntos Importantes:')).toBeInTheDocument()
      expect(screen.getByText((content, element) => {
        return element?.textContent === '• Los boosts son específicos de cada torneo'
      })).toBeInTheDocument()
      expect(screen.getByText((content, element) => {
        return element?.textContent === '• Solo aplican a predicciones de partidos'
      })).toBeInTheDocument()
      expect(screen.getByText(/Puedes cambiarlos hasta 1 hora antes del partido/)).toBeInTheDocument()
    })

    it('displays strategic tip', () => {
      const tournament = testFactories.tournament()

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('💡 Consejo Estratégico')).toBeInTheDocument()
      expect(
        screen.getByText('Guarda tus boosts para finales y partidos decisivos donde estés más seguro del resultado')
      ).toBeInTheDocument()
    })
  })

  describe('Boost Count Display', () => {
    it('displays silver boost count from tournament (max_silver_games)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 7,
        max_golden_games: 2,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Tienes 7 boosts disponibles por torneo')).toBeInTheDocument()
    })

    it('displays golden boost count from tournament (max_golden_games)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 3,
        max_golden_games: 4,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Tienes 4 boosts disponibles por torneo')).toBeInTheDocument()
    })

    it('displays both silver and golden boosts', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 5,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Tienes 5 boosts disponibles por torneo')).toBeInTheDocument()
      expect(screen.getByText('Tienes 3 boosts disponibles por torneo')).toBeInTheDocument()
    })
  })

  describe('Undefined/Null Tournament Handling', () => {
    it('handles undefined tournament gracefully (shows 0 boosts)', () => {
      renderWithTheme(<BoostIntroductionStep tournament={undefined} />)

      // Should show 0 for both boost types (2 instances)
      expect(screen.getAllByText('Tienes 0 boosts disponibles por torneo')).toHaveLength(2)
      // Component should still render without errors
      expect(screen.getByText('Multiplica Tus Puntos con Boosts')).toBeInTheDocument()
    })

    it('handles tournament with null boost values (treated as 0)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: null as unknown as number,
        max_golden_games: null as unknown as number,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      // Both should show 0
      expect(screen.getAllByText('Tienes 0 boosts disponibles por torneo')).toHaveLength(2)
    })
  })

  describe('Singular/Plural Text', () => {
    it('displays singular text for 1 silver boost', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 1,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Tienes 1 boost disponible por torneo')).toBeInTheDocument()
    })

    it('displays singular text for 1 golden boost', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 5,
        max_golden_games: 1,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Tienes 1 boost disponible por torneo')).toBeInTheDocument()
    })

    it('displays plural text for multiple silver boosts', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 10,
        max_golden_games: 2,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Tienes 10 boosts disponibles por torneo')).toBeInTheDocument()
    })

    it('displays plural text for multiple golden boosts', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 3,
        max_golden_games: 8,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Tienes 8 boosts disponibles por torneo')).toBeInTheDocument()
    })

    it('displays correct singular/plural when both boosts are 1', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 1,
        max_golden_games: 1,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getAllByText('Tienes 1 boost disponible por torneo')).toHaveLength(2)
    })
  })

  describe('Tournament Name Display', () => {
    it('shows tournament long_name when available', () => {
      const tournament = testFactories.tournament({
        long_name: 'FIFA World Cup 2026',
        short_name: 'WC26',
        max_silver_games: 5,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Configuración para FIFA World Cup 2026:')).toBeInTheDocument()
    })

    it('falls back to short_name when long_name is null', () => {
      const tournament = testFactories.tournament({
        long_name: null as unknown as string,
        short_name: 'WC26',
        max_silver_games: 5,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Configuración para WC26:')).toBeInTheDocument()
    })

    it('does not show tournament name when tournament is undefined', () => {
      renderWithTheme(<BoostIntroductionStep tournament={undefined} />)

      expect(screen.queryByText(/Configuración para/)).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles tournament with only silver boosts (0 golden)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 10,
        max_golden_games: 0,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Tienes 10 boosts disponibles por torneo')).toBeInTheDocument()
      expect(screen.getByText('Tienes 0 boosts disponibles por torneo')).toBeInTheDocument()
    })

    it('handles tournament with only golden boosts (0 silver)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 0,
        max_golden_games: 5,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Tienes 0 boosts disponibles por torneo')).toBeInTheDocument()
      expect(screen.getByText('Tienes 5 boosts disponibles por torneo')).toBeInTheDocument()
    })

    it('handles tournament with 0 boosts for both types', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 0,
        max_golden_games: 0,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getAllByText('Tienes 0 boosts disponibles por torneo')).toHaveLength(2)
    })

    it('handles large boost numbers', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 999,
        max_golden_games: 888,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Tienes 999 boosts disponibles por torneo')).toBeInTheDocument()
      expect(screen.getByText('Tienes 888 boosts disponibles por torneo')).toBeInTheDocument()
    })
  })

  describe('Multiplier Display', () => {
    it('shows ×2 multiplier for silver boost', () => {
      const tournament = testFactories.tournament()

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Multiplica × 2')).toBeInTheDocument()
    })

    it('shows ×3 multiplier for golden boost', () => {
      const tournament = testFactories.tournament()

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('Multiplica × 3')).toBeInTheDocument()
    })
  })

  describe('Visual Elements', () => {
    it('renders silver medal emoji', () => {
      const tournament = testFactories.tournament()

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('🥈')).toBeInTheDocument()
    })

    it('renders strategic tip emoji', () => {
      const tournament = testFactories.tournament()

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('💡 Consejo Estratégico')).toBeInTheDocument()
    })
  })
})

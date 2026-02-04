import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import GameCardSkeleton from '../game-card-skeleton'
import TournamentGroupCardSkeleton from '../tournament-group-card-skeleton'
import FriendGroupListSkeleton from '../friend-group-list-skeleton'
import LeaderboardSkeleton from '../leaderboard-skeleton'
import StatsCardSkeleton from '../stats-card-skeleton'
import GameDialogSkeleton from '../game-dialog-skeleton'
import AuthPageSkeleton from '../auth-page-skeleton'
import BackofficeTabsSkeleton from '../backoffice-tabs-skeleton'
import TournamentFormSkeleton from '../tournament-form-skeleton'
import TeamGridSkeleton from '../team-grid-skeleton'

describe('Skeleton Components', () => {
  describe('GameCardSkeleton', () => {
    it('renders with default full variant', () => {
      renderWithTheme(<GameCardSkeleton />)

      const skeleton = screen.getByRole('status')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading game card')
    })

    it('renders with compact variant', () => {
      renderWithTheme(<GameCardSkeleton variant="compact" />)

      const skeleton = screen.getByRole('status')
      expect(skeleton).toBeInTheDocument()
    })

    it('renders all required skeleton elements', () => {
      const { container } = renderWithTheme(<GameCardSkeleton />)

      // Check for MUI Skeleton components
      const skeletons = container.querySelectorAll('.MuiSkeleton-root')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('TournamentGroupCardSkeleton', () => {
    it('renders with proper accessibility attributes', () => {
      renderWithTheme(<TournamentGroupCardSkeleton />)

      const skeleton = screen.getByRole('status')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading tournament group')
    })

    it('renders all stat sections', () => {
      const { container } = renderWithTheme(<TournamentGroupCardSkeleton />)

      const skeletons = container.querySelectorAll('.MuiSkeleton-root')
      // Expect multiple skeleton elements for stats
      expect(skeletons.length).toBeGreaterThan(5)
    })
  })

  describe('FriendGroupListSkeleton', () => {
    it('renders with default count of 3 cards', () => {
      const { container } = renderWithTheme(<FriendGroupListSkeleton />)

      // Check for parent container with specific aria-label
      const parentSkeleton = screen.getByLabelText('Loading tournament groups')
      expect(parentSkeleton).toBeInTheDocument()
      expect(parentSkeleton).toHaveAttribute('aria-busy', 'true')

      // Check for 3 TournamentGroupCardSkeletons (each has role="status")
      const allStatuses = screen.getAllByRole('status')
      // Parent container + 3 cards = 4 total
      expect(allStatuses.length).toBe(4)
    })

    it('renders custom count of cards', () => {
      const { container } = renderWithTheme(<FriendGroupListSkeleton count={5} />)

      const allStatuses = screen.getAllByRole('status')
      // Parent container + 5 cards = 6 total
      expect(allStatuses.length).toBe(6)
    })
  })

  describe('LeaderboardSkeleton', () => {
    it('renders with default 10 rows', () => {
      const { container } = renderWithTheme(<LeaderboardSkeleton />)

      const skeleton = screen.getByRole('status')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('aria-label', 'Loading leaderboard')

      // Check table structure
      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()

      // Check for header row
      const headerCells = screen.getByText('Rank')
      expect(headerCells).toBeInTheDocument()
      expect(screen.getByText('Player')).toBeInTheDocument()
      expect(screen.getByText('Points')).toBeInTheDocument()
      expect(screen.getByText('Trend')).toBeInTheDocument()

      // Check for 10 body rows
      const tbody = container.querySelector('tbody')
      expect(tbody?.children.length).toBe(10)
    })

    it('renders custom number of rows', () => {
      const { container } = renderWithTheme(<LeaderboardSkeleton rows={5} />)

      const tbody = container.querySelector('tbody')
      expect(tbody?.children.length).toBe(5)
    })
  })

  describe('StatsCardSkeleton', () => {
    it('renders with default 3 rows', () => {
      const { container } = renderWithTheme(<StatsCardSkeleton />)

      const skeleton = screen.getByRole('status')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading statistics')

      // Title skeleton + 3 stat rows (each has 2 skeletons: label + value) = 7 total
      const skeletons = container.querySelectorAll('.MuiSkeleton-root')
      expect(skeletons.length).toBe(7)
    })

    it('renders custom number of rows', () => {
      const { container } = renderWithTheme(<StatsCardSkeleton rows={5} />)

      // Title skeleton + 5 stat rows (each has 2 skeletons) = 11 total
      const skeletons = container.querySelectorAll('.MuiSkeleton-root')
      expect(skeletons.length).toBe(11)
    })
  })

  describe('GameDialogSkeleton', () => {
    it('renders without boost info by default', () => {
      const { container } = renderWithTheme(<GameDialogSkeleton />)

      const skeleton = screen.getByRole('status')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading game dialog')

      // Team names + home score + away score + 2 buttons = 5 skeletons
      const skeletons = container.querySelectorAll('.MuiSkeleton-root')
      expect(skeletons.length).toBe(5)
    })

    it('renders with boost info when isGameGuess is true', () => {
      const { container } = renderWithTheme(<GameDialogSkeleton isGameGuess={true} />)

      // Team names + home score + away score + 2 boost info + 2 buttons = 7 skeletons
      const skeletons = container.querySelectorAll('.MuiSkeleton-root')
      expect(skeletons.length).toBe(7)
    })
  })

  describe('AuthPageSkeleton', () => {
    it('renders with proper accessibility attributes', () => {
      renderWithTheme(<AuthPageSkeleton />)

      const skeleton = screen.getByRole('status')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading authentication page')
    })

    it('renders card with form elements', () => {
      const { container } = renderWithTheme(<AuthPageSkeleton />)

      // Title + 2 input fields + button = 4 skeletons
      const skeletons = container.querySelectorAll('.MuiSkeleton-root')
      expect(skeletons.length).toBe(4)
    })
  })

  describe('BackofficeTabsSkeleton', () => {
    it('renders with proper accessibility attributes', () => {
      renderWithTheme(<BackofficeTabsSkeleton />)

      const skeleton = screen.getByRole('status')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading backoffice data')
    })

    it('renders card with grid of form fields', () => {
      const { container } = renderWithTheme(<BackofficeTabsSkeleton />)

      // Title + 4 form fields = 5 skeletons
      const skeletons = container.querySelectorAll('.MuiSkeleton-root')
      expect(skeletons.length).toBe(5)
    })
  })

  describe('TournamentFormSkeleton', () => {
    it('renders with proper accessibility attributes', () => {
      renderWithTheme(<TournamentFormSkeleton />)

      const skeleton = screen.getByRole('status')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading tournament form')
    })

    it('renders form with 6 field skeletons', () => {
      const { container } = renderWithTheme(<TournamentFormSkeleton />)

      // Title + 6 form fields = 7 skeletons
      const skeletons = container.querySelectorAll('.MuiSkeleton-root')
      expect(skeletons.length).toBe(7)
    })
  })

  describe('TeamGridSkeleton', () => {
    it('renders with proper accessibility attributes', () => {
      renderWithTheme(<TeamGridSkeleton />)

      const skeleton = screen.getByRole('status')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading teams')
    })

    it('renders grid with 8 team card skeletons', () => {
      const { container } = renderWithTheme(<TeamGridSkeleton />)

      // Header title + button + 8 team cards = 10 skeletons
      const skeletons = container.querySelectorAll('.MuiSkeleton-root')
      expect(skeletons.length).toBe(10)
    })
  })
})

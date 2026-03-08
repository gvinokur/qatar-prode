import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithTheme } from '../../utils/test-utils'
import HeadToHeadDialog from '../../../app/components/leaderboard/HeadToHeadDialog'
import type { UserComparisonStats } from '../../../app/actions/stats-actions'

vi.mock('../../../app/actions/stats-actions', () => ({
  getUserStatsForComparison: vi.fn(),
}))

vi.mock('../../../app/utils/share-utils', () => ({
  captureElement: vi.fn().mockResolvedValue(new Blob(['img'], { type: 'image/png' })),
  shareImage: vi.fn().mockResolvedValue(undefined),
  downloadBlob: vi.fn(),
  openWhatsApp: vi.fn(),
}))

import { getUserStatsForComparison } from '../../../app/actions/stats-actions'

const mockUserA: UserComparisonStats = {
  userId: 'user-a',
  performance: {
    totalPoints: 1250,
    groupStagePoints: 850,
    groupGamePoints: 780,
    groupBoostBonus: 40,
    groupQualifiedTeamsPoints: 30,
    groupQualifiedTeamsCorrect: 3,
    groupQualifiedTeamsExact: 1,
    groupPositionPoints: 0,
    playoffStagePoints: 400,
    playoffGamePoints: 350,
    playoffBoostBonus: 30,
    honorRollPoints: 10,
    individualAwardsPoints: 10,
  },
  accuracy: {
    totalPredictionsMade: 48,
    totalGamesAvailable: 64,
    totalGamesPlayed: 48,
    completionPercentage: 75,
    overallCorrect: 32,
    overallCorrectPercentage: 66.7,
    overallExact: 10,
    overallExactPercentage: 20.8,
    overallMissed: 16,
    overallMissedPercentage: 33.3,
    groupCorrect: 24,
    groupCorrectPercentage: 50,
    groupExact: 7,
    groupExactPercentage: 14.6,
    playoffCorrect: 8,
    playoffCorrectPercentage: 16.7,
    playoffExact: 3,
    playoffExactPercentage: 6.3,
  },
}

const mockUserB: UserComparisonStats = {
  userId: 'user-b',
  performance: {
    totalPoints: 1180,
    groupStagePoints: 800,
    groupGamePoints: 720,
    groupBoostBonus: 50,
    groupQualifiedTeamsPoints: 30,
    groupQualifiedTeamsCorrect: 3,
    groupQualifiedTeamsExact: 1,
    groupPositionPoints: 0,
    playoffStagePoints: 380,
    playoffGamePoints: 330,
    playoffBoostBonus: 30,
    honorRollPoints: 10,
    individualAwardsPoints: 10,
  },
  accuracy: {
    totalPredictionsMade: 44,
    totalGamesAvailable: 64,
    totalGamesPlayed: 48,
    completionPercentage: 68.8,
    overallCorrect: 29,
    overallCorrectPercentage: 60.4,
    overallExact: 9,
    overallExactPercentage: 18.8,
    overallMissed: 19,
    overallMissedPercentage: 39.6,
    groupCorrect: 22,
    groupCorrectPercentage: 45.8,
    groupExact: 6,
    groupExactPercentage: 12.5,
    playoffCorrect: 7,
    playoffCorrectPercentage: 14.6,
    playoffExact: 3,
    playoffExactPercentage: 6.3,
  },
}

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  currentUserId: 'user-a',
  opponentId: 'user-b',
  tournamentId: 'tournament-1',
  currentUserName: 'You',
  opponentName: 'Maria',
  currentUserRank: 2,
  opponentRank: 3,
  groupName: 'My Group',
}

describe('HeadToHeadDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state while fetching', async () => {
    vi.mocked(getUserStatsForComparison).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithTheme(<HeadToHeadDialog {...defaultProps} />)

    // Loading skeleton should be visible
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })
  })

  it('renders both user names in the dialog', async () => {
    vi.mocked(getUserStatsForComparison).mockResolvedValue([mockUserA, mockUserB])

    renderWithTheme(<HeadToHeadDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('You')).toBeTruthy()
      expect(screen.getByText('Maria')).toBeTruthy()
    })
  })

  it('renders rank indicators when provided', async () => {
    vi.mocked(getUserStatsForComparison).mockResolvedValue([mockUserA, mockUserB])

    renderWithTheme(<HeadToHeadDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('#2')).toBeTruthy()
      expect(screen.getByText('#3')).toBeTruthy()
    })
  })

  it('displays total points for both users', async () => {
    vi.mocked(getUserStatsForComparison).mockResolvedValue([mockUserA, mockUserB])

    renderWithTheme(<HeadToHeadDialog {...defaultProps} />)

    await waitFor(() => {
      // Match points values — locale may format as 1,250 or 1.250
      expect(screen.getAllByText(/1[,.]250/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/1[,.]180/).length).toBeGreaterThan(0)
    })
  })

  it('shows "Your Lead" section when current user leads', async () => {
    vi.mocked(getUserStatsForComparison).mockResolvedValue([mockUserA, mockUserB])

    renderWithTheme(<HeadToHeadDialog {...defaultProps} />)

    // user-a has more points than user-b
    await waitFor(() => {
      expect(screen.getByText('Tu Ventaja')).toBeTruthy() // Spanish: "Your Lead"
    })
  })

  it('shows "Their Lead" section when opponent leads in some metrics', async () => {
    // Swap so user-b leads overall
    const swappedStats = [
      { ...mockUserA, performance: { ...mockUserA.performance, totalPoints: 1000, groupStagePoints: 700, playoffStagePoints: 300 } },
      { ...mockUserB, performance: { ...mockUserB.performance, totalPoints: 1180, groupStagePoints: 800, playoffStagePoints: 380 } },
    ]
    vi.mocked(getUserStatsForComparison).mockResolvedValue(swappedStats)

    renderWithTheme(<HeadToHeadDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/Ventaja de Maria/)).toBeTruthy() // Spanish: "Maria's Lead"
    })
  })

  it('shows evenly matched message when no one leads', async () => {
    const tiedStats: UserComparisonStats[] = [
      { ...mockUserA, performance: { ...mockUserA.performance, totalPoints: 1000, groupStagePoints: 600, playoffStagePoints: 400 }, accuracy: { ...mockUserA.accuracy, overallCorrectPercentage: 50, overallExactPercentage: 20, groupCorrectPercentage: 30, playoffCorrectPercentage: 20 } },
      { ...mockUserB, performance: { ...mockUserB.performance, totalPoints: 1000, groupStagePoints: 600, playoffStagePoints: 400 }, accuracy: { ...mockUserB.accuracy, overallCorrectPercentage: 50, overallExactPercentage: 20, groupCorrectPercentage: 30, playoffCorrectPercentage: 20 } },
    ]
    vi.mocked(getUserStatsForComparison).mockResolvedValue(tiedStats)

    renderWithTheme(<HeadToHeadDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('¡Están igualados!')).toBeTruthy() // Spanish: evenly matched
    })
  })

  it('calls onClose when close button is clicked', async () => {
    vi.mocked(getUserStatsForComparison).mockResolvedValue([mockUserA, mockUserB])
    const onClose = vi.fn()

    renderWithTheme(<HeadToHeadDialog {...defaultProps} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('Maria')).toBeTruthy()
    })

    // Find and click the close button (Cerrar = Spanish for Close)
    const closeButton = screen.getByText('Cerrar')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('share button opens share preview modal', async () => {
    vi.mocked(getUserStatsForComparison).mockResolvedValue([mockUserA, mockUserB])
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn().mockReturnValue('blob:test'), writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true })

    renderWithTheme(<HeadToHeadDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Maria')).toBeTruthy()
    })

    const shareButton = screen.getByText('Compartir')
    fireEvent.click(shareButton)

    // Share preview modal should open — MUI sets aria-hidden on the H2H dialog when preview modal opens
    await waitFor(() => {
      expect(screen.getAllByRole('dialog', { hidden: true }).length).toBeGreaterThanOrEqual(2)
    })
  })

  it('share button uses share preview for any stats result', async () => {
    const losingStats: UserComparisonStats[] = [
      { ...mockUserA, performance: { ...mockUserA.performance, totalPoints: 1000, groupStagePoints: 600, playoffStagePoints: 400 } },
      { ...mockUserB, performance: { ...mockUserB.performance, totalPoints: 1300, groupStagePoints: 800, playoffStagePoints: 500 } },
    ]
    vi.mocked(getUserStatsForComparison).mockResolvedValue(losingStats)
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn().mockReturnValue('blob:test'), writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true })

    renderWithTheme(<HeadToHeadDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/Ventaja de Maria/)).toBeTruthy()
    })

    const shareButton = screen.getByText('Compartir')
    fireEvent.click(shareButton)

    // Share preview modal should open — MUI sets aria-hidden on the H2H dialog when preview modal opens
    await waitFor(() => {
      expect(screen.getAllByRole('dialog', { hidden: true }).length).toBeGreaterThanOrEqual(2)
    })
  })

  it('does not render dialog content when closed', () => {
    vi.mocked(getUserStatsForComparison).mockResolvedValue([mockUserA, mockUserB])

    renderWithTheme(<HeadToHeadDialog {...defaultProps} open={false} />)

    // Dialog should not be in the DOM or not visible when open=false
    const dialog = screen.queryByRole('dialog')
    // MUI Dialog with open=false is hidden (display: none) or not rendered
    if (dialog) {
      expect(dialog).not.toBeVisible()
    }
  })
})

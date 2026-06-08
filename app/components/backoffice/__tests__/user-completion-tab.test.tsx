import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import UserCompletionTab from '../user-completion-tab'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import type { UserTournamentCompletionRow } from '../../../actions/admin-tournament-actions'

vi.mock('../../../actions/admin-tournament-actions', () => ({
  getUserTournamentCompletionsAction: vi.fn(),
}))

import { getUserTournamentCompletionsAction } from '../../../actions/admin-tournament-actions'

const TOURNAMENT_ID = 'tournament-1'

function makeRow(overrides: Partial<UserTournamentCompletionRow> = {}): UserTournamentCompletionRow {
  return {
    userId: 'user-1',
    nickname: 'Alice',
    isEmailVerified: true,
    gamesPredicted: 10,
    totalGames: 48,
    qualifiersFilled: 4,
    qualifiersTotal: 20,
    awardsFilled: 3,
    awardsTotal: 7,
    groupCount: 0,
    groupNames: [],
    overallPct: 22,
    ...overrides,
  }
}

function mockAction(rows: UserTournamentCompletionRow[], total?: number) {
  vi.mocked(getUserTournamentCompletionsAction).mockResolvedValue({
    rows,
    total: total ?? rows.length,
  })
}

afterEach(() => vi.clearAllMocks())

describe('UserCompletionTab', () => {
  it('shows loading spinner while action is pending', async () => {
    let resolve: (value: { rows: UserTournamentCompletionRow[]; total: number }) => void
    vi.mocked(getUserTournamentCompletionsAction).mockReturnValue(
      new Promise((res) => { resolve = res })
    )

    renderWithTheme(<UserCompletionTab tournamentId={TOURNAMENT_ID} />)

    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument()

    await act(async () => {
      resolve!({ rows: [], total: 0 })
    })
  })

  it('renders user rows on successful fetch', async () => {
    mockAction([makeRow({ nickname: 'Bob', overallPct: 55, gamesPredicted: 30, totalGames: 48 })])

    renderWithTheme(<UserCompletionTab tournamentId={TOURNAMENT_ID} />)

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('55%')).toBeInTheDocument()
      expect(screen.getByText('30 / 48')).toBeInTheDocument()
    })
  })

  it('shows "Yes" chip for email-verified user', async () => {
    mockAction([makeRow({ isEmailVerified: true })])

    renderWithTheme(<UserCompletionTab tournamentId={TOURNAMENT_ID} />)

    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument()
    })
  })

  it('shows "No" chip for non-email-verified user', async () => {
    mockAction([makeRow({ isEmailVerified: false })])

    renderWithTheme(<UserCompletionTab tournamentId={TOURNAMENT_ID} />)

    await waitFor(() => {
      expect(screen.getByText('No')).toBeInTheDocument()
    })
  })

  it('shows "No users found" empty state when rows is empty', async () => {
    mockAction([])

    renderWithTheme(<UserCompletionTab tournamentId={TOURNAMENT_ID} />)

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument()
    })
  })

  it('shows error alert when action throws', async () => {
    vi.mocked(getUserTournamentCompletionsAction).mockRejectedValue(new Error('Server error'))

    renderWithTheme(<UserCompletionTab tournamentId={TOURNAMENT_ID} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load user completion data.')).toBeInTheDocument()
    })
  })

  it('renders "—" for groups when groupCount is 0', async () => {
    mockAction([makeRow({ groupCount: 0, groupNames: [] })])

    renderWithTheme(<UserCompletionTab tournamentId={TOURNAMENT_ID} />)

    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  it('renders group count chip when groupCount > 0', async () => {
    mockAction([makeRow({ groupCount: 3, groupNames: ['Alpha', 'Beta', 'Gamma'] })])

    renderWithTheme(<UserCompletionTab tournamentId={TOURNAMENT_ID} />)

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('calls action with tournamentId, page 0, and pageSize 25 on mount', async () => {
    mockAction([])

    renderWithTheme(<UserCompletionTab tournamentId={TOURNAMENT_ID} />)

    await waitFor(() => {
      expect(getUserTournamentCompletionsAction).toHaveBeenCalledWith(TOURNAMENT_ID, 0, 25)
    })
  })

  it('calls action with updated page when user navigates to next page', async () => {
    const rows = Array.from({ length: 26 }, (_, i) =>
      makeRow({ userId: `u${i}`, nickname: `User${i}` })
    )
    mockAction(rows, 26)

    renderWithTheme(<UserCompletionTab tournamentId={TOURNAMENT_ID} />)

    await waitFor(() => expect(screen.getByText('User0')).toBeInTheDocument())

    fireEvent.click(screen.getByTitle('Go to next page'))

    await waitFor(() => {
      expect(getUserTournamentCompletionsAction).toHaveBeenCalledWith(TOURNAMENT_ID, 1, 25)
    })
  })

  it('renders qualifiers and awards columns', async () => {
    mockAction([makeRow({ qualifiersFilled: 12, qualifiersTotal: 20, awardsFilled: 5, awardsTotal: 7 })])

    renderWithTheme(<UserCompletionTab tournamentId={TOURNAMENT_ID} />)

    await waitFor(() => {
      expect(screen.getByText('12 / 20')).toBeInTheDocument()
      expect(screen.getByText('5 / 7')).toBeInTheDocument()
    })
  })
})

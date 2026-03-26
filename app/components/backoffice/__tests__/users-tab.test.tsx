import { act, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import UsersTab from '../users-tab'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { testFactories } from '@/__tests__/db/test-factories'

vi.mock('../../../actions/user-actions', () => ({
  getUsersPaginated: vi.fn(),
}))

import { getUsersPaginated } from '../../../actions/user-actions'

function makeUser(overrides = {}) {
  return {
    ...testFactories.user(overrides),
    auth_providers: null as unknown as never,
    email_verified: true,
  }
}

function mockPaginated(users: ReturnType<typeof makeUser>[], total?: number) {
  vi.mocked(getUsersPaginated).mockResolvedValue({
    users: users as never,
    total: total ?? users.length,
  })
}

afterEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('UsersTab', () => {
  it('calls action with empty search and page 0 on mount, then renders returned users', async () => {
    const users = [
      makeUser({ id: 'u1', email: 'a@a.com', nickname: 'alice' }),
      makeUser({ id: 'u2', email: 'b@b.com', nickname: 'bob' }),
    ]
    mockPaginated(users)

    renderWithTheme(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument()
      expect(screen.getByText('bob')).toBeInTheDocument()
    })

    expect(getUsersPaginated).toHaveBeenCalledWith('', 0, 25)
  })

  it('does not fire action again until debounce delay passes', async () => {
    vi.useFakeTimers()
    mockPaginated([])

    renderWithTheme(<UsersTab />)

    // Flush initial mount effects and promises
    await act(async () => {})

    const callsBefore = vi.mocked(getUsersPaginated).mock.calls.length

    const input = screen.getByLabelText(/search/i)
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'al' } })
    fireEvent.change(input, { target: { value: 'ali' } })

    // Still only the calls from initial mount
    expect(vi.mocked(getUsersPaginated).mock.calls.length).toBe(callsBefore)
  })

  it('calls action with updated search term after debounce delay', async () => {
    vi.useFakeTimers()
    mockPaginated([])

    renderWithTheme(<UsersTab />)
    await act(async () => {})

    const input = screen.getByLabelText(/search/i)
    fireEvent.change(input, { target: { value: 'alice' } })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(getUsersPaginated).toHaveBeenCalledWith('alice', 0, 25)
  })

  it('resets page to 0 when search changes after debounce', async () => {
    const users = Array.from({ length: 26 }, (_, i) =>
      makeUser({ id: `u${i}`, email: `u${i}@x.com`, nickname: `user${i}` })
    )
    mockPaginated(users, 26)

    renderWithTheme(<UsersTab />)
    await waitFor(() => expect(screen.getByText('user0')).toBeInTheDocument())

    // Navigate to page 2
    fireEvent.click(screen.getByTitle('Go to next page'))
    await waitFor(() =>
      expect(getUsersPaginated).toHaveBeenCalledWith('', 1, 25)
    )

    // Now enable fake timers for debounce
    vi.useFakeTimers()

    const input = screen.getByLabelText(/search/i)
    fireEvent.change(input, { target: { value: 'user0' } })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(getUsersPaginated).toHaveBeenCalledWith('user0', 0, 25)
  })

  it('shows "(no nickname)" when user.nickname is null', async () => {
    mockPaginated([makeUser({ id: 'u1', nickname: null })])

    renderWithTheme(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('(no nickname)')).toBeInTheDocument()
    })
  })

  it('renders "Admin" for is_admin=true and "User" for is_admin=false', async () => {
    mockPaginated([
      makeUser({ id: 'u1', is_admin: true, email: 'admin@x.com' }),
      makeUser({ id: 'u2', is_admin: false, email: 'user@x.com' }),
    ])

    renderWithTheme(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('User')).toBeInTheDocument()
    })
  })

  it('renders one chip per provider in auth_providers', async () => {
    mockPaginated([
      {
        ...makeUser({ id: 'u1' }),
        auth_providers: ['credentials', 'google'] as unknown as never,
      },
    ])

    renderWithTheme(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('Password')).toBeInTheDocument()
      expect(screen.getByText('Google')).toBeInTheDocument()
    })
  })

  it('renders "(no login method)" when auth_providers is null', async () => {
    mockPaginated([{ ...makeUser({ id: 'u1' }), auth_providers: null as unknown as never }])

    renderWithTheme(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('(no login method)')).toBeInTheDocument()
    })
  })

  it('renders "(no login method)" when auth_providers is empty array', async () => {
    mockPaginated([{ ...makeUser({ id: 'u1' }), auth_providers: [] as unknown as never }])

    renderWithTheme(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('(no login method)')).toBeInTheDocument()
    })
  })

  it('shows loading spinner while action is pending', async () => {
    let resolve: (value: { users: never[]; total: number }) => void
    vi.mocked(getUsersPaginated).mockReturnValue(
      new Promise((res) => {
        resolve = res
      })
    )

    renderWithTheme(<UsersTab />)

    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument()

    // Resolve the promise to clean up
    await act(async () => {
      resolve!({ users: [], total: 0 })
    })
  })

  it('renders empty state message when action returns no users', async () => {
    mockPaginated([])

    renderWithTheme(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument()
    })
  })

  it('calls action with correct page when user navigates to next page', async () => {
    const users = Array.from({ length: 26 }, (_, i) =>
      makeUser({ id: `u${i}`, email: `u${i}@x.com`, nickname: `user${i}` })
    )
    mockPaginated(users, 26)

    renderWithTheme(<UsersTab />)
    await waitFor(() => expect(screen.getByText('user0')).toBeInTheDocument())

    fireEvent.click(screen.getByTitle('Go to next page'))

    await waitFor(() => {
      expect(getUsersPaginated).toHaveBeenCalledWith('', 1, 25)
    })
  })

  it('falls back to raw provider key when not in PROVIDER_LABELS', async () => {
    mockPaginated([
      {
        ...makeUser({ id: 'u1' }),
        auth_providers: ['unknown_provider'] as unknown as never,
      },
    ])

    renderWithTheme(<UsersTab />)

    await waitFor(() => {
      expect(screen.getByText('unknown_provider')).toBeInTheDocument()
    })
  })

  it('treats email_verified=null the same as false (shows CloseIcon)', async () => {
    mockPaginated([{ ...makeUser({ id: 'u1' }), email_verified: null as unknown as never }])

    renderWithTheme(<UsersTab />)

    await waitFor(() => {
      const closeIcons = document.querySelectorAll('[data-testid="CloseIcon"]')
      expect(closeIcons.length).toBeGreaterThan(0)
    })
  })
})

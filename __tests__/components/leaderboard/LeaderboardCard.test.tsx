import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardCard from '@/app/components/leaderboard/LeaderboardCard'
import type { LeaderboardUser } from '@/app/components/leaderboard/types'

const mockUser: LeaderboardUser = {
  id: 'user-1',
  name: 'John Doe',
  totalPoints: 1000,
  groupPoints: 700,
  knockoutPoints: 300,
  groupBoostBonus: 50,
  playoffBoostBonus: 30
}

describe('LeaderboardCard', () => {
  it('renders rank, name, and points', () => {
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        isCurrentUser={false}
        isExpanded={false}
        onToggle={() => {}}
      />
    )

    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('1,000 pts')).toBeInTheDocument()
  })

  it('highlights current user card', () => {
    const { container } = renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        isCurrentUser={true}
        isExpanded={false}
        onToggle={() => {}}
      />
    )

    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText(/tap to view details/i)).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const handleToggle = vi.fn()
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        isCurrentUser={false}
        isExpanded={false}
        onToggle={handleToggle}
      />
    )

    const card = screen.getByRole('button')
    fireEvent.click(card)

    expect(handleToggle).toHaveBeenCalledTimes(1)
  })

  it('shows detailed stats when expanded', () => {
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        isCurrentUser={false}
        isExpanded={true}
        onToggle={() => {}}
      />
    )

    expect(screen.getByText(/point breakdown/i)).toBeInTheDocument()
    expect(screen.getByText('700')).toBeInTheDocument() // group points
    expect(screen.getByText('300')).toBeInTheDocument() // knockout points
    expect(screen.getByText('+50')).toBeInTheDocument() // group boost bonus
    expect(screen.getByText('+30')).toBeInTheDocument() // playoff boost bonus
    expect(screen.getByText(/tap to collapse/i)).toBeInTheDocument()
  })

  it('truncates long user names', () => {
    const longNameUser = {
      ...mockUser,
      name: 'This Is A Very Long User Name That Should Be Truncated'
    }

    renderWithTheme(
      <LeaderboardCard
        user={longNameUser}
        rank={1}
        isCurrentUser={false}
        isExpanded={false}
        onToggle={() => {}}
      />
    )

    const nameElement = screen.getByText(/this is a very long user/i)
    expect(nameElement).toBeInTheDocument()
    expect(nameElement.textContent?.length).toBeLessThanOrEqual(28) // 25 chars + '...'
  })

  it('is keyboard navigable', () => {
    const handleToggle = vi.fn()
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        isCurrentUser={false}
        isExpanded={false}
        onToggle={handleToggle}
      />
    )

    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(handleToggle).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(card, { key: ' ' })
    expect(handleToggle).toHaveBeenCalledTimes(2)
  })

  it('has accessible labels', () => {
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        isCurrentUser={false}
        isExpanded={false}
        onToggle={() => {}}
      />
    )

    expect(screen.getByLabelText(/john doe's leaderboard card/i)).toBeInTheDocument()
  })
})

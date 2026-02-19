import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardCard from '@/app/components/leaderboard/LeaderboardCard'
import type { LeaderboardUser } from '@/app/components/leaderboard/types'

// Mock next-intl/server (used by email-templates.ts)
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() => Promise.resolve((key: string) => key)),
  getLocale: vi.fn(() => Promise.resolve('es')),
}))

const mockUser: LeaderboardUser = {
  id: 'user-1',
  name: 'John Doe',
  totalPoints: 1000,
  groupPoints: 700,
  knockoutPoints: 300,
  groupStageScore: 500,
  groupStageQualifiersScore: 150,
  groupPositionScore: 10,
  playoffScore: 270,
  groupBoostBonus: 50,
  playoffBoostBonus: 30,
  honorRollScore: 40,
  individualAwardsScore: 60
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

    expect(screen.getByText(/desglose de puntos/i)).toBeInTheDocument()

    // Group Stage section
    expect(screen.getByText('Partidos de Fase de Grupos')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument() // group stage score
    expect(screen.getByText('+50')).toBeInTheDocument() // group boost bonus
    expect(screen.getByText('Equipos Clasificados')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument() // qualifiers score
    expect(screen.getByText('Posiciones de Grupo')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument() // group positions score

    // Knockout section
    expect(screen.getByText('Partidos de Playoff')).toBeInTheDocument()
    expect(screen.getByText('270')).toBeInTheDocument() // playoff score
    expect(screen.getByText('+30')).toBeInTheDocument() // playoff boost bonus

    // Tournament section
    expect(screen.getByText('Cuadro de Honor')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument() // honor roll score
    expect(screen.getByText('Premios Individuales')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument() // individual awards score

    expect(screen.getByText(/toca para colapsar/i)).toBeInTheDocument()
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

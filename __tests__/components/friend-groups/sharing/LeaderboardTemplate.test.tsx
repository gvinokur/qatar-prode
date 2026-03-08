import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../utils/test-utils'
import LeaderboardTemplate, { type LeaderboardTemplateUser } from '../../../../app/components/friend-groups/sharing/LeaderboardTemplate'

vi.mock('qrcode.react', () => ({
  QRCodeSVG: () => <svg data-testid="qr-code" />,
}))

const baseUsers: LeaderboardTemplateUser[] = [
  { rank: 1, name: 'Alice', userId: 'u1', points: 1500, isCurrentUser: false },
  { rank: 2, name: 'Bob', userId: 'u2', points: 1400, isCurrentUser: true },
  { rank: 3, name: 'Carlos', userId: 'u3', points: 1300, isCurrentUser: false },
]

describe('LeaderboardTemplate', () => {
  it('renders group name and tournament name', () => {
    renderWithProviders(
      <LeaderboardTemplate
        groupName="My Group"
        tournamentName="World Cup 2026"
        users={baseUsers}
        currentUserRank={2}
        totalUsers={10}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('My Group')).toBeInTheDocument()
    expect(screen.getByText('World Cup 2026')).toBeInTheDocument()
  })

  it('renders all provided users', () => {
    renderWithProviders(
      <LeaderboardTemplate
        groupName="G"
        tournamentName="T"
        users={baseUsers}
        currentUserRank={2}
        totalUsers={10}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Carlos')).toBeInTheDocument()
  })

  it('displays YOU for the current user', () => {
    renderWithProviders(
      <LeaderboardTemplate
        groupName="G"
        tournamentName="T"
        users={baseUsers}
        currentUserRank={2}
        totalUsers={10}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('YOU')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
  })

  it('shows medal emojis for top 3', () => {
    renderWithProviders(
      <LeaderboardTemplate
        groupName="G"
        tournamentName="T"
        users={baseUsers}
        currentUserRank={2}
        totalUsers={10}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('🥇')).toBeInTheDocument()
    expect(screen.getByText('🥈')).toBeInTheDocument()
    expect(screen.getByText('🥉')).toBeInTheDocument()
  })

  it('shows star emoji for current user outside top 3', () => {
    const users: LeaderboardTemplateUser[] = [
      { rank: 1, name: 'Alice', userId: 'u1', points: 1500, isCurrentUser: false },
      { rank: 2, name: 'Bob', userId: 'u2', points: 1400, isCurrentUser: false },
      { rank: 3, name: 'Carlos', userId: 'u3', points: 1300, isCurrentUser: false },
      { rank: 4, name: 'Dave', userId: 'u4', points: 1200, isCurrentUser: true },
    ]
    renderWithProviders(
      <LeaderboardTemplate
        groupName="G"
        tournamentName="T"
        users={users}
        currentUserRank={4}
        totalUsers={10}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('⭐')).toBeInTheDocument()
  })

  it('shows points-from-lead message when current user is not rank 1', () => {
    renderWithProviders(
      <LeaderboardTemplate
        groupName="G"
        tournamentName="T"
        users={baseUsers}
        currentUserRank={2}
        totalUsers={10}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText(/100 pts from the lead/)).toBeInTheDocument()
  })

  it('does not show points-from-lead message when current user is rank 1', () => {
    const users: LeaderboardTemplateUser[] = [
      { rank: 1, name: 'Alice', userId: 'u1', points: 1500, isCurrentUser: true },
      { rank: 2, name: 'Bob', userId: 'u2', points: 1400, isCurrentUser: false },
    ]
    renderWithProviders(
      <LeaderboardTemplate
        groupName="G"
        tournamentName="T"
        users={users}
        currentUserRank={1}
        totalUsers={10}
      />,
      { locale: 'en' }
    )
    expect(screen.queryByText(/pts from the lead/)).not.toBeInTheDocument()
  })

  it('renders QR code when joinUrl is provided', () => {
    renderWithProviders(
      <LeaderboardTemplate
        groupName="G"
        tournamentName="T"
        users={baseUsers}
        currentUserRank={2}
        totalUsers={10}
        joinUrl="https://example.com/join/abc"
      />,
      { locale: 'en' }
    )
    expect(screen.getByTestId('qr-code')).toBeInTheDocument()
    expect(screen.getByText('Join our group!')).toBeInTheDocument()
  })

  it('does not render QR code when joinUrl is not provided', () => {
    renderWithProviders(
      <LeaderboardTemplate
        groupName="G"
        tournamentName="T"
        users={baseUsers}
        currentUserRank={2}
        totalUsers={10}
      />,
      { locale: 'en' }
    )
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument()
    expect(screen.queryByText('Join our group!')).not.toBeInTheDocument()
  })

  it('shows member count in QR section', () => {
    renderWithProviders(
      <LeaderboardTemplate
        groupName="G"
        tournamentName="T"
        users={baseUsers}
        currentUserRank={2}
        totalUsers={5}
        joinUrl="https://example.com/join/abc"
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('5 members')).toBeInTheDocument()
  })

  it('shows singular member when totalUsers is 1', () => {
    renderWithProviders(
      <LeaderboardTemplate
        groupName="G"
        tournamentName="T"
        users={baseUsers}
        currentUserRank={2}
        totalUsers={1}
        joinUrl="https://example.com/join/abc"
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('1 member')).toBeInTheDocument()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PreTournamentGroupsPreview } from '../pre-tournament-groups-preview'

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}(${JSON.stringify(params)})`
    return key
  }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

const defaultProps = { locale: 'en' as const, tournamentId: 'tour-42' }

const makeGroups = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `group-${i + 1}`, name: `Group ${i + 1}` }))

describe('PreTournamentGroupsPreview', () => {
  it('renders up to 3 group name chips when allGroupNames has 3 or fewer items', () => {
    render(
      <PreTournamentGroupsPreview {...defaultProps} allGroupNames={makeGroups(2)} />
    )

    expect(screen.getByText('Group 1')).toBeInTheDocument()
    expect(screen.getByText('Group 2')).toBeInTheDocument()
    expect(screen.queryByText(/andOthers/)).not.toBeInTheDocument()
  })

  it('renders exactly 3 group chips and no "and N others" when allGroupNames has exactly 3', () => {
    render(
      <PreTournamentGroupsPreview {...defaultProps} allGroupNames={makeGroups(3)} />
    )

    expect(screen.getByText('Group 1')).toBeInTheDocument()
    expect(screen.getByText('Group 2')).toBeInTheDocument()
    expect(screen.getByText('Group 3')).toBeInTheDocument()
    expect(screen.queryByText(/andOthers/)).not.toBeInTheDocument()
  })

  it('appends "and N others" text when allGroupNames has more than 3 items', () => {
    render(
      <PreTournamentGroupsPreview {...defaultProps} allGroupNames={makeGroups(5)} />
    )

    expect(screen.getByText('Group 1')).toBeInTheDocument()
    expect(screen.getByText('Group 2')).toBeInTheDocument()
    expect(screen.getByText('Group 3')).toBeInTheDocument()
    // 4th and 5th groups should NOT be rendered as chips
    expect(screen.queryByText('Group 4')).not.toBeInTheDocument()
    // "and N others" text with count=2
    expect(screen.getByText('groupsPreview.andOthers({"count":2})')).toBeInTheDocument()
  })

  it('renders exactly 3 CTA buttons (Your Groups, Create Group, Discover Groups)', () => {
    render(
      <PreTournamentGroupsPreview {...defaultProps} allGroupNames={makeGroups(1)} />
    )

    expect(screen.getByText('groupsPreview.goToGroups')).toBeInTheDocument()
    expect(screen.getByText('groupsPreview.createGroup')).toBeInTheDocument()
    expect(screen.getByText('groupsPreview.discoverGroups')).toBeInTheDocument()
  })

  it('group chips link to the correct group href', () => {
    render(
      <PreTournamentGroupsPreview
        locale="en"
        tournamentId="tour-42"
        allGroupNames={[{ id: 'grp-1', name: 'Alpha' }]}
      />
    )

    const chip = screen.getByText('Alpha').closest('a')
    expect(chip).toHaveAttribute('href', '/en/tournaments/tour-42/friend-groups/grp-1')
  })

  it('renders "youreIn" prefix text', () => {
    render(
      <PreTournamentGroupsPreview {...defaultProps} allGroupNames={makeGroups(1)} />
    )
    expect(screen.getByText('groupsPreview.youreIn')).toBeInTheDocument()
  })
})

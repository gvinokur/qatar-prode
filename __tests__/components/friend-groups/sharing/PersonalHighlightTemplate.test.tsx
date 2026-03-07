import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '../../../utils/test-utils'
import PersonalHighlightTemplate from '../../../../app/components/friend-groups/sharing/PersonalHighlightTemplate'

describe('PersonalHighlightTemplate', () => {
  it('renders the Moving Up title', () => {
    renderWithTheme(
      <PersonalHighlightTemplate
        groupName="My Group"
        tournamentName="World Cup"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />
    )
    expect(screen.getByText('Moving Up! 🎉')).toBeInTheDocument()
  })

  it('renders user name', () => {
    renderWithTheme(
      <PersonalHighlightTemplate
        groupName="My Group"
        tournamentName="World Cup"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders group name and tournament in subtitle', () => {
    renderWithTheme(
      <PersonalHighlightTemplate
        groupName="My Group"
        tournamentName="World Cup"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />
    )
    expect(screen.getByText('My Group – World Cup')).toBeInTheDocument()
  })

  it('renders PLACES for multi-place moves', () => {
    renderWithTheme(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />
    )
    expect(screen.getByText(/MOVED UP 3 PLACES/)).toBeInTheDocument()
  })

  it('renders PLACE (singular) for one-place move', () => {
    renderWithTheme(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice"
        userId="u1"
        currentRank={4}
        previousRank={5}
        currentPoints={1200}
      />
    )
    expect(screen.getByText(/MOVED UP 1 PLACE/)).toBeInTheDocument()
  })

  it('shows previous and current rank', () => {
    renderWithTheme(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />
    )
    expect(screen.getByText('#6')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
  })

  it('shows current points', () => {
    renderWithTheme(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1250}
      />
    )
    expect(screen.getByText(/1,250 pts/)).toBeInTheDocument()
  })

  it('shows tagline', () => {
    renderWithTheme(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />
    )
    expect(screen.getByText('Can you catch me?')).toBeInTheDocument()
  })

  it('truncates long user names', () => {
    renderWithTheme(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="AVeryLongNameThatExceedsTwentyChars"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />
    )
    // substring(0, 20) = "AVeryLongNameThatExc"
    expect(screen.getByText('AVeryLongNameThatExc…')).toBeInTheDocument()
  })

  it('renders user initials in avatar', () => {
    renderWithTheme(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice Brown"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />
    )
    expect(screen.getByText('AB')).toBeInTheDocument()
  })
})

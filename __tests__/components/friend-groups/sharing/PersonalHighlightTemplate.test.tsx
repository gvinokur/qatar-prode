import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../utils/test-utils'
import PersonalHighlightTemplate from '../../../../app/components/friend-groups/sharing/PersonalHighlightTemplate'

describe('PersonalHighlightTemplate', () => {
  it('renders the Moving Up title', () => {
    renderWithProviders(
      <PersonalHighlightTemplate
        groupName="My Group"
        tournamentName="World Cup"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('Moving Up! 🎉')).toBeInTheDocument()
  })

  it('renders user name', () => {
    renderWithProviders(
      <PersonalHighlightTemplate
        groupName="My Group"
        tournamentName="World Cup"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders group name and tournament in subtitle', () => {
    renderWithProviders(
      <PersonalHighlightTemplate
        groupName="My Group"
        tournamentName="World Cup"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('My Group – World Cup')).toBeInTheDocument()
  })

  it('renders PLACES for multi-place moves', () => {
    renderWithProviders(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText(/MOVED UP 3 PLACES/)).toBeInTheDocument()
  })

  it('renders PLACE (singular) for one-place move', () => {
    renderWithProviders(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice"
        userId="u1"
        currentRank={4}
        previousRank={5}
        currentPoints={1200}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText(/MOVED UP 1 PLACE/)).toBeInTheDocument()
  })

  it('shows previous and current rank', () => {
    renderWithProviders(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('#6')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
  })

  it('shows current points', () => {
    renderWithProviders(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1250}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText(/1,250 pts/)).toBeInTheDocument()
  })

  it('shows tagline', () => {
    renderWithProviders(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('Can you catch me?')).toBeInTheDocument()
  })

  it('truncates long user names', () => {
    renderWithProviders(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="AVeryLongNameThatExceedsTwentyChars"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />,
      { locale: 'en' }
    )
    // substring(0, 20) = "AVeryLongNameThatExc"
    expect(screen.getByText('AVeryLongNameThatExc…')).toBeInTheDocument()
  })

  it('renders user initials in avatar', () => {
    renderWithProviders(
      <PersonalHighlightTemplate
        groupName="G"
        tournamentName="T"
        userName="Alice Brown"
        userId="u1"
        currentRank={3}
        previousRank={6}
        currentPoints={1200}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('AB')).toBeInTheDocument()
  })
})

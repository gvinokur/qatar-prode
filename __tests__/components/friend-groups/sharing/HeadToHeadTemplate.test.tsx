import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../utils/test-utils'
import HeadToHeadTemplate from '../../../../app/components/friend-groups/sharing/HeadToHeadTemplate'

const myStats = {
  totalPoints: 1200,
  groupStagePoints: 800,
  playoffStagePoints: 400,
  accuracy: 65,
}

const theirStats = {
  totalPoints: 1000,
  groupStagePoints: 700,
  playoffStagePoints: 300,
  accuracy: 55,
}

describe('HeadToHeadTemplate', () => {
  it('renders Head to Head title', () => {
    renderWithProviders(
      <HeadToHeadTemplate
        groupName="My Group"
        tournamentName="World Cup"
        myName="Alice"
        myRank={1}
        myUserId="u1"
        myStats={myStats}
        theirName="Bob"
        theirRank={2}
        theirUserId="u2"
        theirStats={theirStats}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('Head to Head')).toBeInTheDocument()
  })

  it('renders group name in subtitle', () => {
    renderWithProviders(
      <HeadToHeadTemplate
        groupName="My Group"
        tournamentName="World Cup"
        myName="Alice"
        myRank={1}
        myUserId="u1"
        myStats={myStats}
        theirName="Bob"
        theirRank={2}
        theirUserId="u2"
        theirStats={theirStats}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('My Group – World Cup')).toBeInTheDocument()
  })

  it('renders both user names', () => {
    renderWithProviders(
      <HeadToHeadTemplate
        groupName="G"
        tournamentName="T"
        myName="Alice"
        myRank={1}
        myUserId="u1"
        myStats={myStats}
        theirName="Bob"
        theirRank={2}
        theirUserId="u2"
        theirStats={theirStats}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders both user ranks', () => {
    renderWithProviders(
      <HeadToHeadTemplate
        groupName="G"
        tournamentName="T"
        myName="Alice"
        myRank={3}
        myUserId="u1"
        myStats={myStats}
        theirName="Bob"
        theirRank={7}
        theirUserId="u2"
        theirStats={theirStats}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('#3')).toBeInTheDocument()
    expect(screen.getByText('#7')).toBeInTheDocument()
  })

  it('renders stat row labels', () => {
    renderWithProviders(
      <HeadToHeadTemplate
        groupName="G"
        tournamentName="T"
        myName="Alice"
        myRank={1}
        myUserId="u1"
        myStats={myStats}
        theirName="Bob"
        theirRank={2}
        theirUserId="u2"
        theirStats={theirStats}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('Total Points')).toBeInTheDocument()
    expect(screen.getByText('Group Stage')).toBeInTheDocument()
    expect(screen.getByText('Knockout')).toBeInTheDocument()
    expect(screen.getByText('Accuracy')).toBeInTheDocument()
  })

  it('shows "You lead by N pts!" when my points are higher', () => {
    renderWithProviders(
      <HeadToHeadTemplate
        groupName="G"
        tournamentName="T"
        myName="Alice"
        myRank={1}
        myUserId="u1"
        myStats={myStats}
        theirName="Bob"
        theirRank={2}
        theirUserId="u2"
        theirStats={theirStats}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText('You lead by 200 pts!')).toBeInTheDocument()
  })

  it('shows opponent lead message when their points are higher', () => {
    const lowerMyStats = { ...myStats, totalPoints: 900 }
    renderWithProviders(
      <HeadToHeadTemplate
        groupName="G"
        tournamentName="T"
        myName="Alice"
        myRank={2}
        myUserId="u1"
        myStats={lowerMyStats}
        theirName="Bob"
        theirRank={1}
        theirUserId="u2"
        theirStats={theirStats}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText("Bob leads by 100 pts – I'm coming!")).toBeInTheDocument()
  })

  it("shows tie message when points are equal", () => {
    const tieStats = { ...theirStats, totalPoints: 1200 }
    renderWithProviders(
      <HeadToHeadTemplate
        groupName="G"
        tournamentName="T"
        myName="Alice"
        myRank={1}
        myUserId="u1"
        myStats={myStats}
        theirName="Bob"
        theirRank={1}
        theirUserId="u2"
        theirStats={tieStats}
      />,
      { locale: 'en' }
    )
    expect(screen.getByText("It's a tie!")).toBeInTheDocument()
  })

  it('truncates long names', () => {
    renderWithProviders(
      <HeadToHeadTemplate
        groupName="G"
        tournamentName="T"
        myName="Alice"
        myRank={1}
        myUserId="u1"
        myStats={myStats}
        theirName="VeryLongNameThatExceedsFourteenChars"
        theirRank={2}
        theirUserId="u2"
        theirStats={theirStats}
      />,
      { locale: 'en' }
    )
    // substring(0, 14) = "VeryLongNameTh"
    expect(screen.getByText('VeryLongNameTh…')).toBeInTheDocument()
  })
})

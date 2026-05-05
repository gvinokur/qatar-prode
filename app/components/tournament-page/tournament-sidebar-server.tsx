import { getGroupsForUser } from '../../actions/prode-group-actions'
import { getGroupStandingsForTournament } from '../../actions/tournament-actions'
import { getGroupRankingForUser } from '../../actions/group-ranking-actions'
import { getGameGuessStatisticsForUsers } from '../../db/game-guess-repository'
import { extractScoringConfig } from '../../utils/tournament-utils'
import TournamentSidebar from './tournament-sidebar'
import type { User } from 'next-auth'

interface TournamentSidebarServerProps {
  readonly tournamentId: string
  readonly user?: User
  readonly tournament: any
}

export default async function TournamentSidebarServer({
  tournamentId,
  user,
  tournament,
}: TournamentSidebarServerProps) {
  const scoringConfig = extractScoringConfig(tournament)
  const groupStandings = await getGroupStandingsForTournament(tournamentId)

  if (!user) {
    return (
      <TournamentSidebar
        tournamentId={tournamentId}
        scoringConfig={scoringConfig}
        groupStandings={groupStandings}
      />
    )
  }

  const [prodeGroups, userGameStatisticsArray] = await Promise.all([
    getGroupsForUser(),
    getGameGuessStatisticsForUsers([user.id], tournamentId),
  ])

  let groupRanks: Record<string, number> = {}
  if (prodeGroups) {
    const allGroups = [...prodeGroups.userGroups, ...prodeGroups.participantGroups]
    const rankResults = await Promise.all(
      allGroups.map((g) => getGroupRankingForUser(user.id, g.id, tournamentId))
    )
    allGroups.forEach((g, i) => {
      const result = rankResults[i]
      if (result !== null) {
        groupRanks[g.id] = result.currentRank
      }
    })
  }

  return (
    <TournamentSidebar
      tournamentId={tournamentId}
      scoringConfig={scoringConfig}
      userGameStatistics={userGameStatisticsArray?.[0]}
      groupStandings={groupStandings}
      prodeGroups={prodeGroups}
      user={user}
      groupRanks={groupRanks}
    />
  )
}

'use server'

import { getTeamsMap } from '../../actions/tournament-actions'
import { getAllTournamentGames } from '../../db/game-repository'
import { findGroupsInTournament } from '../../db/tournament-group-repository'
import { findPlayoffStagesWithGamesInTournament } from '../../db/tournament-playoff-repository'
import PublicGamesPageClient from './public-games-page-client'

interface PublicGamesPageProps {
  readonly tournamentId: string
}

export async function PublicGamesPage({ tournamentId }: PublicGamesPageProps) {
  // Fetch all public data in parallel (no user-specific data needed)
  const [games, teamsMap, groups, rounds] = await Promise.all([
    getAllTournamentGames(tournamentId),
    getTeamsMap(tournamentId),
    findGroupsInTournament(tournamentId),
    findPlayoffStagesWithGamesInTournament(tournamentId),
  ])

  return (
    <PublicGamesPageClient
      games={games}
      teamsMap={teamsMap}
      groups={groups}
      rounds={rounds}
    />
  )
}

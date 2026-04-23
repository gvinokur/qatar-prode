'use server'

import { getLocale } from 'next-intl/server'
import { getTeamsMap } from '../../actions/tournament-actions'
import { getAllTournamentGames } from '../../db/game-repository'
import { applyLocalization } from '../../utils/localization-helper'
import { findGroupsInTournament } from '../../db/tournament-group-repository'
import { findPlayoffStagesWithGamesInTournament } from '../../db/tournament-playoff-repository'
import PublicGamesPageClient from './public-games-page-client'

interface PublicGamesPageProps {
  readonly tournamentId: string
}

export async function PublicGamesPage({ tournamentId }: PublicGamesPageProps) {
  // Fetch all public data in parallel (no user-specific data needed)
  const [games, teamsMap, groups, rounds, locale] = await Promise.all([
    getAllTournamentGames(tournamentId),
    getTeamsMap(tournamentId),
    findGroupsInTournament(tournamentId),
    findPlayoffStagesWithGamesInTournament(tournamentId),
    getLocale(),
  ])

  const localizedGames = games.map(game => ({
    ...game,
    playoffStage: game.playoffStage
      ? applyLocalization(game.playoffStage, locale, [{ field: 'round_name', i18nField: 'round_name_i18n' }])
      : game.playoffStage
  }));

  return (
    <PublicGamesPageClient
      games={localizedGames}
      teamsMap={teamsMap}
      groups={groups}
      rounds={rounds}
    />
  )
}

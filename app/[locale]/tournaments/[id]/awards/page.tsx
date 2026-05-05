'use server'

import { Metadata } from 'next'
import {Box} from "../../../../components/mui-wrappers";
import {findAllPlayersInTournamentWithTeamData} from "../../../../db/player-repository";
import {DebugObject} from "../../../../components/debug";
import {findTournamentGuessByUserIdTournament} from "../../../../db/tournament-guess-repository";
import {getLoggedInUser} from "../../../../actions/user-actions";
import {redirect} from "next/navigation";
import {TournamentGuessNew} from "../../../../db/tables-definition";
import AwardsPanel from "../../../../components/awards/award-panel";
import {
  getPlayoffRounds,
  getTeamsMap,
  getTournamentStartDate
} from "../../../../actions/tournament-actions";
import { getAllTournamentGames } from '../../../../db/game-repository';
import { findGameGuessesByUserId } from '../../../../db/game-guess-repository';
import { getTournamentPredictionCompletion } from '../../../../db/tournament-prediction-completion-repository';
import { getTranslations, getLocale } from 'next-intl/server';
import { buildTournamentMetadata, findTournamentByIdCached } from '../../../../utils/metadata-utils'
import JsonLd from '../../../../components/shared/json-ld'
import { buildBreadcrumbListJsonLd } from '../../../../utils/json-ld-utils'
import { PREDICTION_LOCK_OFFSET_MS } from '../../../../utils/prediction-constants'

type Props = {
  readonly params: Promise<{
    id: string
  }>
  readonly searchParams: Promise<{[k:string]:string}>
}

const buildTournamentGuesses = (userId: string, tournamentId: string) => ({
  user_id: userId,
  tournament_id: tournamentId
} as TournamentGuessNew)

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const locale = await getLocale()
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tAwards = await getTranslations({ locale, namespace: 'awards' })
  const appName = tCommon('app.name')

  return buildTournamentMetadata(
    id,
    appName,
    (t) => `${tAwards('metadata.title')} – ${t.long_name} | ${appName}`,
    (t) => tAwards('metadata.description', { name: t.long_name })
  )
}

export default async function Awards(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const locale = await getLocale()
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tAwards = await getTranslations({ locale, namespace: 'awards' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const user = await getLoggedInUser()
  if(!user) {
    redirect(`/es/tournaments/${params.id}`)
  }

  // Fetch all required data in parallel
  const [tournamentGuesses, allPlayers, tournamentStartDate, teamsMap, tournament, playoffStages, games, gameGuessesArray] = await Promise.all([
    findTournamentGuessByUserIdTournament(user.id, params.id).then(result => result || buildTournamentGuesses(user.id, params.id)),
    findAllPlayersInTournamentWithTeamData(params.id),
    getTournamentStartDate(params.id),
    getTeamsMap(params.id),
    findTournamentByIdCached(params.id),
    getPlayoffRounds(params.id),
    getAllTournamentGames(params.id),
    findGameGuessesByUserId(user.id, params.id)
  ]);

  const teams = Object.values(teamsMap).sort((a, b) => a.name.localeCompare(b.name))

  // Check if tournament has a third place game
  const hasThirdPlaceGame = playoffStages.some(stage => stage.is_third_place)

  // Fetch tournament prediction completion (needs tournament object)
  // Pass tournamentStartDate (already fetched above) to skip a redundant DB call
  const tournamentPredictionCompletion = tournament
    ? await getTournamentPredictionCompletion(user.id, params.id, tournament, tournamentStartDate)
    : null

  // Get tournament start time to check if predictions are still allowed
  const currentTime = new Date()
  const isPredictionLocked = (currentTime.getTime() - tournamentStartDate.getTime()) >= PREDICTION_LOCK_OFFSET_MS;

  return (
    <>
      {tournament && (
        <JsonLd data={buildBreadcrumbListJsonLd([
          { name: tCommon('breadcrumb.home'), url: `${appUrl}/${locale}` },
          { name: tournament.long_name, url: `${appUrl}/${locale}/tournaments/${params.id}` },
          { name: tAwards('metadata.title'), url: `${appUrl}/${locale}/tournaments/${params.id}/awards` },
        ])} />
      )}
      <Box pt={2}>
      {searchParams.hasOwnProperty('debug') && (
        <DebugObject object={{
          allPlayers,
          tournamentGuesses,
          tournamentStartDate,
          hasThirdPlaceGame,
          isPredictionLocked,
          tournament
        }}/>
      )}
      {tournament && <AwardsPanel
        allPlayers={allPlayers}
        tournamentGuesses={tournamentGuesses}
        teams={teams}
        hasThirdPlaceGame={hasThirdPlaceGame}
        isPredictionLocked={isPredictionLocked}
        tournament={tournament}
        games={games}
        gameGuessesArray={gameGuessesArray}
        tournamentPredictionCompletion={tournamentPredictionCompletion}
        tournamentStartDate={tournamentStartDate}
        teamsMap={teamsMap}
      />}
      </Box>
    </>
  )
}

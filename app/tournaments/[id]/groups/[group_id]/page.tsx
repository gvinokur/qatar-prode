'use server'

import {getCompleteGroupData} from "../../../../actions/tournament-actions";
import {DebugObject} from "../../../../components/debug";
import GroupSelector from "../../../../components/groups-page/group-selector";
import {Box, Grid} from "../../../../components/mui-wrappers";
import {GameGuess} from "../../../../db/tables-definition";
import GameView from "../../../../components/game-view";
import {ExtendedGameData} from "../../../../definitions";
import {GuessesContextProvider, GuessesContext} from "../../../../components/context-providers/guesses-context-provider";
import GroupTable from "../../../../components/groups-page/group-table";
import SaveComponent from "../../../../components/groups-page/save-component";
import {findGameGuessesByUserId} from "../../../../db/game-guess-repository";
import {getLoggedInUser} from "../../../../actions/user-actions";
import {redirect} from "next/navigation";

type Props = {
  params: {
    group_id: string
    id: string
  }
  searchParams: {[k:string]:string}
}

export default async function GroupComponent({params, searchParams} : Props) {
  const user = await getLoggedInUser();
  if(!user) {
    redirect('/')
  }
  const groupId = params.group_id
  const completeGroupData = await getCompleteGroupData(groupId)
  const userGameGuesses = await findGameGuessesByUserId(user.id)
  const gameGuesses:{[k: string]: GameGuess} = Object.fromEntries(
    userGameGuesses.map(gameGuess => [gameGuess.game_id, gameGuess])
  )

  return(
    <>
      {searchParams.hasOwnProperty('debug') && (<DebugObject object={completeGroupData}/>)}
      <GuessesContextProvider gameGuesses={gameGuesses}>
        <Grid container spacing={4} mt={'8px'}>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              {completeGroupData.games
                .sort((a,b) => a.game_number - b.game_number)
                .map(game => (
                  <Grid key={game.game_number} item xs={6}>
                    <GameView game={game} teamsMap={completeGroupData.teamsMap}/>
                  </Grid>
                ))
              }
            </Grid>
          </Grid>
          <GroupTable games={completeGroupData.games} teamsMap={completeGroupData.teamsMap}/>
        </Grid>
      </GuessesContextProvider>
    </>
  )
}

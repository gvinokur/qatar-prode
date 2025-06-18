'use client'

import { Card, CardContent, CardHeader, Grid, useTheme} from "@mui/material";
import {Team} from "../../db/tables-definition";
import {ExtendedGameData} from "../../definitions";
import CompactGameViewCard from "../compact-game-view-card";
import { useRouter } from "next/navigation";

type FixturesProps = {
  games: ExtendedGameData[]
  teamsMap: {[k:string]: Team}
}

export function Fixtures( { games, teamsMap} : FixturesProps) {
  const theme = useTheme()
  const router = useRouter()
  
  return (
    <Card>
      <CardHeader
        title='Resultados y Proximos Partidos'
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
      />
      <CardContent>
        <Grid container spacing={1}>
          {games.map(game => (
            <Grid key={game.game_number} size={12}>
              <CompactGameViewCard
                isGameGuess={false}
                gameNumber={game.game_number}
                gameDate={game.game_date}
                location={game.location}
                gameTimezone={game.game_local_timezone}
                homeTeamNameOrDescription={game.home_team && teamsMap[game.home_team].name || 'Unknown'}
                awayTeamNameOrDescription={game.away_team && teamsMap[game.away_team].name || 'Unknown'}
                homeTeamTheme={game.home_team && teamsMap[game.home_team].theme || undefined}
                awayTeamTheme={game.away_team && teamsMap[game.away_team].theme || undefined}
                homeScore={!game.gameResult?.is_draft ? game.gameResult?.home_score : undefined}
                awayScore={!game.gameResult?.is_draft ? game.gameResult?.away_score : undefined}
                homePenaltyScore={!game.gameResult?.is_draft ? game.gameResult?.home_penalty_score : undefined}
                awayPenaltyScore={!game.gameResult?.is_draft ? game.gameResult?.away_penalty_score : undefined}
                isPlayoffGame={game.game_type !== 'group'}
                disabled={true}
                onEditClick={() => {
                  if(game.game_type === 'group') {
                    router.push(`/tournaments/${game.tournament_id}/groups/${game.group?.tournament_group_id}`)
                  } else {
                    router.push(`/tournaments/${game.tournament_id}/playoffs?stage=${game.playoffStage?.round_name}`)
                  }
                }}
                isGameFixture={true}
                groupOrPlayoffText={game.game_type === 'group' ? `Grupo ${game.group?.group_letter}` : (game.playoffStage?.round_name || 'Playoffs')}
                />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

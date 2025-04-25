'use client'

import { Card, CardContent, CardHeader, Chip, Grid, Typography, useTheme} from "@mui/material";
import {Fragment} from "react";
import {Team} from "../../db/tables-definition";
import {ExtendedGameData} from "../../definitions";
import CompactGameViewCard from "../compact-game-view-card";

type FixturesProps = {
  games: ExtendedGameData[]
  teamsMap: {[k:string]: Team}
}

export function Fixtures( { games, teamsMap} : FixturesProps) {
  const theme = useTheme()
  return (
    <Card>
      <CardHeader
        title='Resultados y Proximos Partidos'
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
      />
      <CardContent>
        <Grid container spacing={1}>
          {games.map(game => (
            <Grid item xs={12} key={game.game_number}>
              <CompactGameViewCard
                isGameGuess={false}
                gameNumber={game.game_number}
                gameDate={game.game_date}
                location={game.location}
                homeTeamNameOrDescription={game.home_team && teamsMap[game.home_team].name || 'Unknown'}
                awayTeamNameOrDescription={game.away_team && teamsMap[game.away_team].name || 'Unknown'}
                homeTeamTheme={game.home_team && teamsMap[game.home_team].theme || undefined}
                awayTeamTheme={game.away_team && teamsMap[game.away_team].theme || undefined}
                homeScore={game.gameResult?.home_score}
                awayScore={game.gameResult?.away_score}
                homePenaltyScore={game.gameResult?.home_penalty_score}
                awayPenaltyScore={game.gameResult?.away_penalty_score}
                isPlayoffGame={game.game_type !== 'group'}
                disabled={true}
                onEditClick={() => {}}/>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

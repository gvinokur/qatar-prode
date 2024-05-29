'use client'
import {
  Avatar,
  Box, Grid, Hidden,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery
} from "@mui/material";
import {Close as MissIcon, Done as HitIcon} from "@mui/icons-material";
import {useTheme} from "@mui/system";
import {useContext, useEffect, useState} from "react";
import {GuessesContext} from "../context-providers/guesses-context-provider";
import {TeamStats} from "../../../types/definitions";
import {ExtendedGameData} from "../../definitions";
import {Team} from "../../db/tables-definition";
import {calculateGroupPosition} from "../../utls/group-position-calculator";
import SaveComponent from "./save-component";

type Props = {
  games: ExtendedGameData[],
  teamsMap: {[k:string]: Team}
}

export default function GroupTable({games, teamsMap} : Props) {
  const xsMatch = useMediaQuery('(min-width:900px)')
  const theme = useTheme();
  const {gameGuesses} = useContext(GuessesContext)
  const [groupPositionsByGuess, setGroupPositionsByGuess] = useState<TeamStats[]>([])
  const [groupPositions, setGroupPositions] = useState<TeamStats[]>([])
  const [usePredictionsTable, setUsePredictionsTable] = useState(true)

  useEffect(() => {
    const teamIds = Object.keys(teamsMap)
    const guessedGroupPositions = calculateGroupPosition(teamIds, games.map(game => ({
      ...game,
      resultOrGuess: gameGuesses[game.id]
    })))
    const resultGroupPositions = calculateGroupPosition(teamIds, games.map(game => ({
      ...game,
      resultOrGuess: game.gameResult
    })))

    setGroupPositions(resultGroupPositions)
    setGroupPositionsByGuess(guessedGroupPositions)
  }, [gameGuesses, games, teamsMap])

  const allGroupGamesPlayed = games
    .filter(game =>
      (!Number.isInteger(game.gameResult?.home_score) || !Number.isInteger(game.gameResult?.away_score))
    ).length === 0;

  return (
    <Grid item xs={12} md={6} mb={xsMatch ? 0 : 12}>
      <Box display='flex'>
        <Typography variant={'h5'} component='a' flexGrow={1}
                    sx={{ textDecoration: 'underline', cursor: 'pointer'}}
                    color={usePredictionsTable ? 'primary.main' : ''}
                    onClick={() => setUsePredictionsTable(true)}>
          Tabla de Pronosticos
        </Typography>
        <Typography variant={'h5'} component='a' flexGrow={1}
                    sx={{ textDecoration: 'underline', cursor: 'pointer'}}
                    textAlign='right'
                    color={!usePredictionsTable ? 'primary.main' : ''}
                    onClick={() => setUsePredictionsTable(false)}>
          Tabla Real
        </Typography>
      </Box>
      <Paper>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main'}}>
              <TableCell sx={{ color: 'primary.contrastText'}}>Pos</TableCell>
              <TableCell sx={{ color: 'primary.contrastText'}}>Equipo</TableCell>
              <TableCell sx={{ color: 'primary.contrastText'}}>Pts</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', display: { xs: 'none', md: 'table-cell' }}}>G</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', display: { xs: 'none', md: 'table-cell' }}}>E</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', display: { xs: 'none', md: 'table-cell' }}}>P</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', display: { xs: 'none', md: 'table-cell' }}}>GF</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', display: { xs: 'none', md: 'table-cell' }}}>GC</TableCell>
              <TableCell sx={{ color: 'primary.contrastText'}}>DG</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(usePredictionsTable ? groupPositionsByGuess : groupPositions).map((teamStats, index) => (
              <TableRow key={index} sx={[0,1].includes(index) ? {backgroundColor: 'primary.contrastText'} : {}}>
                <TableCell>{index + 1}</TableCell>
                <TableCell sx={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }} >
                  {usePredictionsTable && allGroupGamesPlayed && index < 2 && (
                    <Box sx={{ float: 'right'}}>
                      {teamStats.team === groupPositions[0].team || teamStats.team === groupPositions[1].team ?
                        (<Avatar title='Pronostico Correcto' sx={{ width: '18px', height: '18px', bgcolor: theme.palette.success.light }}><HitIcon sx={{ width: '12px', height: '12px'}}/></Avatar>):
                        (<Avatar title='Pronostico Errado' sx={{ width: '18px', height: '18px', bgcolor: theme.palette.error.main }}><MissIcon sx={{ width: '12px', height: '12px'}}/></Avatar>)}
                    </Box>
                  )}
                  {teamsMap[teamStats.team].name}
                </TableCell>
                <TableCell>{teamStats.points}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{teamStats.win}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{teamStats.draw}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{teamStats.loss}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{teamStats.goalsFor}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{teamStats.goalsAgainst}</TableCell>
                <TableCell>{teamStats.goalDifference}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <SaveComponent/>
    </Grid>
  )
}

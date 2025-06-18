'use client'
import {
  Avatar,
  Box,
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
import {useContext, useState} from "react";
import {GuessesContext} from "../context-providers/guesses-context-provider";
import {Team, TeamStats} from "../../db/tables-definition";

type Props = {
  isPredictions: boolean,
  teamsMap: {[k:string]: Team}
  qualifiedTeams?: Team[]
  qualifiedTeamGuesses?: Team[]
  realPositions: TeamStats[]
}

export default function GroupTable({teamsMap, isPredictions, qualifiedTeams = [], qualifiedTeamGuesses = [], realPositions} : Props) {
  const xsMatch = useMediaQuery('(min-width:900px)')
  const theme = useTheme();
  const {guessedPositions: groupPositionsByGuess} = useContext(GuessesContext)
  const [usePredictionsTable, setUsePredictionsTable] = useState(isPredictions)

  const groupIsComplete = realPositions.every(position => position.is_complete)
  const groupGuessIsComplete = groupPositionsByGuess.every(guess => guess.is_complete)

  const showScoreIndicator = groupIsComplete && groupGuessIsComplete

  return (
    <Box mb={xsMatch ? 0 : 12}>
      {isPredictions && (
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
      )}
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
            {(usePredictionsTable ? groupPositionsByGuess : realPositions).map((teamStats, index) => (
              <TableRow key={index} sx={
                (usePredictionsTable ? qualifiedTeamGuesses : qualifiedTeams)?.find(qualifiedTeam => qualifiedTeam.id === teamStats.team_id) ?
                  {backgroundColor: 'secondary.main'} :
                  {}
              }>
                <TableCell>
                {usePredictionsTable &&
                    showScoreIndicator && (
                    <Box sx={{ float: 'right'}}>
                      {(teamStats.team_id === realPositions[index].team_id) ?
                        (<Avatar title='Pronostico de Posicion Correcto' sx={{ width: '18px', height: '18px', bgcolor: theme.palette.success.light }}><HitIcon sx={{ width: '12px', height: '12px'}}/></Avatar>):
                        (<Avatar title='Pronostico de Posicion Errado' sx={{ width: '18px', height: '18px', bgcolor: theme.palette.error.main }}><MissIcon sx={{ width: '12px', height: '12px'}}/></Avatar>)}
                    </Box>
                  )}
                  {index + 1}
                </TableCell>
                <TableCell sx={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }} >
                  {usePredictionsTable &&
                    showScoreIndicator &&
                    qualifiedTeamGuesses?.find(qualifiedTeam => qualifiedTeam.id === teamStats.team_id) &&
                    qualifiedTeams.length > 0  && (
                    <Box sx={{ float: 'right'}}>
                      {qualifiedTeams?.find(qualifiedTeam => qualifiedTeam.id === teamStats.team_id) ?
                        (<Avatar title='Pronostico de Clasificacion Correcto' sx={{ width: '18px', height: '18px', bgcolor: theme.palette.success.light }}><HitIcon sx={{ width: '12px', height: '12px'}}/></Avatar>):
                        (<Avatar title='Pronostico de Clasificacion Errado' sx={{ width: '18px', height: '18px', bgcolor: theme.palette.error.main }}><MissIcon sx={{ width: '12px', height: '12px'}}/></Avatar>)}
                    </Box>
                  )}
                  {teamsMap[teamStats.team_id].name}
                </TableCell>
                <TableCell>{teamStats.points}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{teamStats.win}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{teamStats.draw}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{teamStats.loss}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{teamStats.goals_for}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{teamStats.goals_against}</TableCell>
                <TableCell>{teamStats.goal_difference}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

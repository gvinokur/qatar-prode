'use client'

import { Box, Card, CardHeader, IconButton, Collapse } from '@mui/material';
import { useState, useContext, useMemo } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { PredictionStatusBar } from './prediction-status-bar';
import { TournamentPredictionCompletion, Team } from '../db/tables-definition';
import { ExtendedGameData } from '../definitions';
import { GuessesContext } from './context-providers/guesses-context-provider';

interface UnifiedGamesDashboardClientProps {
  readonly totalGames: number;
  readonly predictedGames: number;
  readonly silverUsed: number;
  readonly silverMax: number;
  readonly goldenUsed: number;
  readonly goldenMax: number;
  readonly tournamentPredictions?: TournamentPredictionCompletion;
  readonly tournamentId: string;
  readonly tournamentStartDate: Date | undefined;
  readonly closingGames: ExtendedGameData[];
  readonly teamsMap: Record<string, Team>;
}

export function UnifiedGamesDashboardClient({
  totalGames,
  silverUsed,
  silverMax,
  goldenUsed,
  goldenMax,
  tournamentPredictions,
  tournamentId,
  tournamentStartDate,
  closingGames,
  teamsMap
}: UnifiedGamesDashboardClientProps) {
  const [dashboardExpanded, setDashboardExpanded] = useState(true);
  const guessesContext = useContext(GuessesContext);

  // Calculate predicted games from context
  const predictedGames = useMemo(() => {
    if (!guessesContext.gameGuesses) return 0;
    return Object.values(guessesContext.gameGuesses).filter(guess =>
      guess && guess.home_score !== null && guess.away_score !== null
    ).length;
  }, [guessesContext.gameGuesses]);

  return (
    <Card>
      <CardHeader
        title="Dashboard de Predicciones"
        action={
          <IconButton
            onClick={() => setDashboardExpanded(!dashboardExpanded)}
            aria-label={dashboardExpanded ? 'colapsar' : 'expandir'}
            size="small"
          >
            {dashboardExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
        sx={{
          py: 1,
          px: 2,
          '& .MuiCardHeader-title': {
            fontSize: '1rem',
            fontWeight: 600
          }
        }}
      />
      <Collapse in={dashboardExpanded} timeout="auto" unmountOnExit>
        <Box sx={{ px: 2, pb: 2 }}>
          <PredictionStatusBar
            totalGames={totalGames}
            predictedGames={predictedGames}
            silverUsed={silverUsed}
            silverMax={silverMax}
            goldenUsed={goldenUsed}
            goldenMax={goldenMax}
            tournamentPredictions={tournamentPredictions}
            tournamentId={tournamentId}
            tournamentStartDate={tournamentStartDate}
            games={closingGames}
            teamsMap={teamsMap}
            isPlayoffs={false}
          />
        </Box>
      </Collapse>
    </Card>
  );
}

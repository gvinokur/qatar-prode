"use client";
import React, { useCallback, useEffect } from "react";
import { Tabs, Tab, Box, useMediaQuery, useTheme } from "@mui/material";
import { Grid } from '../mui-wrappers';
import GamesGrid from '../games-grid';
import { PredictionDashboard } from '../prediction-dashboard';
import { ExtendedGameData } from "../../definitions";
import type { Tournament } from "../../db/tables-definition";


export type Section = { section: string; games: ExtendedGameData[] };

export interface TabbedPlayoffsPageProps {
  sections: Section[];
  teamsMap: Record<string, any>;
  isLoggedIn?: boolean;
  isAwardsPredictionLocked?: boolean;
  tournamentId?: string;
  enablePredictionDashboard?: boolean;
  tournament?: Tournament;
  dashboardStats?: {
    totalGames: number;
    predictedGames: number;
    silverUsed: number;
    goldenUsed: number;
  };
  closingGames?: ExtendedGameData[];
}

const TabbedPlayoffsPage: React.FC<TabbedPlayoffsPageProps> = ({
  sections,
  teamsMap,
  isLoggedIn = true,
  isAwardsPredictionLocked = false,
  tournamentId,
  enablePredictionDashboard = false,
  tournament,
  dashboardStats,
  closingGames = []
}) => {
  const [selectedTab, setSelectedTab] = React.useState(0);
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.up('sm'));

  // Memoized function to find the section with the game closest to today's date
  const findClosestSectionToToday = useCallback(() => {
    const today = new Date();
    let closestSectionIndex = 0;
    let minDateDifference = Infinity;

    sections.forEach((section, sectionIndex) => {
      section.games.forEach((game) => {
        if (game.game_date) {
          const dateDifference = Math.abs(today.getTime() - game.game_date.getTime());
          
          if (dateDifference < minDateDifference) {
            minDateDifference = dateDifference;
            closestSectionIndex = sectionIndex;
          }
        }
      });
    });

    return closestSectionIndex;
  }, [sections]);

  // Set the initial tab based on the closest game to today's date
  useEffect(() => {
    const closestSectionIndex = findClosestSectionToToday();
    setSelectedTab(closestSectionIndex);
  }, [findClosestSectionToToday]);

  return (
    <Grid container mt={'16px'} maxWidth={'800px'} mx={'auto'}>
      <Grid size={12} mb={'16px'}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant={ isSmallScreen ? 'standard' : 'scrollable'}
          scrollButtons="auto"
          allowScrollButtonsMobile
          centered
          aria-label="Rondas de Playoffs"
          slotProps={{
            indicator: {
              sx: {
                backgroundColor: 'transparent',
              },
              
            },
            root: {
              sx: {
                height: '36px',
              },
            },
            scrollButtons: {
              sx: {
                color: 'secondary.contrastText',
                minHeight: '36px',
                height: '36px',
              },
            },
          }}
          sx={{ mb: 2 }}
        >
          {sections.map((section, idx) => (
            <Tab 
              key={section.section} 
              label={section.section} 
              value={idx} 
              sx={{
                minHeight: '36px',
                height: '36px',
                color: 'secondary.contrastText',
                '&.Mui-selected': {
                  color: 'background.paper',
                  backgroundColor: 'secondary.contrastText',
                  borderRadius: '4px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                },
              }}
            />
          ))}
        </Tabs>
        {sections.map((section, idx) => (
          <Box
            key={section.section}
            role="tabpanel"
            hidden={selectedTab !== idx}
            id={`tabpanel-${idx}`}
            aria-labelledby={`tab-${idx}`}
            sx={{ width: '100%' }}
          >
            {selectedTab === idx && (
              enablePredictionDashboard && isLoggedIn && tournament && dashboardStats ? (
                <PredictionDashboard
                  games={section.games}
                  teamsMap={teamsMap}
                  tournament={tournament}
                  isPlayoffs={true}
                  isLoggedIn={isLoggedIn}
                  tournamentId={tournamentId || ''}
                  isAwardsPredictionLocked={isAwardsPredictionLocked}
                  dashboardStats={dashboardStats}
                  closingGames={closingGames}
                />
              ) : (
                <GamesGrid
                  isPlayoffs={true}
                  games={section.games}
                  teamsMap={teamsMap}
                  isLoggedIn={isLoggedIn}
                  isAwardsPredictionLocked={isAwardsPredictionLocked}
                  tournamentId={tournamentId}
                />
              )
            )}
          </Box>
        ))}
      </Grid>
    </Grid>
  );
};

export default TabbedPlayoffsPage; 
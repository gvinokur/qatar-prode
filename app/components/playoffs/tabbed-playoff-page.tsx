"use client";
import React from "react";
import { Tabs, Tab, Box, useMediaQuery, useTheme } from "@mui/material";
import { Grid } from '../mui-wrappers';
import GamesGrid from '../games-grid';
import { GuessesContextProvider } from '../context-providers/guesses-context-provider';
import { unstable_ViewTransition as ViewTransition } from 'react';

export type Section = { section: string; games: any[] };

export interface TabbedPlayoffsPageProps {
  sections: Section[];
  teamsMap: Record<string, any>;
}

const TabbedPlayoffsPage: React.FC<TabbedPlayoffsPageProps> = ({ sections, teamsMap }) => {
  const [selectedTab, setSelectedTab] = React.useState(0);
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.up('sm'));

  
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
            
          }}
          sx={{ mb: 2 }}
        >
          {sections.map((section, idx) => (
            <Tab 
              key={section.section} 
              label={section.section} 
              value={idx} 
              sx={{
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
              <GamesGrid
                isPlayoffs={true}
                games={section.games}
                teamsMap={teamsMap}
              />
            )}
          </Box>
        ))}
      </Grid>
    </Grid>
  );
};

export default TabbedPlayoffsPage; 
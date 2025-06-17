'use client'

import React, { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { getLoggedInUser } from '../../actions/user-actions';
import { getUserScoresForTournament, getUsersForGroup } from '../../actions/prode-group-actions';

interface FooterProps {
  imageUrl?: string;
  message: string;
}

// Environment variables for teasing footer feature
const TEASING_FOOTER_GROUP_ID = process.env.NEXT_PUBLIC_TEASING_FOOTER_GROUP_ID;
const TEASING_FOOTER_TOURNAMENT_ID = process.env.NEXT_PUBLIC_TEASING_FOOTER_TOURNAMENT_ID;

function Footer({ imageUrl, message }: FooterProps) {
  const [infoMessage, setInfoMessage] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    async function fetchUserInfo() {
      const user = await getLoggedInUser();
      if (user && TEASING_FOOTER_GROUP_ID && TEASING_FOOTER_TOURNAMENT_ID) {
        try {
          const participants = await getUsersForGroup(TEASING_FOOTER_GROUP_ID)
          const userScores = await getUserScoresForTournament(participants, TEASING_FOOTER_TOURNAMENT_ID);
          const currentUserPosition = userScores.findIndex((s) => s.userId === user.id);

          if(currentUserPosition === -1) return;

          // If the user is in the first position, even if he has the same score as the first one, show a message
          if (userScores[currentUserPosition].totalPoints === userScores[0].totalPoints) {
            setInfoMessage('👑👑 Grande Rey, vas primero, a ver si te podes mantener!! 👑👑');
          } else if (userScores[currentUserPosition].totalPoints === userScores[userScores.length - 1].totalPoints) {
            setInfoMessage('💩💩 Vas Ultimo, caquita!! 💩💩');
          }
        } catch (error) {
          console.error('Error fetching user info for footer:', error);
        }
      }
    }

    fetchUserInfo();
  }, []);

  return (
    <AppBar
      position="fixed"
      color="primary"
      sx={{
        top: 'auto',
        bottom: 0,
        backgroundColor: '#222',
        color: '#fff',
        zIndex: 1300,
      }}
      component="footer"
      elevation={3}
    >
      <Toolbar sx={{ justifyContent: 'center', flexDirection: 'column', minHeight: 56 }}>
        {imageUrl && (
          <Box
            component="img"
            src={imageUrl}
            alt="Footer Logo"
            sx={{ height: 32, mb: 1 }}
          />
        )}
        <Typography variant="body2" sx={{ fontSize: 14 }}>
          {infoMessage || message}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Footer; 
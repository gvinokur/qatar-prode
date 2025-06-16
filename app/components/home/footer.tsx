'use server'

import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { getLoggedInUser } from '../../actions/user-actions';
import { findParticipantsInGroup, findProdeGroupById, findProdeGroupsByOwner } from '../../db/prode-group-repository';
import { getUserScoresForTournament } from '../../actions/prode-group-actions';

interface FooterProps {
  imageUrl?: string;
  message: string;
}

const CUSTOM_GROUP_ID = '0d5e32d4-dde1-4464-a24e-d0ebf62df912';
const CUSTOM_GROUP_ID_TEST = 'b53056b5-74bd-468d-9777-b0275f8001ff';
const CUSTOM_TOURNAMENT_ID = 'e1ec7f7e-9e4a-4fb8-a69d-20856e26ab9d';

async function Footer({ imageUrl, message }: FooterProps) {
  const user = await getLoggedInUser();
  let infoMessage: React.ReactNode | null = null;
  if(user) {
    //Hacky hacky
    const filialWhatsAppGroup = await findProdeGroupById(CUSTOM_GROUP_ID)    
    const participants = [filialWhatsAppGroup.owner_user_id, ...(await findParticipantsInGroup(filialWhatsAppGroup.id)).map((p) => p.user_id)]
    const userScores = await getUserScoresForTournament(participants, CUSTOM_TOURNAMENT_ID);
    const currentUserPosition = userScores.findIndex((s) => s.userId === user.id);
    if(currentUserPosition === 0) {
      infoMessage = (
      <Typography variant="body2" sx={{ fontSize: 14 }}>
        👑👑 Grande Rey, vas primero, a ver si te podes mantener!! 👑👑
      </Typography>
      )
    } else if (currentUserPosition === userScores.length - 1) {
      infoMessage = (
        <Typography variant="body2" sx={{ fontSize: 14 }}>
          💩💩 Vas Ultimo, caquita!! 💩💩
        </Typography>
      )
    }

  }

  return <AppBar
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
};

export default Footer; 
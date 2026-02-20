'use client'

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useMediaQuery, useTheme } from '@mui/material';
import { usePathname } from 'next/navigation';
import { getLoggedInUser } from '../../actions/user-actions';
import { getUserScoresForTournament, getUsersForGroup } from '../../actions/prode-group-actions';

interface FooterProps {
  readonly imageUrl?: string;
  readonly message: string;
}

// Environment variables for teasing footer feature
const TEASING_FOOTER_GROUP_ID = process.env.NEXT_PUBLIC_TEASING_FOOTER_GROUP_ID;
const TEASING_FOOTER_TOURNAMENT_ID = process.env.NEXT_PUBLIC_TEASING_FOOTER_TOURNAMENT_ID;

function Footer({ imageUrl, message }: FooterProps) {
  const t = useTranslations('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const isInTournamentContext = pathname.startsWith('/tournaments/');

  const [infoMessage, setInfoMessage] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    async function fetchUserInfo() {
      const user = await getLoggedInUser();
      if (user && TEASING_FOOTER_GROUP_ID && TEASING_FOOTER_TOURNAMENT_ID) {
        try {
          const participants = await getUsersForGroup(TEASING_FOOTER_GROUP_ID)
          const userScores = 
            (await getUserScoresForTournament(participants, TEASING_FOOTER_TOURNAMENT_ID))
              .sort((a, b) => b.totalPoints - a.totalPoints);

          const currentUserPosition = userScores.findIndex((s) => s.userId === user.id);

          if(currentUserPosition === -1) return;

          // If the user is in the first position, even if he has the same score as the first one, show a message
          if (userScores[currentUserPosition].totalPoints === userScores[0].totalPoints) {
            setInfoMessage(t('footer.teasingMessages.firstPlace'));
          } else if (userScores[currentUserPosition].totalPoints === userScores[userScores.length - 1].totalPoints) {
            setInfoMessage(t('footer.teasingMessages.lastPlace'));
          }
        } catch (error) {
          console.error('Error fetching user info for footer:', error);
        }
      }
    }

    fetchUserInfo();
  }, []);

  // Hide footer on mobile when in tournament context (bottom nav takes precedence)
  if (isMobile && isInTournamentContext) {
    return null;
  }

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
            alt={t('footer.logoAlt')}
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
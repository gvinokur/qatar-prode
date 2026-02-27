'use client'

import {Tournament, User} from "../../db/tables-definition";
import {UserScore} from "../../definitions";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Typography,
  Chip,
} from "@mui/material";
import {useState} from "react";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import NotificationDialog from "./notification-dialog";
import LeaderboardView from '../leaderboard/LeaderboardView';
import { useTranslations } from 'next-intl';

type Props = {
  readonly users: {[k:string]: User},
  readonly userScoresByTournament: {[k:string]: UserScore[]},
  readonly loggedInUser: string,
  readonly tournaments: Tournament[],
  readonly action?: React.ReactNode,
  readonly groupId: string,
  readonly ownerId: string,
  readonly members: { id: string, nombre: string, is_admin?: boolean }[],
  readonly bettingData: { [tournamentId: string]: { config: any, payments: any[] } }
  readonly selectedTournamentId?: string,
  readonly pendingRequestCount?: number
}

export default function ProdeGroupTable({users, userScoresByTournament, loggedInUser, tournaments, action, groupId, ownerId, members, bettingData, selectedTournamentId, pendingRequestCount}: Props) {
  const t = useTranslations('groups.standings');

  const [selectedTab, setSelectedTab] = useState<string>(selectedTournamentId || tournaments[0]?.id || '')
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({open: false, message: '', severity: 'success'});
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const isAdmin = ownerId === loggedInUser || !!members.find(m => m.id === loggedInUser && m.is_admin);

  if (tournaments.length === 0) {
    return (
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              {t('title')}
              {isAdmin && pendingRequestCount && pendingRequestCount > 0 && (
                <Chip label={pendingRequestCount} color="error" size="small" />
              )}
            </Box>
          }
          action={action}
        />
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {t('empty')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            {t('title')}
            {isAdmin && pendingRequestCount && pendingRequestCount > 0 && (
              <Chip label={pendingRequestCount} color="error" size="small" />
            )}
          </Box>
        }
        action={action}
      />
      <CardContent>
        <TabContext value={selectedTab || tournaments[0]?.id || ''}>
          {tournaments.length > 1 && (
            <TabList
              onChange={(event, tabSelected) => setSelectedTab(tabSelected)}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="scrollable auto tabs example"
            >
              {tournaments.map(tournament=> (
                <Tab label={tournament.short_name} key={tournament.id} value={tournament.id}/>
              ))}
            </TabList>
          )}
          {tournaments.map((tournament) => {
            // Transform UserScore to include userName and detailed point breakdown
            const transformedScores = (userScoresByTournament[tournament.id] || []).map(score => ({
              ...score,
              userName: users[score.userId]?.nickname || users[score.userId]?.email || 'Unknown User',
              yesterdayTotalPoints: score.yesterdayTotalPoints,
              groupStagePoints: score.groupStageScore + score.groupStageQualifiersScore,
              knockoutPoints: score.playoffScore,
              groupStageScore: score.groupStageScore,
              groupStageQualifiersScore: score.groupStageQualifiersScore,
              groupPositionScore: score.groupPositionScore,
              playoffScore: score.playoffScore,
              groupBoostBonus: score.groupBoostBonus || 0,
              playoffBoostBonus: score.playoffBoostBonus || 0,
              honorRollScore: score.honorRollScore || 0,
              individualAwardsScore: score.individualAwardsScore || 0
            }))

            return (
              <TabPanel value={tournament.id} key={tournament.id} keepMounted={true}>
                <LeaderboardView
                  scores={transformedScores}
                  currentUserId={loggedInUser}
                  tournament={tournament}
                />
                {/* Betting Status (read-only) */}
                {bettingData[tournament.id]?.config?.betting_enabled && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      💰 {t('betting.statusEnabled')}: ${bettingData[tournament.id]?.config?.betting_amount || 0}
                    </Typography>
                  </Box>
                )}
              </TabPanel>
            )
          })}
        </TabContext>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({...snackbar, open: false})}
        >
          <MuiAlert elevation={6} variant="filled" onClose={() => setSnackbar({...snackbar, open: false})} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </CardContent>
      <NotificationDialog
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        groupId={groupId}
        tournamentId={selectedTab}
        senderId={loggedInUser}
      />
    </Card>
  )
}

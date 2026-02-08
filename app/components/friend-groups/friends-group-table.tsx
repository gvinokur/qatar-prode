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
} from "@mui/material";
import {useState} from "react";
import GroupTournamentBettingAdmin from './group-tournament-betting-admin';
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import NotificationDialog from "./notification-dialog";
import LeaderboardView from '../leaderboard/LeaderboardView';

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
  readonly selectedTournamentId?: string
}

export default function ProdeGroupTable({users, userScoresByTournament, loggedInUser, tournaments, action, groupId, ownerId, members, bettingData, selectedTournamentId}: Props) {
  const [selectedTab, setSelectedTab] = useState<string>(selectedTournamentId || tournaments[0]?.id || '')
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({open: false, message: '', severity: 'success'});
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const isAdmin = ownerId === loggedInUser || !!members.find(m => m.id === loggedInUser && m.is_admin);

  if (tournaments.length === 0) {
    return (
      <Card>
        <CardHeader
          title='Tabla de Posiciones'
          action={action}
        />
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No hay torneos activos disponibles en este momento.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title='Tabla de Posiciones'
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
                {isAdmin && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 2 }}>
                    <Button variant="contained" color="primary" onClick={() => setNotificationDialogOpen(true)}>
                      Enviar Notificación
                    </Button>
                  </Box>
                )}
                <GroupTournamentBettingAdmin
                  groupId={groupId}
                  tournamentId={tournament.id}
                  isAdmin={ownerId === loggedInUser || !!members.find(m => m.id === loggedInUser)?.is_admin}
                  members={members}
                  config={bettingData[tournament.id]?.config}
                  payments={bettingData[tournament.id]?.payments}
                />
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

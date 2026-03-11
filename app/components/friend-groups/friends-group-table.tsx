'use client'

import {Tournament, User} from "../../db/tables-definition";
import {UserScore} from "../../definitions";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Typography,
  useTheme,
} from "@mui/material";
import {useState, useRef} from "react";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import ShareIcon from '@mui/icons-material/Share';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import NotificationDialog from "./notification-dialog";
import LeaderboardView from '../leaderboard/LeaderboardView';
import { useTranslations } from 'next-intl';
import type { TournamentBadgeConfig } from '../leaderboard/types';

type Props = {
  readonly users: {[k:string]: User},
  readonly userScoresByTournament: {[k:string]: UserScore[]},
  readonly loggedInUser: string,
  readonly tournaments: Tournament[],
  readonly action?: React.ReactNode,
  readonly groupId: string,
  readonly members: { id: string, nombre: string, is_admin?: boolean }[],
  readonly bettingData: { [tournamentId: string]: { config: any, payments: any[] } }
  readonly selectedTournamentId?: string,
  readonly groupName?: string,
  readonly joinUrl?: string,
  readonly themeColor?: string,
  readonly tournamentBadgeConfigs?: Record<string, TournamentBadgeConfig>,
}

export default function ProdeGroupTable({users, userScoresByTournament, loggedInUser, tournaments, action, groupId, members, bettingData, selectedTournamentId, groupName, joinUrl, themeColor, tournamentBadgeConfigs}: Props) {
  const t = useTranslations('groups.standings');
  const tBetting = useTranslations('groups.betting');
  const tSharing = useTranslations('groups.sharing');
  const theme = useTheme();
  const leaderboardShareRef = useRef<{ openLeaderboardShare: () => void } | null>(null);

  const [selectedTab, setSelectedTab] = useState<string>(selectedTournamentId || tournaments[0]?.id || '')
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({open: false, message: '', severity: 'success'});
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);

  if (tournaments.length === 0) {
    return (
      <Card>
        <CardHeader
          action={action}
          sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px` }}
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

  const shareAction = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<ShareIcon />}
        onClick={() => leaderboardShareRef.current?.openLeaderboardShare()}
        sx={{ fontSize: '0.75rem' }}
      >
        {tSharing('shareStandings')}
      </Button>
      {action}
    </Box>
  )

  return (
    <Card>
      <CardHeader
        action={shareAction}
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

            const bettingConfig = bettingData[tournament.id]?.config;
            const bettingPayments: { user_id: string, has_paid: boolean }[] = bettingData[tournament.id]?.payments || [];
            const paidUserIds = new Set(bettingPayments.filter(p => p.has_paid).map(p => p.user_id));
            const paidMembers = members.filter(m => paidUserIds.has(m.id));
            const unpaidMembers = members.filter(m => !paidUserIds.has(m.id));
            const totalAmount = paidMembers.length * (bettingConfig?.betting_amount || 0);

            return (
              <TabPanel value={tournament.id} key={tournament.id} keepMounted={true} sx={{ p: 0 }}>
                <LeaderboardView
                  scores={transformedScores}
                  currentUserId={loggedInUser}
                  tournament={tournament}
                  groupName={groupName}
                  joinUrl={joinUrl}
                  themeColor={themeColor}
                  shareRef={leaderboardShareRef}
                  tournamentBadgeConfig={tournamentBadgeConfigs?.[tournament.id]}
                />
                {/* Betting Status (read-only) */}
                {bettingConfig?.betting_enabled && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      💰 {tBetting('statusEnabled')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tBetting('summary.perPerson')} ${bettingConfig.betting_amount || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tBetting('summary.total')} ${totalAmount.toFixed(2)}
                    </Typography>
                    {bettingConfig.betting_payout_description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {tBetting('summary.description')} {bettingConfig.betting_payout_description}
                      </Typography>
                    )}
                    {paidMembers.length > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        ✅ {tBetting('summary.paidList')} {paidMembers.map(m => m.nombre).join(', ')}
                      </Typography>
                    )}
                    {unpaidMembers.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        ❌ {tBetting('summary.notPaidList')} {unpaidMembers.map(m => m.nombre).join(', ')}
                      </Typography>
                    )}
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

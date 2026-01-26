'use client'

import {Tournament, User} from "../../db/tables-definition";
import {UserScore} from "../../definitions";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow, useMediaQuery,
} from "@mui/material";
import {useState} from "react";
import GroupTournamentBettingAdmin from './group-tournament-betting-admin';
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { promoteParticipantToAdmin, demoteParticipantFromAdmin } from '../../actions/prode-group-actions';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonIcon from '@mui/icons-material/Person';
import Tooltip from '@mui/material/Tooltip';
import NotificationDialog from "./notification-dialog";

interface AdminActionButtonProps {
  readonly member?: { id: string, nombre: string, is_admin?: boolean };
  readonly ownerId: string;
  readonly groupId: string;
  readonly userId: string;
  readonly loadingUserId: string | null;
  readonly onPromote: (groupId: string, userId: string) => void;
  readonly onDemote: (groupId: string, userId: string) => void;
}

function AdminActionButton({ 
  member, 
  ownerId, 
  groupId, 
  userId, 
  loadingUserId, 
  onPromote, 
  onDemote 
}: AdminActionButtonProps) {
  if (member?.id === ownerId) return null;
  
  if (member?.is_admin) {
    return (
      <Button 
        size="small" 
        variant="outlined" 
        color="secondary" 
        onClick={() => onDemote(groupId, userId)} 
        disabled={loadingUserId === userId}
      >
        {loadingUserId === userId ? 'Quitando...' : 'Quitar admin'}
      </Button>
    );
  }
  
  return (
    <Button 
      size="small" 
      variant="outlined" 
      color="primary" 
      onClick={() => onPromote(groupId, userId)} 
      disabled={loadingUserId === userId}
    >
      {loadingUserId === userId ? 'Agregando...' : 'Hacer admin'}
    </Button>
  );
}

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
}

export default function ProdeGroupTable({users, userScoresByTournament, loggedInUser, tournaments, action, groupId, ownerId, members, bettingData}: Props) {
  const [selectedTab, setSelectedTab] = useState<string>(tournaments[0]?.id || '')
  const isNotExtraSmallScreen = useMediaQuery('(min-width:600px)')
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({open: false, message: '', severity: 'success'});
  const [membersState, setMembersState] = useState(members);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const isAdmin = ownerId === loggedInUser || !!members.find(m => m.id === loggedInUser && m.is_admin);

  const handlePromoteAdmin = async (groupId: string, userId: string) => {
    setLoadingUserId(userId);
    try {
      await promoteParticipantToAdmin(groupId, userId);
      setSnackbar({open: true, message: 'Usuario promovido a admin', severity: 'success'});
      setMembersState(membersState.map(m => m.id === userId ? { ...m, is_admin: true } : m));
    } catch (e: any) {
      setSnackbar({open: true, message: e?.message || 'Error al promover admin', severity: 'error'});
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleDemoteAdmin = async (groupId: string, userId: string) => {
    setLoadingUserId(userId);
    try {
      await demoteParticipantFromAdmin(groupId, userId);
      setSnackbar({open: true, message: 'Usuario removido como admin', severity: 'success'});
      setMembersState(membersState.map(m => m.id === userId ? { ...m, is_admin: false } : m));
    } catch (e: any) {
      setSnackbar({open: true, message: e?.message || 'Error al remover admin', severity: 'error'});
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <Card>
      <CardHeader
        title='Tabla de Posiciones'
        action={action}
      />
      <CardContent>
        <TabContext value={selectedTab || tournaments[0].id}>
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
          {tournaments.map((tournament) => (
            <TabPanel value={tournament.id} key={tournament.id} keepMounted={true}>
              <Box sx={{ width: '100%', overflowX: 'auto' }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Puntos Totales</TableCell>
                      <TableCell>Puntos Partidos</TableCell>
                      {isNotExtraSmallScreen && <TableCell>Puntos Clasificados</TableCell>}
                      {isNotExtraSmallScreen && <TableCell>Posiciones Grupo</TableCell>}
                      <TableCell>Puntos Playoffs</TableCell>
                      {isNotExtraSmallScreen && <TableCell>Cuadro de Honor</TableCell>}
                      {isNotExtraSmallScreen && <TableCell>Premios</TableCell>}
                      {ownerId === loggedInUser && <TableCell>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userScoresByTournament[tournament.id]
                      .sort((usa, usb) => usb.totalPoints - usa.totalPoints)
                      .map((userScore, index) => {
                        const member = membersState.find(m => m.id === userScore.userId);
                        return (
                          <TableRow key={userScore.userId} selected={userScore.userId === loggedInUser}>
                            <TableCell>{index+1}</TableCell>
                            <TableCell sx={{
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              maxWidth: '140px',
                            }}>
                              <Box display="flex" alignItems="center">
                                {member?.is_admin && (
                                  <Tooltip title="Administrador del grupo">
                                    <ManageAccountsIcon color="secondary" fontSize="small" />
                                  </Tooltip>
                                )}
                                {ownerId === userScore.userId && (
                                  <Tooltip title="Dueño del grupo">
                                    <PersonIcon color="primary" fontSize="small" />
                                  </Tooltip>
                                )}
                                <span
                                  style={{
                                    marginLeft: 8,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                    flex: 1
                                  }}
                                >
                                  {users[userScore.userId]?.nickname || users[userScore.userId]?.email}
                                </span>
                              </Box>
                            </TableCell>
                            <TableCell>{userScore.totalPoints}</TableCell>
                            <TableCell>{userScore.groupStageScore}</TableCell>
                            {isNotExtraSmallScreen && <TableCell>{userScore.groupStageQualifiersScore}</TableCell>}
                            {isNotExtraSmallScreen && <TableCell>{userScore.groupPositionScore || 0}</TableCell>}
                            <TableCell>{userScore.playoffScore}</TableCell>
                            {isNotExtraSmallScreen && <TableCell>{userScore.honorRollScore}</TableCell>}
                            {isNotExtraSmallScreen && <TableCell>{userScore.individualAwardsScore}</TableCell>}
                            {ownerId === loggedInUser && (
                              <TableCell>
                                <AdminActionButton 
                                  member={member}
                                  ownerId={ownerId}
                                  groupId={groupId}
                                  userId={userScore.userId}
                                  loadingUserId={loadingUserId}
                                  onPromote={handlePromoteAdmin}
                                  onDemote={handleDemoteAdmin}
                                />
                              </TableCell>
                            )}
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </Box>
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
                isAdmin={ownerId === loggedInUser || !!membersState.find(m => m.id === loggedInUser)?.is_admin}
                members={membersState}
                config={bettingData[tournament.id]?.config}
                payments={bettingData[tournament.id]?.payments}
              />
            </TabPanel>
          ))}
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

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Snackbar,
  Alert
} from '@mui/material';
import { ProdeGroupTournamentBetting, ProdeGroupTournamentBettingPayment } from '../../db/tables-definition';
import {
  setGroupTournamentBettingConfigAction,
  setUserGroupTournamentBettingPaymentAction
} from '../../actions/group-tournament-betting-actions';

// Props: groupId, tournamentId, currentUserId, isAdmin, members (array of { id, nombre })
interface Member {
  id: string;
  nombre: string;
}

interface GroupTournamentBettingAdminProps {
  groupId: string;
  tournamentId: string;
  isAdmin: boolean;
  members: Member[];
  config: ProdeGroupTournamentBetting | null;
  payments: ProdeGroupTournamentBettingPayment[];
}

const GroupTournamentBettingAdmin: React.FC<GroupTournamentBettingAdminProps> = ({
  groupId,
  tournamentId,
  isAdmin,
  members,
  config,
  payments: initialPayments,
}) => {
  const [bettingEnabled, setBettingEnabled] = useState(!!config?.betting_enabled);
  const [bettingAmount, setBettingAmount] = useState(config?.betting_amount?.toString() || '');
  const [bettingDescription, setBettingDescription] = useState(config?.betting_payout_description || '');
  const [payments, setPayments] = useState<ProdeGroupTournamentBettingPayment[]>(initialPayments || []);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error', autoHideDuration: number }>({
    open: false,
    message: '',
    severity: 'success',
    autoHideDuration: 1000
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Helper to update config in backend
  const updateConfig = async (fields: Partial<ProdeGroupTournamentBetting>) => {
    setSaving(true);
    try {
      const updated = await setGroupTournamentBettingConfigAction(groupId, tournamentId, {
        betting_enabled: fields.betting_enabled ?? bettingEnabled,
        betting_amount: fields.betting_amount ?? (bettingAmount ? parseFloat(bettingAmount) : null),
        betting_payout_description: fields.betting_payout_description ?? bettingDescription,
      });
      setBettingEnabled(!!updated.betting_enabled);
      setBettingAmount(updated.betting_amount?.toString() || '');
      setBettingDescription(updated.betting_payout_description || '');
      setSnackbar({ open: true, message: '¡Configuración guardada!', severity: 'success', autoHideDuration: 1000 });
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Error al guardar la configuración', severity: 'error', autoHideDuration: 6000 });
    }
    setSaving(false);
  };

  // Handlers for each field
  const handleToggleEnabled = async () => {
    await updateConfig({ betting_enabled: !bettingEnabled });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBettingAmount(value);
  };

  const handleAmountBlur = async () => {
    await updateConfig({ betting_amount: bettingAmount ? parseFloat(bettingAmount) : null });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBettingDescription(value);
  };

  const handleDescriptionBlur = async () => {
    await updateConfig({ betting_payout_description: bettingDescription });
  };

  const handleTogglePaid = async (userId: string) => {
    if (!config) return;
    setSaving(true);
    const payment = payments.find((p) => p.user_id === userId);
    const newPaid = !payment?.has_paid;
    try {
      const newPayment = await setUserGroupTournamentBettingPaymentAction(config.id, userId, newPaid, groupId);
      const oldPaymentIndex = payments.findIndex((p) => p.user_id === userId);
      if (oldPaymentIndex === -1) {
        setPayments([...payments, newPayment]);
      } else {
        setPayments(payments.map((p, index) => index === oldPaymentIndex ? newPayment : p));
      }
      
      setSnackbar({ open: true, message: '¡Estado de pago actualizado!', severity: 'success', autoHideDuration: 1000 });
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Error al actualizar el estado de pago', severity: 'error', autoHideDuration: 6000 });
    }
    setSaving(false);
  };

  // Owner view: editable config, only show rest if betting is enabled
  if (isAdmin) {
    return (
      <Box mt={4}>
        <Snackbar open={snackbar.open} autoHideDuration={snackbar.autoHideDuration} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
        <Paper sx={{ p: 2, mb: 4 }} elevation={2}>
          <Typography variant="body1">
            {bettingEnabled ? 'Apuesta habilitada' : 'Apuesta deshabilitada'}
            <Button
              variant="outlined"
              color={bettingEnabled ? 'error' : 'success'}
              size="small"
              sx={{ ml: 2 }}
              onClick={handleToggleEnabled}
              disabled={saving}
            >
              {bettingEnabled ? 'Deshabilitar' : 'Habilitar'}
            </Button>
          </Typography>
          {bettingEnabled && (
            <Box mt={2}>
              <TextField
                label="Monto de la apuesta"
                type="number"
                value={bettingAmount}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                fullWidth
                sx={{ mb: 2 }}
                disabled={saving}
              />
              <TextField
                label="Descripción del pago"
                value={bettingDescription}
                onChange={handleDescriptionChange}
                onBlur={handleDescriptionBlur}
                fullWidth
                multiline
                minRows={2}
                sx={{ mb: 2 }}
                disabled={saving}
              />
              <Typography variant="h6" mb={2}>
                Estado de pago
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>¿Pagó?</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member) => {
                    const payment = payments.find((p) => p.user_id === member.id);
                    return (
                      <TableRow key={member.id}>
                        <TableCell>{member.nombre}</TableCell>
                        <TableCell>{payment?.has_paid ? '✅' : '❌'}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleTogglePaid(member.id)}
                            disabled={saving}
                          >
                            Cambiar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      </Box>
    );
  }

  // Non-owner: compact, read-only view
  return (
    <Box mt={2}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="body1">
          <b>{config?.betting_enabled ? 'Apuesta habilitada' : 'Apuesta deshabilitada'}</b><br />
          {config?.betting_enabled && (
            <>
              <b>Monto por persona:</b> $ {config?.betting_amount ?? '-'}<br />
              <b>Monto acumulado:</b> $ {config?.betting_amount ? config?.betting_amount * payments.filter((p) => p.has_paid).length : '-'}<br />
              <b>Descripción:</b> <br />
              {config?.betting_payout_description ?? '-'}<br />
              <b>Pagaron: </b> {payments.filter((p) => p.has_paid).map((p) => members.find((m) => m.id === p.user_id)?.nombre).join(', ')}<br />
            </>
          )}
        </Typography>
      </Paper>
    </Box>
  );
};

export default GroupTournamentBettingAdmin; 
import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
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

// Props: groupId, tournamentId, currentUserId, isOwner, members (array of { id, nombre })
interface Member {
  id: string;
  nombre: string;
}

interface GroupTournamentBettingAdminProps {
  groupId: string;
  tournamentId: string;
  currentUserId: string;
  isOwner: boolean;
  members: Member[];
  config: ProdeGroupTournamentBetting | null;
  payments: ProdeGroupTournamentBettingPayment[];
}

const GroupTournamentBettingAdmin: React.FC<GroupTournamentBettingAdminProps> = ({
  groupId,
  tournamentId,
  isOwner,
  members,
  config,
  payments: initialPayments,
}) => {
  const [bettingEnabled, setBettingEnabled] = useState(!!config?.betting_enabled);
  const [bettingAmount, setBettingAmount] = useState(config?.betting_amount?.toString() || '');
  const [bettingDescription, setBettingDescription] = useState(config?.betting_payout_description || '');
  const [payments, setPayments] = useState<ProdeGroupTournamentBettingPayment[]>(initialPayments || []);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
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
      setSnackbar({ open: true, message: '¡Configuración guardada!', severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Error al guardar la configuración', severity: 'error' });
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
      await setUserGroupTournamentBettingPaymentAction(config.id, userId, newPaid, groupId);
      setPayments((prev) =>
        prev.map((p) =>
          p.user_id === userId ? { ...p, has_paid: newPaid } : p
        )
      );
      setSnackbar({ open: true, message: '¡Estado de pago actualizado!', severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Error al actualizar el estado de pago', severity: 'error' });
    }
    setSaving(false);
  };

  // Owner view: editable config, only show rest if betting is enabled
  if (isOwner) {
    return (
      <Box mt={4}>
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
        <Paper sx={{ p: 3, mb: 4 }}>
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
            </Box>
          )}
        </Paper>
        {bettingEnabled && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Miembros del grupo y estado de pago
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
          </Paper>
        )}
      </Box>
    );
  }

  // Non-owner: compact, read-only view
  return (
    <Box mt={2}>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body1">
          <b>{config?.betting_enabled ? 'Apuesta habilitada' : 'Apuesta deshabilitada'}</b><br />
          {config?.betting_enabled && (
            <>
              <b>Monto:</b> $ {config?.betting_amount ?? '-'}<br />
              <b>Descripción:</b> <br />
              {config?.betting_payout_description ?? '-'}
            </>
          )}
        </Typography>
      </Paper>
      {config?.betting_enabled && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Estado de pago de los miembros
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>¿Pagó?</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => {
                const payment = initialPayments.find((p) => p.user_id === member.id);
                return (
                  <TableRow key={member.id}>
                    <TableCell>{member.nombre}</TableCell>
                    <TableCell>{payment?.has_paid ? '✅' : '❌'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default GroupTournamentBettingAdmin; 
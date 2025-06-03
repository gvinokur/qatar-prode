'use server'

import { getLoggedInUser } from './user-actions';
import {
  getGroupTournamentBettingConfig,
  createGroupTournamentBettingConfig,
  updateGroupTournamentBettingConfig,
  getGroupTournamentBettingPayments,
  setUserGroupTournamentBettingPayment,
  getUserGroupTournamentBettingPayment,
  findProdeGroupById
} from '../db/prode-group-repository';
import { ProdeGroupTournamentBettingNew, ProdeGroupTournamentBettingUpdate } from '../db/tables-definition';

// Get betting config for a group/tournament
export async function getGroupTournamentBettingConfigAction(groupId: string, tournamentId: string) {
  return getGroupTournamentBettingConfig(groupId, tournamentId);
}

// Set betting config (admin only: group owner)
export async function setGroupTournamentBettingConfigAction(groupId: string, tournamentId: string, config: Omit<ProdeGroupTournamentBettingNew, 'group_id' | 'tournament_id'>) {
  const user = await getLoggedInUser();
  if (!user) throw new Error('Not authenticated');
  const group = await findProdeGroupById(groupId);
  if (!group || group.owner_user_id !== user.id) throw new Error('Not authorized: Only group owner can modify betting config');
  let existing = await getGroupTournamentBettingConfig(groupId, tournamentId);
  if (existing) {
    return updateGroupTournamentBettingConfig(existing.id, config as ProdeGroupTournamentBettingUpdate);
  } else {
    return createGroupTournamentBettingConfig({ ...config, group_id: groupId, tournament_id: tournamentId });
  }
}

// Get all payment statuses for a group/tournament
export async function getGroupTournamentBettingPaymentsAction(groupTournamentBettingId: string) {
  return getGroupTournamentBettingPayments(groupTournamentBettingId);
}

// Set payment status for a user (admin only: group owner)
export async function setUserGroupTournamentBettingPaymentAction(groupTournamentBettingId: string, userId: string, hasPaid: boolean, groupId: string) {
  const user = await getLoggedInUser();
  if (!user) throw new Error('Not authenticated');
  const group = await findProdeGroupById(groupId);
  if (!group || group.owner_user_id !== user.id) throw new Error('Not authorized: Only group owner can modify payment status');
  return setUserGroupTournamentBettingPayment(groupTournamentBettingId, userId, hasPaid);
}

// Get payment status for a user
export async function getUserGroupTournamentBettingPaymentAction(groupTournamentBettingId: string, userId: string) {
  return getUserGroupTournamentBettingPayment(groupTournamentBettingId, userId);
} 
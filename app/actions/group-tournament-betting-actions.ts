'use server'

import { getLoggedInUser } from './user-actions';
import {
  getGroupTournamentBettingConfig,
  createGroupTournamentBettingConfig,
  updateGroupTournamentBettingConfig,
  getGroupTournamentBettingPayments,
  setUserGroupTournamentBettingPayment,
  getUserGroupTournamentBettingPayment,
  findProdeGroupById,
  findParticipantsInGroup
} from '../db/prode-group-repository';
import { ProdeGroupTournamentBettingNew, ProdeGroupTournamentBettingUpdate } from '../db/tables-definition';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';

// Get betting config for a group/tournament
export async function getGroupTournamentBettingConfigAction(groupId: string, tournamentId: string) {
  return getGroupTournamentBettingConfig(groupId, tournamentId);
}

// Set betting config (admin only: group owner)
export async function setGroupTournamentBettingConfigAction(groupId: string, tournamentId: string, config: Omit<ProdeGroupTournamentBettingNew, 'group_id' | 'tournament_id'>, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'groups' });
  const tErrors = await getTranslations({ locale, namespace: 'errors' });
  const user = await getLoggedInUser();
  if (!user) throw new Error(tErrors('notAuthenticated'));
  const group = await findProdeGroupById(groupId);
  const groupParticipants = await findParticipantsInGroup(groupId);
  const isAdmin = groupParticipants.find(p => p.user_id === user.id)?.is_admin;
  if (!group ||
    !(group.owner_user_id === user.id || isAdmin))
    throw new Error(t('betting.ownerOnly'));
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
export async function setUserGroupTournamentBettingPaymentAction(groupTournamentBettingId: string, userId: string, hasPaid: boolean, groupId: string, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'groups' });
  const tErrors = await getTranslations({ locale, namespace: 'errors' });
  const user = await getLoggedInUser();
  if (!user) throw new Error(tErrors('notAuthenticated'));
  const group = await findProdeGroupById(groupId);
  const groupParticipants = await findParticipantsInGroup(groupId);
  const isAdmin = groupParticipants.find(p => p.user_id === user.id)?.is_admin;
  if (!group ||
    !(group.owner_user_id === user.id || isAdmin))
    throw new Error(t('betting.ownerOnly'));
  return setUserGroupTournamentBettingPayment(groupTournamentBettingId, userId, hasPaid);
}

// Get payment status for a user
export async function getUserGroupTournamentBettingPaymentAction(groupTournamentBettingId: string, userId: string) {
  return getUserGroupTournamentBettingPayment(groupTournamentBettingId, userId);
} 
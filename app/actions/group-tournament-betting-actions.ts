'use server'

import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';
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

// Get betting config for a group/tournament
export async function getGroupTournamentBettingConfigAction(groupId: string, tournamentId: string) {
  return getGroupTournamentBettingConfig(groupId, tournamentId);
}

// Set betting config (admin only: group owner)
export async function setGroupTournamentBettingConfigAction(groupId: string, tournamentId: string, config: Omit<ProdeGroupTournamentBettingNew, 'group_id' | 'tournament_id'>, locale: Locale = 'es') {
  try {
    const t = await getTranslations({ locale, namespace: 'groups' });
    const user = await getLoggedInUser();
    if (!user) return { success: false, error: t('unauthorized') };
    const group = await findProdeGroupById(groupId);
    const groupParticipants = await findParticipantsInGroup(groupId);
    const isAdmin = groupParticipants.find(p => p.user_id === user.id)?.is_admin;
    if (!group || !(group.owner_user_id === user.id || isAdmin))
      return { success: false, error: t('unauthorized') };
    let existing = await getGroupTournamentBettingConfig(groupId, tournamentId);
    let result;
    if (existing) {
      result = await updateGroupTournamentBettingConfig(existing.id, config as ProdeGroupTournamentBettingUpdate);
    } else {
      result = await createGroupTournamentBettingConfig({ ...config, group_id: groupId, tournament_id: tournamentId });
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Error setting betting config:', error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
}

// Get all payment statuses for a group/tournament
export async function getGroupTournamentBettingPaymentsAction(groupTournamentBettingId: string) {
  return getGroupTournamentBettingPayments(groupTournamentBettingId);
}

// Set payment status for a user (admin only: group owner)
export async function setUserGroupTournamentBettingPaymentAction(groupTournamentBettingId: string, userId: string, hasPaid: boolean, groupId: string, locale: Locale = 'es') {
  try {
    const t = await getTranslations({ locale, namespace: 'groups' });
    const user = await getLoggedInUser();
    if (!user) return { success: false, error: t('unauthorized') };
    const group = await findProdeGroupById(groupId);
    const groupParticipants = await findParticipantsInGroup(groupId);
    const isAdmin = groupParticipants.find(p => p.user_id === user.id)?.is_admin;
    if (!group || !(group.owner_user_id === user.id || isAdmin))
      return { success: false, error: t('unauthorized') };
    const result = await setUserGroupTournamentBettingPayment(groupTournamentBettingId, userId, hasPaid);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error setting user payment:', error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
}

// Get payment status for a user
export async function getUserGroupTournamentBettingPaymentAction(groupTournamentBettingId: string, userId: string) {
  return getUserGroupTournamentBettingPayment(groupTournamentBettingId, userId);
} 
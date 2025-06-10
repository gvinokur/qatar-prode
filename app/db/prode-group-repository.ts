import { db } from './database'
import { createBaseFunctions} from "./base-repository";
import {ProdeGroupTable, ProdeGroup, ProdeGroupTournamentBetting, ProdeGroupTournamentBettingNew, ProdeGroupTournamentBettingUpdate, ProdeGroupTournamentBettingPayment, ProdeGroupTournamentBettingPaymentNew, ProdeGroupTournamentBettingPaymentUpdate} from "./tables-definition";
import {cache} from "react";
import {User} from "next-auth";

const baseFunctions = createBaseFunctions<ProdeGroupTable, ProdeGroup>('prode_groups')

export const findProdeGroupById = baseFunctions.findById
export const createProdeGroup = baseFunctions.create
export const deleteProdeGroup = baseFunctions.delete
export const updateProdeGroup = baseFunctions.update

export const findProdeGroupsByOwner = cache(async function (userId: string) {
  return await db
    .selectFrom('prode_groups')
    .selectAll()
    .where("prode_groups.owner_user_id", "=", userId)
    .execute()
})

export const findProdeGroupsByParticipant = cache(async function (userId: string) {
  return db
    .selectFrom('prode_groups')
    .innerJoin('prode_group_participants', "prode_group_participants.prode_group_id", "prode_groups.id")
    .selectAll('prode_groups')
    .where('prode_group_participants.participant_id', "=", userId)
    .execute()
})

export async function addParticipantToGroup(group: ProdeGroup, user: User) {
  return db.insertInto('prode_group_participants')
    .values({
      prode_group_id: group.id,
      participant_id: user.id
    })
    .returningAll()
    .execute()

}

export async function deleteAllParticipantsFromGroup(groupId: string) {
  return db
    .deleteFrom('prode_group_participants')
    .where('prode_group_participants.prode_group_id', '=', groupId)
    .execute()
}

export async function deleteParticipantFromAllGroups(userId: string) {
  return db
    .deleteFrom('prode_group_participants')
    .where('prode_group_participants.participant_id', '=', userId)
    .execute()
}

export async function findParticipantsInGroup(groupId: string) {
  return db.selectFrom('prode_group_participants')
    .select("participant_id as user_id")
    .where("prode_group_id", "=", groupId)
    .execute()
}

export async function deleteParticipantFromGroup(groupId: string, userId: string) {
  return db
    .deleteFrom('prode_group_participants')
    .where('prode_group_participants.prode_group_id', '=', groupId)
    .where('prode_group_participants.participant_id', '=', userId)
    .execute();
}

// Betting config for a group/tournament
export async function getGroupTournamentBettingConfig(groupId: string, tournamentId: string): Promise<ProdeGroupTournamentBetting | undefined> {
  return db
    .selectFrom('prode_group_tournament_betting')
    .selectAll()
    .where('group_id', '=', groupId)
    .where('tournament_id', '=', tournamentId)
    .executeTakeFirst();
}

export async function createGroupTournamentBettingConfig(config: ProdeGroupTournamentBettingNew): Promise<ProdeGroupTournamentBetting> {
  return db
    .insertInto('prode_group_tournament_betting')
    .values(config)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateGroupTournamentBettingConfig(id: string, update: ProdeGroupTournamentBettingUpdate): Promise<ProdeGroupTournamentBetting> {
  return db
    .updateTable('prode_group_tournament_betting')
    .set(update)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();
}

// Payment status for users in a group/tournament
export async function getGroupTournamentBettingPayments(groupTournamentBettingId: string): Promise<ProdeGroupTournamentBettingPayment[]> {
  return db
    .selectFrom('prode_group_tournament_betting_payments')
    .selectAll()
    .where('group_tournament_betting_id', '=', groupTournamentBettingId)
    .execute();
}

export async function getUserGroupTournamentBettingPayment(groupTournamentBettingId: string, userId: string): Promise<ProdeGroupTournamentBettingPayment | undefined> {
  return db
    .selectFrom('prode_group_tournament_betting_payments')
    .selectAll()
    .where('group_tournament_betting_id', '=', groupTournamentBettingId)
    .where('user_id', '=', userId)
    .executeTakeFirst();
}

export async function setUserGroupTournamentBettingPayment(
  groupTournamentBettingId: string,
  userId: string,
  hasPaid: boolean
): Promise<ProdeGroupTournamentBettingPayment> {
  // Try update, if not exists, insert
  const existing = await getUserGroupTournamentBettingPayment(groupTournamentBettingId, userId);
  if (existing) {
    return db
      .updateTable('prode_group_tournament_betting_payments')
      .set({ has_paid: hasPaid })
      .where('group_tournament_betting_id', '=', groupTournamentBettingId)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();
  } else {
    return db
      .insertInto('prode_group_tournament_betting_payments')
      .values({ group_tournament_betting_id: groupTournamentBettingId, user_id: userId, has_paid: hasPaid })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

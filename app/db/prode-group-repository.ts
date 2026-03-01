import { db } from './database'
import { createBaseFunctions} from "./base-repository";
import {ProdeGroupTable, ProdeGroup, ProdeGroupTournamentBetting, ProdeGroupTournamentBettingNew, ProdeGroupTournamentBettingUpdate, ProdeGroupTournamentBettingPayment} from "./tables-definition";
import {cache} from "react";
import {User} from "next-auth";
import { sql } from 'kysely';

export interface PublicGroupData {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  owner: { id: string; name: string };
  memberCount: number;
}

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

export async function addParticipantToGroup(group: ProdeGroup, user: User, isAdmin: boolean = false) {
  return db.insertInto('prode_group_participants')
    .values({
      prode_group_id: group.id,
      participant_id: user.id,
      is_admin: isAdmin
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
    .select(["participant_id as user_id", "is_admin"])
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

export async function updateParticipantAdminStatus(groupId: string, userId: string, isAdmin: boolean) {
  return db.updateTable('prode_group_participants')
    .set({ is_admin: isAdmin })
    .where('prode_group_id', '=', groupId)
    .where('participant_id', '=', userId)
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

/**
 * Find public groups for discovery page with owner info and member count.
 * Uses parameterized bindings (Kysely default) for SQL injection safety.
 */
export async function findPublicGroups(
  searchTerm?: string,
  limit = 20,
  offset = 0
): Promise<PublicGroupData[]> {
  let query = db
    .selectFrom('prode_groups')
    .innerJoin('users', 'users.id', 'prode_groups.owner_user_id')
    .leftJoin('prode_group_participants', 'prode_group_participants.prode_group_id', 'prode_groups.id')
    .select([
      'prode_groups.id',
      'prode_groups.name',
      'prode_groups.description',
      'prode_groups.is_public',
      'prode_groups.owner_user_id',
      'users.nickname as owner_nickname',
      'users.email as owner_email',
      db.fn.count<string>('prode_group_participants.participant_id').as('member_count')
    ])
    .where('prode_groups.is_public', '=', true)
    .groupBy(['prode_groups.id', 'users.id'])
    .orderBy('prode_groups.name', 'asc')
    .limit(limit)
    .offset(offset);

  if (searchTerm) {
    query = query.where(sql<boolean>`LOWER(prode_groups.name) LIKE LOWER(${'%' + searchTerm + '%'})`);
  }

  const rows = await query.execute();

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    is_public: row.is_public ?? true,
    owner: {
      id: row.owner_user_id,
      name: row.owner_nickname || row.owner_email
    },
    memberCount: parseInt(row.member_count, 10)
  }));
}

/**
 * Count total public groups (for pagination).
 * Capped conceptually at 100 pages (2000 records) to prevent expensive full scans.
 */
export async function countPublicGroups(searchTerm?: string): Promise<number> {
  let query = db
    .selectFrom('prode_groups')
    .select(db.fn.count<string>('prode_groups.id').as('total'))
    .where('prode_groups.is_public', '=', true);

  if (searchTerm) {
    query = query.where(sql<boolean>`LOWER(prode_groups.name) LIKE LOWER(${'%' + searchTerm + '%'})`);
  }

  const result = await query.executeTakeFirst();
  return parseInt(result?.total ?? '0', 10);
}

/**
 * Update group privacy settings.
 * If making private, bulk-rejects all pending 'discovery' source join requests for this group.
 * Does NOT affect 'invite_link' or 'email_invite' requests.
 */
export async function updateGroupPrivacy(
  groupId: string,
  isPublic: boolean,
  description?: string | null
): Promise<ProdeGroup> {
  return db.transaction().execute(async (trx) => {
    // Update the group's privacy settings
    const updated = await trx
      .updateTable('prode_groups')
      .set({
        is_public: isPublic,
        description: isPublic ? (description ?? null) : null
      })
      .where('id', '=', groupId)
      .returningAll()
      .executeTakeFirstOrThrow();

    // If making private, reject all pending discovery-sourced requests
    if (!isPublic) {
      await trx
        .updateTable('prode_group_join_requests')
        .set({
          status: 'rejected',
          resolved_at: new Date()
        })
        .where('group_id', '=', groupId)
        .where('status', '=', 'pending')
        .where('request_source', '=', 'discovery')
        .execute();
    }

    return updated;
  });
}

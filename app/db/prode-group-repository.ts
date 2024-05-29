import { db } from './database'
import { createBaseFunctions} from "./base-repository";
import {ProdeGroupTable, ProdeGroup} from "./tables-definition";
import {jsonObjectFrom} from "kysely/helpers/postgres";
import {AdapterUser} from "next-auth/adapters";

const baseFunctions = createBaseFunctions<ProdeGroupTable, ProdeGroup>('prode_groups')

export const findProdeGroupById = baseFunctions.findById
export const createProdeGroup = baseFunctions.create
export const deleteProdeGroup = baseFunctions.delete
export const updateProdeGroup = baseFunctions.update

export async function findProdeGroupsByOwner(userId: string) {
  return await db
    .selectFrom('prode_groups')
    .selectAll()
    .select((eb) => [
      jsonObjectFrom(
        eb.selectFrom('prode_group_tournaments')
          .innerJoin('tournaments', 'tournaments.id', 'prode_group_tournaments.tournament_id')
          .select([
            'prode_group_tournaments.tournament_id as id',
            'tournaments.long_name as long_name',
            'tournaments.short_name'
          ])
          .whereRef('prode_group_tournaments.prode_group_id', '=', "prode_groups.id")
          .where('tournaments.is_active', '=', true)
      ).as('tournament')
    ])
    .where("prode_groups.owner_user_id", "=", userId)
    .execute()
}

export async function findProdeGroupsByParticipant(userId: string) {
  return db
    .selectFrom('prode_groups')
    .innerJoin('prode_group_participants', "prode_group_participants.prode_group_id", "prode_groups.id")
    .selectAll('prode_groups')
    .select((eb) => [
      jsonObjectFrom(
        eb.selectFrom('prode_group_tournaments')
          .innerJoin('tournaments', 'tournaments.id', 'prode_group_tournaments.tournament_id')
          .select([
            'prode_group_tournaments.tournament_id as id',
            'tournaments.long_name as long_name',
            'tournaments.short_name'
          ])
          .whereRef('prode_group_tournaments.prode_group_id', '=', "prode_groups.id")
          .where('tournaments.is_active', '=', true)
      ).as('tournament')
    ])
    .where('prode_group_participants.participant_id', "=", userId)
    .execute()
}

export async function addParticipantToGroup(group: ProdeGroup, user: AdapterUser) {
  return db.insertInto('prode_group_participants')
    .values({
      prode_group_id: group.id,
      participant_id: user.id
    })
    .returningAll()
    .execute()

}

export async function addGroupToTournament(groupId: string, tournamentId: string) {
  return await db.insertInto('prode_group_tournaments')
    .values({
      prode_group_id: groupId,
      tournament_id: tournamentId
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function deleteGroupFromAllTournaments(groupId: string) {
  return db
    .deleteFrom('prode_group_tournaments')
    .where('prode_group_tournaments.prode_group_id', '=', groupId)
    .execute()
}

export async function deleteAllParticipantsFromGroup(groupId: string) {
  return db
    .deleteFrom('prode_group_participants')
    .where('prode_group_participants.prode_group_id', '=', groupId)
    .execute()
}

export async function findParticipantsInGroup(groupId: string) {
  return db.selectFrom('prode_group_participants')
    .select("participant_id as user_id")
    .where("prode_group_id", "=", groupId)
    .execute()
}

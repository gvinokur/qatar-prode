import { db } from './database'
import { createBaseFunctions} from "./base-repository";
import {ProdeGroupTable, ProdeGroup} from "./tables-definition";
import {jsonObjectFrom} from "kysely/helpers/postgres";
import {AdapterUser} from "next-auth/adapters";
import exp from "node:constants";
import {cache} from "react";

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

export async function addParticipantToGroup(group: ProdeGroup, user: AdapterUser) {
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

export async function findParticipantsInGroup(groupId: string) {
  return db.selectFrom('prode_group_participants')
    .select("participant_id as user_id")
    .where("prode_group_id", "=", groupId)
    .execute()
}

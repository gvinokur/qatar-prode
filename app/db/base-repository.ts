import { db } from './database'
import { Identifiable } from "./tables-definition";
import {Insertable, Selectable, Updateable} from "kysely";
import {cache} from "react";

type IdentifiableTables =
  'tournaments' |
  'users' |
  'tournament_groups' |
  'teams' |
  'games' |
  'tournament_playoff_rounds' |
  'tournament_view_permissions' |
  'prode_groups' |
  'game_guesses' |
  'game_results' |
  'tournament_guesses' |
  'players' |
  'tournament_venues' |
  'tournament_third_place_rules'

function findByIdFactory<K2 extends Selectable<Identifiable>>  (tableName: IdentifiableTables) {
  return cache(async function (id: string) {
    const result = await db.selectFrom(tableName)
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst()
    return result as K2 | undefined
  })
}

function updateFactory<K1 extends Identifiable, K2 extends Selectable<Identifiable>>  (tableName: IdentifiableTables) {
  return async function (id: string, updateWith: Updateable<K1>): Promise<K2> {
    return db.updateTable(tableName).set(updateWith).where('id', '=', id).returningAll().executeTakeFirstOrThrow() as Promise<K2>
  }
}

function createFactory<K1 extends Identifiable, K2 extends Selectable<Identifiable>> (tableName: IdentifiableTables) {
  return async function (typeNew: Insertable<K1>) {
    const newObject = await db.insertInto(tableName)
      .values(typeNew)
      .returningAll()
      .executeTakeFirstOrThrow()
    return newObject as K2
  }
}

function deleteFactory<K1 extends Identifiable>(tableName: IdentifiableTables) {
  return async function (id: string): Promise<K1> {
    return db.deleteFrom(tableName).where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow() as Promise<K1>
  }
}

export function createBaseFunctions<K1 extends Identifiable, K2 extends Selectable<Identifiable>> (tableName: IdentifiableTables) {
  return {
    findById: findByIdFactory<K2>(tableName),
    create: createFactory<K1, K2>(tableName),
    update: updateFactory<K1, K2>(tableName),
    delete: deleteFactory<K1>(tableName),
  }
}

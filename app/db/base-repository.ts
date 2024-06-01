import { db } from './database'
import { Identifiable } from "./tables-definition";
import {Insertable, Selectable, Updateable} from "kysely";

type IdentifiableTables =
  'tournaments' |
  'users' |
  'tournament_groups' |
  'teams' |
  'games' |
  'tournament_playoff_rounds' |
  'prode_groups' |
  'game_guesses' |
  'game_results' |
  'tournament_guesses' |
  'players'

function findByIdFactory<K2 extends Selectable<Identifiable>>  (tableName: IdentifiableTables) {
  return async function (id: string) {
    const result = await db.selectFrom(tableName)
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst()
    return result as K2
  }
}

function updateFactory<K1 extends Identifiable>  (tableName: IdentifiableTables) {
  return async function (id: string, updateWith: Updateable<K1>) {
    await db.updateTable(tableName).set(updateWith).where('id', '=', id).returningAll().execute()
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

function deleteFactory(tableName: IdentifiableTables) {
  return async function (id: string) {
    return await db.deleteFrom(tableName).where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }
}

export function createBaseFunctions<K1 extends Identifiable, K2 extends Selectable<Identifiable>> (tableName: IdentifiableTables) {
  return {
    findById: findByIdFactory<K2>(tableName),
    create: createFactory<K1, K2>(tableName),
    update: updateFactory<K1>(tableName),
    delete: deleteFactory(tableName),
  }
}

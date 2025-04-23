import { db } from './database'
import {createBaseFunctions} from "./base-repository";
import {User, UserTable, UserUpdate} from "./tables-definition";
import sha256 from 'crypto-js/sha256'
import {cache} from "react";

const baseFunctions = createBaseFunctions<UserTable, User>('users');
export const findUserById = baseFunctions.findById
export const updateUser = baseFunctions.update
export const createUser = baseFunctions.create
export const deleteUser =  baseFunctions.delete

export const findUserByEmail = cache(async function(email:string) {
  return db.selectFrom('users')
    .where('email', '=', email)
    .selectAll()
    .executeTakeFirst()
})

export const findUsersByIds = cache(async function (userIds:string[]) {
  return db.selectFrom('users')
    .selectAll()
    .where("id", "in", userIds)
    .execute()
})

export const findUserByResetToken = cache(async function(resetToken: string) {
  return db.selectFrom('users')
    .where('reset_token', '=', resetToken)
    .selectAll()
    .executeTakeFirst()
})

export function getPasswordHash(password: string) {
  const saltedPass = (process.env['NEXT_PUBLIC_SALT'] || '') + password
  return sha256(saltedPass).toString();
}

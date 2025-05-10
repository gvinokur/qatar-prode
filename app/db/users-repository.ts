import {db} from './database'
import {createBaseFunctions} from "./base-repository";
import {User, UserTable} from "./tables-definition";
import sha256 from 'crypto-js/sha256'
import {cache} from "react";
import {PushSubscription} from "web-push";

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

export async function verifyEmail(token: string) {
  const now = new Date();

  return await db.updateTable('users')
    .set({
      email_verified: true,
      verification_token: null,
      verification_token_expiration: null
    })
    .where(eb => eb.and([
      eb('verification_token', '=', token),
      eb('verification_token_expiration', '>', now)
    ]))
    .returningAll()
    .executeTakeFirst();
}

export async function findUserByVerificationToken(token: string) {
  const now = new Date();

  return await db.selectFrom('users')
    .where(eb => eb.and([
      eb('verification_token', '=', token),
      eb('verification_token_expiration', '>', now)
    ]))
    .selectAll()
    .executeTakeFirst();
}

function removeInvaidubscriptions(newSubscriptions: PushSubscription[]) {
  return newSubscriptions.filter(sub =>
    sub.endpoint ||
    sub.expirationTime && sub.expirationTime < Date.now());
}

export async function addNotificationSubscription(userId: string, subscription: PushSubscription) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  let newSubscriptions: PushSubscription[] =
    user.notification_subscriptions ?
      [...user.notification_subscriptions, subscription] :
      [subscription];

  newSubscriptions = removeInvaidubscriptions(newSubscriptions);

  return await db.updateTable('users')
    .set({
      notification_subscriptions: JSON.stringify(newSubscriptions)
    })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst();
}

export async function removeNotificationSubscription(userId: string, subscription: PushSubscription) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  let newSubscriptions: PushSubscription[] =
    user.notification_subscriptions ?
      user.notification_subscriptions.filter(sub => sub.endpoint !== subscription.endpoint) :
      [];

  newSubscriptions = removeInvaidubscriptions(newSubscriptions)

  return await db.updateTable('users')
    .set({
      notification_subscriptions: JSON.stringify(newSubscriptions)
    })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst();
}

export async function getNotificationSubscriptions(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user.notification_subscriptions || [];
}

import {db} from './database'
import {createBaseFunctions} from "./base-repository";
import {OAuthAccount, User, UserTable} from "./tables-definition";
import sha256 from 'crypto-js/sha256'
import {cache} from "react";
import {PushSubscription} from "web-push";
import {sql} from "kysely";

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

export const findAllUsers = cache(async function () {
  return db.selectFrom('users')
    .select(['id', 'email', 'nickname', 'is_admin'])
    .orderBy('email', 'asc')
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

function removeInvalidSubscriptions(newSubscriptions: PushSubscription[]) {
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

  newSubscriptions = removeInvalidSubscriptions(newSubscriptions);

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

  newSubscriptions = removeInvalidSubscriptions(newSubscriptions)

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

export async function findUsersWithNotificationSubscriptions() {
  return db.selectFrom('users')
    .where(eb => eb.and([
      eb('notification_subscriptions', 'is not', null),
      eb(eb.fn<number>('jsonb_array_length', ['notification_subscriptions']), '>', 0)
    ]))
    .selectAll()
    .execute();
}

// ============================================
// OAuth Repository Functions
// ============================================

/**
 * Find user by OAuth provider and provider user ID
 * Queries the oauth_accounts JSONB array for matching provider and provider_user_id
 */
export const findUserByOAuthAccount = cache(async function(
  provider: string,
  providerUserId: string
): Promise<User | undefined> {
  return db.selectFrom('users')
    .where(eb =>
      eb(
        sql`oauth_accounts @> ${sql.lit(
          JSON.stringify([{ provider, provider_user_id: providerUserId }])
        )}::jsonb`,
        '=',
        sql`true`
      )
    )
    .selectAll()
    .executeTakeFirst();
});

/**
 * Link OAuth account to existing user
 * Atomically appends OAuth account to oauth_accounts array and updates auth_providers
 */
export async function linkOAuthAccount(
  userId: string,
  oauthAccount: OAuthAccount
): Promise<User | undefined> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Append to oauth_accounts array
  const currentOAuthAccounts = user.oauth_accounts || [];
  const newOAuthAccounts = [...currentOAuthAccounts, oauthAccount];

  // Update auth_providers array
  const currentProviders = user.auth_providers || [];
  const newProviders = currentProviders.includes(oauthAccount.provider)
    ? currentProviders
    : [...currentProviders, oauthAccount.provider];

  return db.updateTable('users')
    .set({
      oauth_accounts: JSON.stringify(newOAuthAccounts),
      auth_providers: JSON.stringify(newProviders)
    })
    .where('id', '=', userId)
    .returningAll()
    .executeTakeFirst();
}

/**
 * Create new OAuth-only user
 * Uses displayName from OAuth provider as nickname (or null if not provided)
 */
export async function createOAuthUser(
  email: string,
  oauthAccount: OAuthAccount,
  displayName: string | null
): Promise<User | undefined> {
  return db.insertInto('users')
    .values({
      email,
      nickname: displayName,
      password_hash: null,  // OAuth-only user
      auth_providers: JSON.stringify([oauthAccount.provider]),
      oauth_accounts: JSON.stringify([oauthAccount]),
      email_verified: true  // OAuth providers verify email
    })
    .returningAll()
    .executeTakeFirst();
}

/**
 * Get authentication methods available for an email
 * Returns { hasPassword, hasGoogle, userExists } for progressive disclosure
 */
export const getAuthMethodsForEmail = cache(async function(
  email: string
): Promise<{ hasPassword: boolean; hasGoogle: boolean; userExists: boolean }> {
  const user = await findUserByEmail(email);

  if (!user) {
    return { hasPassword: false, hasGoogle: false, userExists: false };
  }

  const authProviders = user.auth_providers || [];
  return {
    hasPassword: authProviders.includes('credentials'),
    hasGoogle: authProviders.includes('google'),
    userExists: true
  };
});

/**
 * Get auth_providers array for a user
 * Helper function for checking authentication methods
 */
export function getAuthProviders(user: User): string[] {
  return user.auth_providers || [];
}

/**
 * Check if user has password authentication enabled
 * Returns true if password_hash is not null
 */
export function userHasPasswordAuth(user: User): boolean {
  return user.password_hash !== null;
}

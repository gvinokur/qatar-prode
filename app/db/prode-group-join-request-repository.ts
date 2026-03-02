import { db } from './database';
import { cache } from 'react';
import {
  ProdeGroupJoinRequest,
  JoinRequestStatus,
  JoinRequestSource
} from './tables-definition';

/**
 * Create a new join request
 */
export async function createJoinRequest(
  groupId: string,
  userId: string,
  source: JoinRequestSource = 'invite_link',
  message?: string
): Promise<ProdeGroupJoinRequest> {
  return db
    .insertInto('prode_group_join_requests')
    .values({
      group_id: groupId,
      user_id: userId,
      status: 'pending',
      request_source: source,
      message: message ?? null
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Find join requests for a group (for admin view)
 * Returns requests with user profile data
 */
export const findJoinRequestsByGroup = cache(
  async function (groupId: string, status?: JoinRequestStatus) {
    let query = db
      .selectFrom('prode_group_join_requests')
      .leftJoin('users', 'users.id', 'prode_group_join_requests.user_id')
      .select([
        'prode_group_join_requests.id',
        'prode_group_join_requests.group_id',
        'prode_group_join_requests.user_id',
        'prode_group_join_requests.status',
        'prode_group_join_requests.request_source',
        'prode_group_join_requests.requested_at',
        'prode_group_join_requests.resolved_at',
        'prode_group_join_requests.resolved_by_user_id',
        'prode_group_join_requests.message',
        'users.nickname as user_nickname',
        'users.email as user_email'
      ])
      .where('prode_group_join_requests.group_id', '=', groupId);

    if (status) {
      query = query.where('prode_group_join_requests.status', '=', status);
    }

    return query.orderBy('prode_group_join_requests.requested_at', 'desc').execute();
  }
);

/**
 * Find join requests by user (for user's pending requests sidebar)
 * Returns requests with group basic info
 */
export const findJoinRequestsByUser = cache(
  async function (userId: string, status?: JoinRequestStatus) {
    let query = db
      .selectFrom('prode_group_join_requests')
      .leftJoin('prode_groups', 'prode_groups.id', 'prode_group_join_requests.group_id')
      .leftJoin(
        (eb) =>
          eb
            .selectFrom('prode_group_participants')
            .select([
              'prode_group_participants.prode_group_id',
              eb.fn.countAll<string>().as('member_count')
            ])
            .groupBy('prode_group_participants.prode_group_id')
            .as('group_counts'),
        (join) => join.onRef('group_counts.prode_group_id', '=', 'prode_groups.id')
      )
      .select([
        'prode_group_join_requests.id',
        'prode_group_join_requests.group_id',
        'prode_group_join_requests.user_id',
        'prode_group_join_requests.status',
        'prode_group_join_requests.request_source',
        'prode_group_join_requests.requested_at',
        'prode_group_join_requests.resolved_at',
        'prode_groups.name as group_name',
        'prode_groups.theme as group_theme',
        'group_counts.member_count'
      ])
      .where('prode_group_join_requests.user_id', '=', userId);

    if (status) {
      query = query.where('prode_group_join_requests.status', '=', status);
    }

    return query.orderBy('prode_group_join_requests.requested_at', 'desc').execute();
  }
);

/**
 * Find a specific pending request for a user/group combination
 */
export async function findPendingJoinRequest(
  groupId: string,
  userId: string
): Promise<ProdeGroupJoinRequest | undefined> {
  return db
    .selectFrom('prode_group_join_requests')
    .selectAll()
    .where('group_id', '=', groupId)
    .where('user_id', '=', userId)
    .where('status', '=', 'pending')
    .executeTakeFirst();
}

/**
 * Find recent rejected request (for cooldown check)
 * Returns rejected request within last 7 days
 */
export async function findRecentRejectedRequest(
  groupId: string,
  userId: string
): Promise<ProdeGroupJoinRequest | undefined> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return db
    .selectFrom('prode_group_join_requests')
    .selectAll()
    .where('group_id', '=', groupId)
    .where('user_id', '=', userId)
    .where('status', '=', 'rejected')
    .where('resolved_at', '>', sevenDaysAgo)
    .executeTakeFirst();
}

/**
 * Approve join request (marks approved + adds to group)
 * Uses two-step process with compensating rollback (Vercel Postgres doesn't support transactions)
 */
export async function approveJoinRequest(
  requestId: string,
  resolvedByUserId: string
): Promise<ProdeGroupJoinRequest> {
  // Step 1: Update request status to 'approved'
  const request = await db
    .updateTable('prode_group_join_requests')
    .set({
      status: 'approved',
      resolved_at: new Date(),
      resolved_by_user_id: resolvedByUserId
    })
    .where('id', '=', requestId)
    .returningAll()
    .executeTakeFirstOrThrow();

  // Step 2: Add user to group
  try {
    await db
      .insertInto('prode_group_participants')
      .values({
        prode_group_id: request.group_id,
        participant_id: request.user_id,
        is_admin: false
      })
      .execute();
  } catch (error) {
    // Compensating transaction: revert request status to pending
    await db
      .updateTable('prode_group_join_requests')
      .set({
        status: 'pending',
        resolved_at: null,
        resolved_by_user_id: null
      })
      .where('id', '=', requestId)
      .execute();

    throw error;
  }

  return request;
}

/**
 * Reject join request
 */
export async function rejectJoinRequest(
  requestId: string,
  resolvedByUserId: string
): Promise<ProdeGroupJoinRequest> {
  return db
    .updateTable('prode_group_join_requests')
    .set({
      status: 'rejected',
      resolved_at: new Date(),
      resolved_by_user_id: resolvedByUserId
    })
    .where('id', '=', requestId)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Cancel join request (user cancels own request)
 * Validates request belongs to user
 */
export async function cancelJoinRequest(
  requestId: string,
  userId: string
): Promise<void> {
  await db
    .deleteFrom('prode_group_join_requests')
    .where('id', '=', requestId)
    .where('user_id', '=', userId)
    .execute();
}

/**
 * Count pending requests for a group (for notification badge)
 */
export async function countPendingRequestsForGroup(groupId: string): Promise<number> {
  const result = await db
    .selectFrom('prode_group_join_requests')
    .select((eb) => eb.fn.countAll<string>().as('count'))
    .where('group_id', '=', groupId)
    .where('status', '=', 'pending')
    .executeTakeFirst();

  return result ? Number(result.count) : 0;
}

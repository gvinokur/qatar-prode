'use server';

import { getLoggedInUser } from './user-actions';
import {
  createJoinRequest,
  findJoinRequestsByGroup,
  findJoinRequestsByUser,
  findPendingJoinRequest,
  findRecentRejectedRequest,
  approveJoinRequest as approveJoinRequestRepo,
  rejectJoinRequest as rejectJoinRequestRepo,
  cancelJoinRequest as cancelJoinRequestRepo,
  countPendingRequestsForGroup as countPendingRequestsRepo
} from '../db/prode-group-join-request-repository';
import { findProdeGroupById, findParticipantsInGroup } from '../db/prode-group-repository';
import { findUsersByIds } from '../db/users-repository';
import { JoinRequestSource } from '../db/tables-definition';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendEmail } from '../utils/email';
import {
  generateJoinRequestNotificationEmail,
  generateJoinRequestApprovedEmail,
  generateJoinRequestRejectedEmail
} from '../utils/email-templates';
import { Locale } from '@/i18n.config';

/**
 * Request to join a friend group
 */
const messageSchema = z.string().max(300).optional().nullable();

export async function requestToJoinGroup(groupId: string, source: JoinRequestSource = 'invite_link', locale: Locale = 'es', tournamentId?: string, message?: string) {
  const parsedMessage = messageSchema.parse(message);
  const trimmedMessage = parsedMessage?.trim() || undefined;

  const user = await getLoggedInUser();
  if (!user) {
    throw new Error('Should not call this action from a logged out page');
  }

  // Validate group exists
  const group = await findProdeGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Check user is not the owner
  if (group.owner_user_id === user.id) {
    throw new Error('You are the owner of this group');
  }

  // Check user is not already a member
  const participants = await findParticipantsInGroup(groupId);
  const isAlreadyMember = participants.some(p => p.user_id === user.id);
  if (isAlreadyMember) {
    throw new Error('You are already a member of this group');
  }

  // Check no pending request exists
  const existingPendingRequest = await findPendingJoinRequest(groupId, user.id);
  if (existingPendingRequest) {
    throw new Error('You already have a pending request for this group');
  }

  // Check for recent rejection with active cooldown
  const recentRejection = await findRecentRejectedRequest(groupId, user.id);
  if (recentRejection?.resolved_at) {
    const nextEligibleDate = new Date(recentRejection.resolved_at);
    nextEligibleDate.setDate(nextEligibleDate.getDate() + 7);

    if (new Date() < nextEligibleDate) {
      const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
      throw new Error(`You can request to join again on ${formatter.format(nextEligibleDate)}`);
    }
  }

  // Create the request
  await createJoinRequest(groupId, user.id, source, trimmedMessage);

  // Send email notifications to all admins + owner (non-blocking, fire and forget)
  const adminParticipants = participants.filter(p => p.is_admin);
  const adminUserIds = [group.owner_user_id, ...adminParticipants.map(p => p.user_id)];
  const uniqueAdminIds = [...new Set(adminUserIds)]; // Remove duplicates
  const adminUsers = await findUsersByIds(uniqueAdminIds);

  // Send individual emails to each admin (fire and forget)
  adminUsers.forEach(admin => {
    const adminLocale = (admin.preferred_locale as 'en' | 'es') || 'en';
    const groupUrl = tournamentId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/${adminLocale}/tournaments/${tournamentId}/friend-groups/${groupId}?tab=admin`
      : `${process.env.NEXT_PUBLIC_APP_URL}/${adminLocale}/friend-groups/${groupId}`;
    const requestedDate = new Intl.DateTimeFormat(adminLocale, { dateStyle: 'medium' }).format(new Date());

    const emailPromise = generateJoinRequestNotificationEmail(
      admin.email,
      admin.nickname || admin.email || 'Unknown',
      user.nickname || user.email || 'Unknown',
      group.name,
      requestedDate,
      groupUrl,
      { locale: adminLocale, message: trimmedMessage }
    ).then(emailData => sendEmail(emailData));

    // Fire and forget - don't await
    emailPromise.catch(err => console.error('Error sending join request notification email:', err));
  });

  return { success: true, message: 'Join request submitted successfully' };
}

/**
 * Get user's join requests (for sidebar)
 */
export async function getUserJoinRequests() {
  const user = await getLoggedInUser();
  if (!user) {
    return [];
  }

  // Get pending and recent resolved requests (last 30 days)
  const allRequests = await findJoinRequestsByUser(user.id);

  // Filter to pending and recent resolved (within 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return allRequests.filter(request =>
    request.status === 'pending' ||
    (request.resolved_at && request.resolved_at > thirtyDaysAgo)
  );
}

/**
 * Get group's join requests (for admin)
 */
export async function getGroupJoinRequests(groupId: string) {
  const user = await getLoggedInUser();
  if (!user) {
    throw new Error('Should not call this action from a logged out page');
  }

  // Check permission: owner OR admin
  const group = await findProdeGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const groupParticipants = await findParticipantsInGroup(groupId);
  const isAdmin = groupParticipants.find(p => p.user_id === user.id)?.is_admin;

  if (!(group.owner_user_id === user.id || isAdmin)) {
    throw new Error('Only group owner or admins can view join requests');
  }

  // Get pending requests
  const pendingRequests = await findJoinRequestsByGroup(groupId, 'pending');

  // Get recently-rejected requests (within last 7 days) so admins can approve if they made a mistake
  const rejectedRequests = await findJoinRequestsByGroup(groupId, 'rejected');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyRejected = rejectedRequests.filter(r =>
    r.resolved_at && new Date(r.resolved_at) > sevenDaysAgo
  );

  return [...pendingRequests, ...recentlyRejected];
}

/**
 * Approve join request
 */
export async function approveJoinRequestAction(requestId: string, groupId: string, tournamentId?: string) {
  const user = await getLoggedInUser();
  if (!user) {
    throw new Error('Should not call this action from a logged out page');
  }

  // Check permission: owner OR admin
  const group = await findProdeGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const groupParticipants = await findParticipantsInGroup(groupId);
  const isAdmin = groupParticipants.find(p => p.user_id === user.id)?.is_admin;

  if (!(group.owner_user_id === user.id || isAdmin)) {
    throw new Error('Only group owner or admins can approve join requests');
  }

  // Approve request (marks approved + adds user to group)
  const request = await approveJoinRequestRepo(requestId, user.id);

  // Send approval email to user (fire and forget)
  const requesterUsers = await findUsersByIds([request.user_id]);
  if (requesterUsers.length > 0) {
    const requester = requesterUsers[0];
    const requesterLocale = (requester.preferred_locale as 'en' | 'es') || 'en';
    const groupUrl = tournamentId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/${requesterLocale}/tournaments/${tournamentId}/friend-groups/${groupId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/${requesterLocale}/friend-groups/${groupId}`;

    const emailPromise = generateJoinRequestApprovedEmail(
      requester.email,
      requester.nickname || requester.email,
      group.name,
      groupUrl,
      requesterLocale
    ).then(emailData => sendEmail(emailData));

    emailPromise.catch(err => console.error('Error sending approval email:', err));
  }

  // Revalidate group page
  revalidatePath(`/tournaments/[tournament_id]/friend-groups/${groupId}`);

  return { success: true, message: 'Join request approved' };
}

/**
 * Reject join request
 */
export async function rejectJoinRequestAction(requestId: string, groupId: string) {
  const user = await getLoggedInUser();
  if (!user) {
    throw new Error('Should not call this action from a logged out page');
  }

  // Check permission: owner OR admin
  const group = await findProdeGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const groupParticipants = await findParticipantsInGroup(groupId);
  const isAdmin = groupParticipants.find(p => p.user_id === user.id)?.is_admin;

  if (!(group.owner_user_id === user.id || isAdmin)) {
    throw new Error('Only group owner or admins can reject join requests');
  }

  // Reject request
  const request = await rejectJoinRequestRepo(requestId, user.id);

  // Send rejection email to user (fire and forget)
  const requesterUsers = await findUsersByIds([request.user_id]);
  if (requesterUsers.length > 0) {
    const requester = requesterUsers[0];
    const requesterLocale = (requester.preferred_locale as 'en' | 'es') || 'en';

    const emailPromise = generateJoinRequestRejectedEmail(
      requester.email,
      requester.nickname || requester.email,
      group.name,
      requesterLocale
    ).then(emailData => sendEmail(emailData));

    emailPromise.catch(err => console.error('Error sending rejection email:', err));
  }

  // Revalidate group page
  revalidatePath(`/tournaments/[tournament_id]/friend-groups/${groupId}`);

  return { success: true, message: 'Join request rejected' };
}

/**
 * Cancel join request (user cancels own request)
 */
export async function cancelJoinRequestAction(requestId: string) {
  const user = await getLoggedInUser();
  if (!user) {
    throw new Error('Should not call this action from a logged out page');
  }

  // Cancel request (validates request belongs to user)
  await cancelJoinRequestRepo(requestId, user.id);

  return { success: true, message: 'Join request cancelled' };
}

/**
 * Get pending request count for badge
 */
export async function getPendingRequestCount(groupId: string): Promise<number> {
  const user = await getLoggedInUser();
  if (!user) {
    return 0;
  }

  // Check permission: owner OR admin
  const group = await findProdeGroupById(groupId);
  if (!group) {
    return 0;
  }

  const groupParticipants = await findParticipantsInGroup(groupId);
  const isAdmin = groupParticipants.find(p => p.user_id === user.id)?.is_admin;

  if (!(group.owner_user_id === user.id || isAdmin)) {
    return 0;
  }

  return countPendingRequestsRepo(groupId);
}

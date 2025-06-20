'use server'

import {
  sendNotification as sendPushNotification,
  setVapidDetails,
  PushSubscription
} from 'web-push'
import {getLoggedInUser} from "./user-actions";
import {
  addNotificationSubscription,
  findUserById,
  findUsersByIds,
  findUsersWithNotificationSubscriptions,
  removeNotificationSubscription
} from "../db/users-repository";
import {User} from "../db/tables-definition";
import { findParticipantsInGroup, findProdeGroupById } from "../db/prode-group-repository";

setVapidDetails(
  'mailto:la-maquina@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const _subscription = null;

export async function subscribeUser(sub: PushSubscription) {
  const user = await getLoggedInUser()
  if(!user) {
    throw new Error('User not logged in')
  }
  await addNotificationSubscription(user.id, sub)
  return { success: true }
}

export async function unsubscribeUser(sub: PushSubscription) {
  const user = await getLoggedInUser()
  if(!user) {
    throw new Error('User not logged in')
  }
  await removeNotificationSubscription(user.id, sub)

  return { success: true }
}

export async function sendNotification(
    title: string,
    message: string,
    url: string,
    userIds: string | string [] | null,
    sendToAllUsers = false
  ) {

  let users: User[] = []

  if(sendToAllUsers) {
    users = await findUsersWithNotificationSubscriptions()
  } else if (typeof userIds === 'string') {
    const user = await findUserById(userIds)
    if (!user) {
      throw new Error('Users not found')
    }
    users = [user]
  } else if (Array.isArray(userIds)) {
    users = await findUsersByIds(userIds)
  }
  
  if (!users || users.length === 0 || users.some(user => !user)) {
    throw new Error('Users not found')
  }

  const sentToAll = await Promise.all(
    users.map(async (user) =>
      sendToUser(user, title, message, url)))

  return {
    success: sentToAll.some((result) => result.success),
    errors:
      sentToAll
        .filter((result) => result.error)
        .map((result) => result.error)
    ,
    sentCount: sentToAll.reduce(
      (acc, result) => acc + (result.sentCount || 0), 0),
    errorCount: sentToAll.reduce(
      (acc, result) => acc + (result.error ? 1 : 0), 0)
  }
}

async function sendToUser(user: User, title: string, message: string, url: string) {
  if (!user.notification_subscriptions || user.notification_subscriptions.length === 0) {
    return { success: 0 , error: 'No user subscriptions available' }
  }
  try {
    const results = await Promise.all(
      user.notification_subscriptions.map(async (sub) => {
        return await sendPushNotification(
          sub,
          JSON.stringify({
            title,
            body: message,
            icon: '/web-app-manifest-192x192.png',
            url,
          })
        ).catch(async (error) => {
          if (error.statusCode === 404) {
            //Subscription not found, remove it
            await removeNotificationSubscription(user.id, sub)
            return {statusCode: 404, body: 'Subscription not found'}
          }
          return {statusCode: 500, body: 'Failed to send notification'}
        })
      })
    )
    return {
      success: results.some(r => r.statusCode === 201),
      sentCount: results.filter(r => r.statusCode === 201).length
    }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return {success: false, error: 'Failed to send notification'}
  }
}

/**
 * Send a notification from a group admin to all group participants (except sender).
 * targetPage: 'tournament' | 'friends-group'
 */
export async function sendGroupNotification({ groupId, tournamentId, targetPage, title, message, senderId }: {
  groupId: string,
  tournamentId: string,
  targetPage: 'tournament' | 'friends-group',
  title: string,
  message: string,
  senderId: string
}) {
  // Find all participants in the group
  const participants = await findParticipantsInGroup(groupId);
  const group = await findProdeGroupById(groupId);
  if(!group) {
    throw new Error('Group not found')
  }
  const recipientIds: string[] = [
    group.owner_user_id,
    ...participants.map((p) => p.user_id)
  ].filter((id) => id !== senderId);
  
  // Send notification to each recipient
  const url = targetPage === 'friends-group' ? `${process.env.NEXT_PUBLIC_APP_URL}/friend-groups/${groupId}` : 
    `${process.env.NEXT_PUBLIC_APP_URL}/tournaments/${tournamentId}`
  await sendNotification(
    title,
    message,
    url,
    recipientIds,
    false
  );
}

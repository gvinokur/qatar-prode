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
  findUsersWithNotificationSubscriptions,
  removeNotificationSubscription
} from "../db/users-repository";
import {User} from "../db/tables-definition";

setVapidDetails(
  'mailto:la-maquina@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

let subscription: PushSubscription | null = null

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
    userId: string | null,
    sendToAllUsers = false
  ) {

  let users: User[] = []

  if(sendToAllUsers) {
    users = await findUsersWithNotificationSubscriptions()
  } else if (userId) {
    users = [await findUserById(userId)]
  }
  if (!users) {
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

'use server'

import {
  sendNotification as sendPushNotification,
  setVapidDetails,
  PushSubscription
} from 'web-push'
import {getLoggedInUser} from "./user-actions";
import {addNotificationSubscription, findUserById, removeNotificationSubscription} from "../db/users-repository";

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

  if(!userId) {
    throw new Error('Sending to all users is not allowed yet')
  }
  const user = await findUserById(userId)
  if (!user) {
    throw new Error('User not found')
  }
  if (!user.notification_subscriptions || user.notification_subscriptions.length === 0) {
    throw new Error('No user subscriptions available')
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
            return { statusCode: 404, body: 'Subscription not found' }
          }
          return { statusCode: 500, body: 'Failed to send notification' }
        })
      })
    )
    return {
      success: results.some(r => r.statusCode === 201),
      sentCount: results.filter(r => r.statusCode === 201).length }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

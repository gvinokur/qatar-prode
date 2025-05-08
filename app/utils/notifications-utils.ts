import {PushSubscription} from "web-push";
import {subscribeUser, unsubscribeUser} from "../actions/notifiaction-actions";

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Check if the browser supports notifications
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Check if the current endpoint is already subscribed
export const checkExistingSubscription = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

export async function subscribeToNotifications(): Promise<void> {
  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;

    // Subscribe the user
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });

    const serializedSub: PushSubscription = JSON.parse(JSON.stringify(subscription))

    // Save the subscription to the database
    await subscribeUser(serializedSub)
  }
}

export async function unsubscribeFromNotifications(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    await subscription.unsubscribe();
  }
  //No need to remove from DB, it will be cleaned up later
}

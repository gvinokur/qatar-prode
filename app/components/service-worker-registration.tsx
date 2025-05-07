export function registerServiceWorker() {
  if ('serviceWorker' in navigator && typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
      await navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // TODO: How to check this and only do it if there are badges?
      await navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({ type: 'clear-notifications', payload: 'Clear notifications' });
      });
    });
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function sendNotification(title: string, options: NotificationOptions = {}) {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    console.log('Notification permission not granted');
    return;
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      ...options
    });
  } else {
    new Notification(title, options);
  }
}

export function registerServiceWorker() {
  return;

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
    });
  }
}

export function clearBadges() {
  // TODO: How to check this and only do it if there are badges?
  navigator.serviceWorker.ready.then(registration => {
    registration.active?.postMessage({ type: 'clear-notifications', payload: 'Clear notifications' });
  });
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

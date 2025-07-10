export function registerServiceWorker() {
  // Service worker registration disabled
  return;
}

export function clearBadges() {
  // TODO: How to check this and only do it if there are badges?
  navigator.serviceWorker.ready.then(registration => {
    registration.active?.postMessage({ type: 'clear-notifications', payload: 'Clear notifications' });
  });
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
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

export function onUpdate(_registration: ServiceWorkerRegistration) {
  // ... existing code ...
}

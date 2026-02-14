export function clearBadges() {
  // Clear notification badges if service worker is available
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage({ type: 'clear-notifications', payload: 'Clear notifications' });
    });
  }
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

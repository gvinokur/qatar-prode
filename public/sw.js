const CACHE_NAME = 'next-pwa-cache-v1';

let notificationCount = 0

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/manifest.json'
            ]);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    if(navigator.clearAppBadge) {
        navigator.clearAppBadge();
    }
    self.clients.claim();
});

// Fetch event - passthrough to network
self.addEventListener('fetch', (event) => {
    // Simple passthrough - doesn't modify or intercept requests
    // Just let the browser handle the request normally
    const request = event.request;
    if(!/(png|jpg|webp)/.test(request.url)) {
        event.respondWith(fetch(request));
    }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    //Clear badges on notification click
    notificationCount = 0
    if (navigator.clearAppBadge) {
        navigator.clearAppBadge()
    }

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // If a window client is already open, focus it
            const url = event.notification?.data?.url || '/';
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if ("openWindow" in clients) {
                clients.openWindow(url).then((windowClient) => (windowClient ? windowClient.focus() : null));
            }
        })
    );
});

// Push event - handle incoming push messages
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();

    const options = {
        body: data.body || 'New notification',
        icon: '/web-app-manifest-192x192.png',
        badge: '/favicon-96x96.png',
        image: 'https://la-maquina-prode-group-images.s3-us-east-2.amazonaws.com/tournament-logos/wQHH6EA2M4wMNWhLvVeK3B.png',
        data: {
            url: data.url || '/'
        }
    };

    notificationCount += 1
    if (navigator.setAppBadge) {
        navigator.setAppBadge(notificationCount);
    }

    event.waitUntil(
        self.registration.showNotification(data.title || 'Notification', options)
    );
});

self.addEventListener('message', (event) => {
    if (event.data.type === 'clear-notifications') {
        notificationCount = 0
        if (navigator.clearAppBadge) {
            navigator.clearAppBadge()
        }
    }
})

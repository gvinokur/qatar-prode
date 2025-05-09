const CACHE_NAME = 'la-maquina-cache-v1';

let notificationCount = 0
const isOffline = () => !self.navigator.onLine;

const createIndexedDB = ({name, stores}) => {
    const request = self.indexedDB.open(name, 1);

    return new Promise((resolve, reject) => {
        request.onupgradeneeded = e => {
            const db = e.target.result;

            Object.keys(stores).forEach((store) => {
                const {name, keyPath} = stores[store];

                if(!db.objectStoreNames.contains(name)) {
                    db.createObjectStore(name, {keyPath});
                    console.log('create objectstore', name);
                }
            });
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const filesToCache = [
    '/',
    '/manifest.json',
    '/offline',
    '/web-app-manifest-192x192.png',
    '/favicon-96x96.png'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
    e.waitUntil(
        caches.open(cacheName)
            .then((cache) => Promise.all([
                cache.addAll(filesToCache.map(file => new Request(file, {cache: 'no-cache'}))),
                createIndexedDB(IDBConfig)
            ]))
            .catch(err => console.error('install error', err))
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
    self.clients.claim();
});

// Fetch event - passthrough to network
self.addEventListener('fetch', (event) => {
    // Simple passthrough - doesn't modify or intercept requests
    // Just let the browser handle the request normally
    const request = event.request;
    if(!/(png|jpg|webp)/.test(request.url)) {
        event.respondWith(async () => {
            if(isOffline()) {
                return await caches.match('/offline');
            } else {
                try {
                    return await fetch(request);
                } catch (err) {
                    console.error('fetch error', err)
                    return await caches.match('/offline');
                }
            }
        })

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

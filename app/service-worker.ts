import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Change this attribute's name to your `injectionPoint`.
    // `injectionPoint` is an InjectManifest option.
    // See https://serwist.pages.dev/docs/build/configuring
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;
let notificationCount = 0;


const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

self.addEventListener("push", (event:any) => {
  const data = JSON.parse(event.data?.text() ?? '{ title: "" }');

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

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();

  //Clear badges on notification click
  notificationCount = 0
  if (navigator.clearAppBadge) {
    navigator.clearAppBadge()
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList: any) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return self.clients.openWindow("/");
    }),
  );
});

self.addEventListener('message', (event: any) => {
  if (event.data.type === 'clear-notifications') {
    notificationCount = 0
    if (navigator.clearAppBadge) {
      navigator.clearAppBadge()
    }
  }
})

serwist.addEventListeners();




self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Customer cards and balances are deliberately never cached here.
// This keeps personal loyalty data from persisting on shared devices.
self.addEventListener('fetch', () => {});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || 'RIADH CARD', {
    body: data.body || 'You have a new loyalty update.', icon: '/logo.png', badge: '/logo.png', tag: data.tag || 'riadh-card', data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});

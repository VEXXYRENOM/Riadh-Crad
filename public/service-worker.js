self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Customer cards and balances are deliberately never cached here.
// This keeps personal loyalty data from persisting on shared devices.
self.addEventListener('fetch', () => {});

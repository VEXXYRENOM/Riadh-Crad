'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    void navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.error('[PWA] Service worker registration failed', error);
    });
  }, []);

  return null;
}

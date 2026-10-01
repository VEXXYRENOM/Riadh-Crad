'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';

function vapidBytes(key: string) {
  const base64 = `${key}${'='.repeat((4 - key.length % 4) % 4)}`.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export function PushNotificationButton() {
  const [state, setState] = useState<'loading' | 'ready' | 'enabled' | 'hidden' | 'error'>('loading');
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  useEffect(() => {
    if (!key || !('serviceWorker' in navigator) || !('PushManager' in window)) { setState('hidden'); return; }
    void navigator.serviceWorker.ready.then(async (registration) => setState(await registration.pushManager.getSubscription() ? 'enabled' : 'ready'));
  }, [key]);
  const enable = async () => {
    if (!key) return;
    setState('loading');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidBytes(key) });
      const response = await fetch('/api/push/subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error('Subscription failed');
      setState('enabled');
    } catch { setState('error'); }
  };
  if (state === 'hidden') return null;
  return <button type="button" onClick={() => void enable()} disabled={state === 'loading' || state === 'enabled'} className="w-full max-w-sm rounded-2xl border border-gold-200 bg-white/80 px-5 py-3 text-sm font-semibold text-obsidian-700 hover:bg-gold-50 disabled:cursor-default"><span className="flex items-center justify-center gap-2">{state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : state === 'enabled' ? <Check className="h-4 w-4 text-emerald-600" /> : <Bell className="h-4 w-4 text-gold-700" />}{state === 'enabled' ? 'Notifications enabled' : state === 'error' ? 'Try notifications again' : 'Get offers and reward reminders'}</span></button>;
}

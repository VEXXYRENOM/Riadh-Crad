'use client';

import { useEffect, useRef, useState } from 'react';
import { BellRing, Loader2, MapPin } from 'lucide-react';

type Props = { merchantName: string; merchantSlug: string; latitude: number | null; longitude: number | null; enabled: boolean; radiusMetres: number };
const COOLDOWN_MS = 12 * 60 * 60 * 1000;

function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(lat2 - lat1); const dLng = radians(lng2 - lng1);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function ProximityReminder({ merchantName, merchantSlug, latitude, longitude, enabled, radiusMetres }: Props) {
  const watchId = useRef<number | null>(null);
  const [state, setState] = useState<'hidden' | 'ready' | 'watching' | 'error'>('hidden');
  const cooldownKey = `riadh-proximity:${merchantSlug}`;

  useEffect(() => () => { if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current); }, []);
  if (!enabled || latitude === null || longitude === null) return null;
  const merchantLatitude = latitude;
  const merchantLongitude = longitude;

  async function notifyNearby() {
    const lastNotice = Number(localStorage.getItem(cooldownKey) ?? 0);
    if (Date.now() - lastNotice < COOLDOWN_MS) return;
    const options: NotificationOptions = { body: `You are near ${merchantName}. Open your RIADH CARD to see today’s rewards.`, icon: '/logo.png', badge: '/logo.png', tag: cooldownKey, data: { url: `/b/${merchantSlug}` } };
    const registration = await navigator.serviceWorker?.ready;
    if (registration) await registration.showNotification(`Near ${merchantName}`, options);
    else new Notification(`Near ${merchantName}`, options);
    localStorage.setItem(cooldownKey, String(Date.now()));
  }

  async function enableReminder() {
    if (!('geolocation' in navigator) || !('Notification' in window) || !window.isSecureContext) { setState('error'); return; }
    setState('ready');
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission !== 'granted') { setState('error'); return; }
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const distance = distanceMetres(position.coords.latitude, position.coords.longitude, merchantLatitude, merchantLongitude);
        if (distance <= radiusMetres) void notifyNearby();
      },
      () => setState('error'),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 },
    );
    setState('watching');
  }

  return <div className="w-full max-w-sm rounded-2xl border border-gold-200 bg-white/80 px-5 py-4 shadow-sm"><div className="flex gap-3"><div className="mt-0.5 rounded-xl bg-gold-100 p-2 text-gold-700"><MapPin className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold text-obsidian-800">Nearby offer reminder</p><p className="mt-1 text-xs leading-relaxed text-obsidian-500">Get a reminder when you are within about {radiusMetres} m of {merchantName}. Your location stays on your device.</p>{state === 'error' && <p className="mt-2 text-xs text-red-600">Location or notification permission was not granted. HTTPS is required.</p>}<button type="button" onClick={() => void enableReminder()} disabled={state === 'watching' || state === 'ready'} className="btn-ghost-gold mt-3 px-3 py-2 text-xs disabled:opacity-60">{state === 'ready' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}{state === 'watching' ? 'Reminder active' : 'Enable nearby reminder'}</button></div></div></div>;
}

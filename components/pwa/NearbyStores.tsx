'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Compass, Loader2, MapPin, Navigation } from 'lucide-react';

type NearbyMerchant = { id: string; name: string; slug: string; logo_url: string | null; cover_image_url: string | null; description: string | null; address: string | null; latitude: number; longitude: number; distance_m?: number };

function distanceLabel(metres?: number) {
  if (metres === undefined) return 'Location available';
  return metres < 1000 ? `${metres} m away` : `${(metres / 1000).toFixed(1)} km away`;
}

export function NearbyStores() {
  const [stores, setStores] = useState<NearbyMerchant[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<NearbyMerchant | null>(null);

  async function loadStores(latitude?: number, longitude?: number) {
    setState('loading'); setMessage('');
    try {
      const params = latitude === undefined ? '' : `?lat=${latitude}&lng=${longitude}&radius=10000`;
      const response = await fetch(`/api/discover/merchants${params}`);
      const result = await response.json() as { success: boolean; merchants?: NearbyMerchant[]; message?: string };
      if (!response.ok || !result.success) throw new Error(result.message ?? 'Could not load stores.');
      setStores(result.merchants ?? []); setSelected(result.merchants?.[0] ?? null); setState('ready');
    } catch (error) { setState('error'); setMessage(error instanceof Error ? error.message : 'Could not load stores.'); }
  }

  function findNearMe() {
    if (!navigator.geolocation) { void loadStores(); setMessage('Location is unavailable on this device; showing stores with locations instead.'); return; }
    setState('loading'); setMessage('Requesting your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => void loadStores(position.coords.latitude, position.coords.longitude),
      () => { void loadStores(); setMessage('Location permission was not granted; showing stores with locations instead.'); },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 },
    );
  }

  const mapUrl = selected ? `https://www.openstreetmap.org/export/embed.html?bbox=${selected.longitude - 0.01}%2C${selected.latitude - 0.006}%2C${selected.longitude + 0.01}%2C${selected.latitude + 0.006}&layer=mapnik&marker=${selected.latitude}%2C${selected.longitude}` : null;
  return <main className="customer-shell min-h-dvh px-4 py-8"><div className="mx-auto flex w-full max-w-4xl flex-col gap-5"><header className="rounded-3xl border border-gold-200 bg-white/80 p-6 shadow-sm"><p className="label-gold">RIADH CARD</p><h1 className="heading-luxury mt-1 text-3xl text-obsidian-900">Discover nearby stores</h1><p className="mt-2 max-w-xl text-sm text-obsidian-500">Find local RIADH CARD shops, see their rewards, and open a loyalty card in one tap.</p><button onClick={findNearMe} disabled={state === 'loading'} className="btn-gold mt-5 disabled:opacity-60">{state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}{state === 'loading' ? 'Finding stores…' : 'Find stores near me'}</button>{message && <p className="mt-3 text-xs text-obsidian-500">{message}</p>}</header>
    {mapUrl && <iframe title={`Map of ${selected?.name}`} src={mapUrl} className="h-64 w-full rounded-3xl border border-gold-200 bg-white" loading="lazy" referrerPolicy="no-referrer" />}
    {state === 'ready' && stores.length === 0 && <div className="rounded-3xl border border-dashed border-gold-300 bg-white/60 px-6 py-12 text-center"><Compass className="mx-auto h-8 w-8 text-gold-700" /><p className="mt-3 font-semibold text-obsidian-800">No RIADH CARD stores found nearby</p><p className="mt-1 text-sm text-obsidian-500">Try again later or expand your area.</p></div>}
    <section className="grid gap-4 sm:grid-cols-2">{stores.map((store) => <article key={store.id} className="overflow-hidden rounded-3xl border border-gold-200 bg-white/80 shadow-sm"><button type="button" onClick={() => setSelected(store)} className="block w-full text-left"><div className="h-24 bg-obsidian-900">{store.cover_image_url && <img src={store.cover_image_url} alt="" className="h-full w-full object-cover opacity-75" />}</div></button><div className="p-5"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gold-100 font-bold text-gold-800">{store.logo_url ? <img src={store.logo_url} alt="" className="h-full w-full object-cover" /> : store.name.charAt(0)}</div><div className="min-w-0"><h2 className="truncate font-bold text-obsidian-900">{store.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-gold-700"><MapPin className="h-3.5 w-3.5" />{distanceLabel(store.distance_m)}</p></div></div>{store.description && <p className="mt-3 line-clamp-2 text-sm text-obsidian-500">{store.description}</p>}<div className="mt-4 flex items-center justify-between gap-3"><a href={`https://www.openstreetmap.org/?mlat=${store.latitude}&mlon=${store.longitude}#map=17/${store.latitude}/${store.longitude}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-obsidian-500 hover:text-gold-700">Directions</a><Link href={`/b/${store.slug}`} className="btn-gold px-3 py-2 text-xs">Open card</Link></div></div></article>)}</section>
  </div></main>;
}

'use client';

import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { Camera, CheckCircle2, ExternalLink, ImagePlus, Loader2, MapPin, Save, Store, Trophy } from 'lucide-react';
import type { MerchantRow } from '@/types';

type EditableFields = Pick<MerchantRow,
  'name' | 'description' | 'phone' | 'address' | 'welcome_message' |
  'points_per_dinar' | 'tier_silver_min' | 'tier_gold_min' | 'tier_platinum_min'
>;

const initialFields = (merchant: MerchantRow): EditableFields => ({
  name: merchant.name,
  description: merchant.description,
  phone: merchant.phone,
  address: merchant.address,
  welcome_message: merchant.welcome_message,
  points_per_dinar: merchant.points_per_dinar,
  tier_silver_min: merchant.tier_silver_min,
  tier_gold_min: merchant.tier_gold_min,
  tier_platinum_min: merchant.tier_platinum_min,
});

export function MerchantProfileSettings({ merchant: initialMerchant }: { merchant: MerchantRow }) {
  const [merchant, setMerchant] = useState(initialMerchant);
  const [fields, setFields] = useState<EditableFields>(initialFields(initialMerchant));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof EditableFields>(key: K, value: EditableFields[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  async function uploadImage(event: ChangeEvent<HTMLInputElement>, kind: 'logo' | 'cover') {
    const image = event.target.files?.[0];
    event.target.value = '';
    if (!image) return;
    setUploading(kind);
    setFeedback(null);
    const data = new FormData();
    data.set('image', image);
    data.set('kind', kind);
    try {
      const response = await fetch('/api/merchant/profile/image', { method: 'POST', body: data });
      const result = await response.json() as { success: boolean; url?: string; message?: string };
      if (!response.ok || !result.success || !result.url) throw new Error(result.message ?? 'Image upload failed.');
      setMerchant((current) => ({ ...current, [kind === 'logo' ? 'logo_url' : 'cover_image_url']: result.url }));
      setFeedback({ type: 'success', message: kind === 'logo' ? 'Logo updated.' : 'Storefront photo updated.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Image upload failed.' });
    } finally {
      setUploading(null);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/merchant/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const result = await response.json() as { success: boolean; merchant?: MerchantRow; message?: string };
      if (!response.ok || !result.success || !result.merchant) throw new Error(result.message ?? 'Could not save changes.');
      setMerchant(result.merchant);
      setFields(initialFields(result.merchant));
      setFeedback({ type: 'success', message: 'Your store profile has been saved.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not save changes.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-7 pb-10">
      <div className="animate-fade-up">
        <p className="label-gold mb-1">Merchant workspace</p>
        <h1 className="heading-luxury text-3xl text-obsidian-900 sm:text-4xl">Store profile &amp; loyalty settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-obsidian-500">Make your customer card feel like your shop. Update its identity, contact details and the rules customers use to earn their rewards.</p>
      </div>

      {feedback && (
        <div role="status" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {feedback.message}
        </div>
      )}

      <section className="card-luxury overflow-hidden animate-fade-up" style={{ animationDelay: '0.06s' }}>
        <div className="relative h-48 bg-obsidian-900 sm:h-60">
          {merchant.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={merchant.cover_image_url} alt={`Storefront of ${merchant.name}`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_85%_20%,rgba(239,192,106,.55),transparent_22%),linear-gradient(135deg,#1C1917,#46382F)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <button type="button" onClick={() => coverInput.current?.click()} disabled={uploading !== null} className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-obsidian-800 shadow-lg transition hover:bg-gold-50 disabled:opacity-60">
            {uploading === 'cover' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 text-gold-700" />} Replace storefront photo
          </button>
          <input ref={coverInput} onChange={(event) => uploadImage(event, 'cover')} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" />
        </div>
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
          <div className="-mt-14 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gold-100 shadow-gold-glow">
            {merchant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={merchant.logo_url} alt={`${merchant.name} logo`} className="h-full w-full object-cover" />
            ) : <Store className="h-9 w-9 text-gold-700" />}
          </div>
          <div className="flex-1"><p className="text-lg font-bold text-obsidian-900">{merchant.name}</p><p className="text-xs text-obsidian-500">Your public customer card: /b/{merchant.slug}</p></div>
          <button type="button" onClick={() => logoInput.current?.click()} disabled={uploading !== null} className="btn-ghost-gold px-4 py-2 text-xs disabled:opacity-60">
            {uploading === 'logo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Update logo
          </button>
          <input ref={logoInput} onChange={(event) => uploadImage(event, 'logo')} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" />
        </div>
      </section>

      <form onSubmit={saveProfile} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card-luxury p-5 lg:col-span-2">
          <div className="mb-5 flex items-center gap-2"><Store className="h-4 w-4 text-gold-700" /><h2 className="font-semibold text-obsidian-900">Public shop information</h2></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Store name"><input required value={fields.name} onChange={(e) => setField('name', e.target.value)} className="input-gold" maxLength={100} /></Field>
            <Field label="Loyalty card link"><div className="input-gold flex items-center justify-between bg-obsidian-50 text-sm text-obsidian-500">/b/{merchant.slug}<a href={`/b/${merchant.slug}`} target="_blank" className="text-gold-700" aria-label="Open customer card"><ExternalLink className="h-4 w-4" /></a></div></Field>
            <Field label="Phone"><input value={fields.phone ?? ''} onChange={(e) => setField('phone', e.target.value || null)} className="input-gold" maxLength={40} placeholder="+216 …" /></Field>
            <Field label="Address"><div className="relative"><MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-600" /><input value={fields.address ?? ''} onChange={(e) => setField('address', e.target.value || null)} className="input-gold pl-10" maxLength={250} placeholder="Tunis, Tunisia" /></div></Field>
            <div className="sm:col-span-2"><Field label="About your shop"><textarea value={fields.description ?? ''} onChange={(e) => setField('description', e.target.value || null)} className="input-gold min-h-24 resize-y" maxLength={500} placeholder="Tell customers what makes your shop special." /></Field></div>
            <div className="sm:col-span-2"><Field label="Welcome message"><textarea value={fields.welcome_message ?? ''} onChange={(e) => setField('welcome_message', e.target.value || null)} className="input-gold min-h-20 resize-y" maxLength={500} placeholder="A warm message for your members." /></Field></div>
          </div>
        </section>

        <section className="card-luxury p-5">
          <div className="mb-5 flex items-center gap-2"><Trophy className="h-4 w-4 text-gold-700" /><h2 className="font-semibold text-obsidian-900">Rewards rules</h2></div>
          <div className="flex flex-col gap-4">
            <Field label="Points for 1 TND"><input required min="0.01" step="0.01" type="number" value={fields.points_per_dinar} onChange={(e) => setField('points_per_dinar', Number(e.target.value))} className="input-gold" /></Field>
            <p className="-mt-1 text-xs leading-relaxed text-obsidian-500">Set the automatic membership promotion milestones. They must increase from Silver to Platinum.</p>
            <Field label="Silver starts at"><input required min="1" type="number" value={fields.tier_silver_min} onChange={(e) => setField('tier_silver_min', Number(e.target.value))} className="input-gold" /></Field>
            <Field label="Gold starts at"><input required min="1" type="number" value={fields.tier_gold_min} onChange={(e) => setField('tier_gold_min', Number(e.target.value))} className="input-gold" /></Field>
            <Field label="Platinum starts at"><input required min="1" type="number" value={fields.tier_platinum_min} onChange={(e) => setField('tier_platinum_min', Number(e.target.value))} className="input-gold" /></Field>
          </div>
        </section>

        <div className="lg:col-span-3 flex justify-end"><button disabled={saving} className="btn-gold disabled:cursor-not-allowed"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}</button></div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-obsidian-700">{label}</span>{children}</label>;
}

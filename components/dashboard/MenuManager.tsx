'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Edit3, Eye, EyeOff, Loader2, Plus, Save, Sparkles, UtensilsCrossed, X } from 'lucide-react';
import type { MenuItemRow } from '@/types';

type FormState = { name: string; description: string; ingredients: string; price_tnd: string; reward_points: string; is_available: boolean; sort_order: string };
const blankForm: FormState = { name: '', description: '', ingredients: '', price_tnd: '', reward_points: '', is_available: true, sort_order: '0' };
const toForm = (item: MenuItemRow): FormState => ({ name: item.name, description: item.description ?? '', ingredients: item.ingredients.join(', '), price_tnd: String(item.price_tnd), reward_points: String(item.reward_points), is_available: item.is_available, sort_order: String(item.sort_order) });

export function MenuManager({ initialItems }: { initialItems: MenuItemRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<FormState>(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const reset = () => { setForm(blankForm); setEditingId(null); };

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setFeedback(null);
    const payload = { ...form, ingredients: form.ingredients.split(',').map((value) => value.trim()).filter(Boolean), price_tnd: Number(form.price_tnd), reward_points: Number(form.reward_points), sort_order: Number(form.sort_order) };
    try {
      const response = await fetch('/api/merchant/menu', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload) });
      const result = await response.json() as { success: boolean; item?: MenuItemRow; message?: string };
      if (!response.ok || !result.success || !result.item) throw new Error(result.message ?? 'Could not save the item.');
      setItems((current) => editingId ? current.map((item) => item.id === result.item!.id ? result.item! : item) : [...current, result.item!].sort((a, b) => a.sort_order - b.sort_order));
      setFeedback({ type: 'success', message: editingId ? 'Menu item updated.' : 'Menu item added.' });
      reset();
    } catch (error) { setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not save the item.' }); }
    finally { setSaving(false); }
  }

  function startEdit(item: MenuItemRow) { setEditingId(item.id); setForm(toForm(item)); setFeedback(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  return <div className="mx-auto flex max-w-6xl flex-col gap-7 pb-10">
    <header className="animate-fade-up"><p className="label-gold mb-1">Customer experience</p><h1 className="heading-luxury text-3xl text-obsidian-900 sm:text-4xl">Menu &amp; <span className="text-gold-gradient-static">rewards</span></h1><p className="mt-2 max-w-2xl text-sm text-obsidian-500">Set the cash price, ingredients and points needed for every product. Changes appear on your customer menu immediately.</p></header>
    {feedback && <div role="status" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}><CheckCircle2 className="h-4 w-4" />{feedback.message}</div>}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <form onSubmit={save} className="card-luxury h-fit p-5 lg:col-span-2"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><Plus className="h-4 w-4 text-gold-700" /><h2 className="font-semibold text-obsidian-900">{editingId ? 'Edit product' : 'Add product'}</h2></div>{editingId && <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-semibold text-obsidian-500 hover:text-obsidian-800"><X className="h-3.5 w-3.5" />Cancel</button>}</div><div className="flex flex-col gap-4">
        <label className="text-xs font-semibold text-obsidian-700">Product name<input required maxLength={120} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Cappuccino" className="mt-1.5 w-full rounded-xl border border-gold-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-100" /></label>
        <label className="text-xs font-semibold text-obsidian-700">Short description<textarea maxLength={500} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="A short, appetising description" rows={2} className="mt-1.5 w-full resize-none rounded-xl border border-gold-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-100" /></label>
        <label className="text-xs font-semibold text-obsidian-700">Ingredients <span className="font-normal text-obsidian-400">separate with commas</span><input value={form.ingredients} onChange={(e) => update('ingredients', e.target.value)} placeholder="Espresso, milk, cocoa" className="mt-1.5 w-full rounded-xl border border-gold-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-100" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-obsidian-700">Price (TND)<input required min="0" step="0.001" type="number" value={form.price_tnd} onChange={(e) => update('price_tnd', e.target.value)} placeholder="0.000" className="mt-1.5 w-full rounded-xl border border-gold-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-500" /></label><label className="text-xs font-semibold text-obsidian-700">Reward points<input required min="1" step="1" type="number" value={form.reward_points} onChange={(e) => update('reward_points', e.target.value)} placeholder="100" className="mt-1.5 w-full rounded-xl border border-gold-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-500" /></label></div>
        <div className="flex items-center justify-between rounded-xl bg-gold-50 px-3 py-2.5"><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-obsidian-700"><input type="checkbox" checked={form.is_available} onChange={(e) => update('is_available', e.target.checked)} className="h-4 w-4 accent-gold-600" />Available to clients</label><label className="flex items-center gap-2 text-xs text-obsidian-500">Order<input min="0" step="1" type="number" value={form.sort_order} onChange={(e) => update('sort_order', e.target.value)} className="w-14 rounded-lg border border-gold-200 bg-white px-2 py-1 text-center" /></label></div>
        <button disabled={saving} className="btn-gold flex w-full items-center justify-center gap-2 py-3 text-sm disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{editingId ? 'Save changes' : 'Add to menu'}</button>
      </div></form>
      <section className="card-luxury overflow-hidden lg:col-span-3"><div className="flex items-center justify-between border-b border-gold-100 px-5 py-4"><div className="flex items-center gap-2"><UtensilsCrossed className="h-4 w-4 text-gold-700" /><h2 className="font-semibold text-obsidian-900">Your products</h2></div><span className="rounded-full bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-800">{items.length}</span></div>{items.length === 0 ? <div className="flex flex-col items-center gap-2 py-14 text-center text-obsidian-400"><UtensilsCrossed className="h-9 w-9 text-gold-300" /><p className="text-sm">Your menu is empty. Add your first product.</p></div> : <div className="divide-y divide-gold-100">{items.map((item) => <article key={item.id} className="flex gap-4 p-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-700"><Sparkles className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-obsidian-900">{item.name}</p><p className="mt-0.5 text-xs text-obsidian-500">{Number(item.price_tnd).toFixed(3)} TND · {item.reward_points.toLocaleString()} points</p></div><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${item.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-obsidian-100 text-obsidian-500'}`}>{item.is_available ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}{item.is_available ? 'LIVE' : 'HIDDEN'}</span></div>{item.ingredients.length > 0 && <p className="mt-2 truncate text-xs text-obsidian-400">{item.ingredients.join(' · ')}</p>}<button type="button" onClick={() => startEdit(item)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-gold-700 hover:text-gold-800"><Edit3 className="h-3.5 w-3.5" />Edit</button></div></article>)}</div>}</section>
    </div>
  </div>;
}

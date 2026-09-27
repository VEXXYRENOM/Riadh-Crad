'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Check,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Gift,
  MapPin,
  Medal,
  Menu,
  Nfc,
  QrCode,
  Radar,
  Sparkles,
  Star,
  Store,
  Trophy,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { LogoMark } from '@/components/LogoMark';

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const sectionReveal = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0 },
};

const plans = [
  {
    name: 'Essential',
    price: '49',
    description: 'For independent cafés and local favourites.',
    features: ['NFC stand + dynamic QR', 'Up to 500 members', 'Live loyalty dashboard'],
  },
  {
    name: 'Signature',
    price: '99',
    description: 'The polished loyalty engine for growing venues.',
    features: ['Everything in Essential', '100m proximity campaigns', 'Reward catalogue + redemption desk', 'Priority merchant support'],
    featured: true,
  },
  {
    name: 'Maison',
    price: '199',
    description: 'For multi-location hospitality brands.',
    features: ['Everything in Signature', 'Multiple venues', 'White-glove launch support', 'Advanced member insights'],
  },
];

function GoldOrb({ className }: { className: string }) {
  return <div aria-hidden="true" className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />;
}

function QrPattern() {
  const cells = Array.from({ length: 49 });
  const filled = new Set([0, 1, 2, 7, 9, 14, 16, 17, 18, 21, 23, 25, 28, 30, 31, 33, 35, 36, 38, 41, 43, 44, 46, 47, 48]);
  return (
    <div className="grid grid-cols-7 gap-[2px] rounded-lg bg-white p-1.5 shadow-sm" aria-label="QR code preview">
      {cells.map((_, index) => (
        <span key={index} className={`aspect-square rounded-[1px] ${filled.has(index) ? 'bg-stone-900' : 'bg-transparent'}`} />
      ))}
    </div>
  );
}

function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 38, rotate: 7 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.95, delay: 0.2, ease }}
      className="relative mx-auto w-[285px] sm:w-[318px]"
    >
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, -1, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative overflow-hidden rounded-[2.75rem] border-[7px] border-stone-900 bg-[#fbfaf7] p-2.5 shadow-[0_38px_90px_-28px_rgba(56,38,15,0.48),0_0_0_1px_rgba(255,255,255,0.6)_inset]"
      >
        <div className="absolute left-1/2 top-2.5 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-stone-900" />
        <div className="relative min-h-[540px] overflow-hidden rounded-[2rem] bg-[linear-gradient(155deg,#fffdf8_0%,#f6ecdc_100%)] px-4 pb-5 pt-10">
          <div className="mb-5 flex items-center justify-between text-[9px] font-semibold text-stone-600">
            <span>9:41</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected</span>
          </div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-stone-500">Good evening,</p>
              <p className="font-display text-xl font-semibold text-stone-900">Yasmine</p>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full border border-[#dfc288]/50 bg-white/80 text-[#a67018]">
              <BellRing size={14} />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#191714_0%,#34271a_48%,#94681c_130%)] p-4 text-white shadow-[0_14px_25px_-12px_rgba(82,53,11,0.8)]">
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#e7c66e]/20 blur-xl" />
            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#f6df9b] to-transparent" />
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-1.5 text-[8px] font-bold tracking-[0.18em] text-[#f6d985]"><Crown size={11} fill="currentColor" /> RIADH CARD</div>
              <div className="rounded-full border border-[#f8df91]/35 px-2 py-0.5 text-[7px] font-bold tracking-wider text-[#ffeaac]">GOLD VIP</div>
            </div>
            <div className="relative mt-6">
              <p className="text-[9px] text-white/60">LOYALTY BALANCE</p>
              <p className="font-display text-3xl font-semibold leading-none"><span className="text-xl">425.00</span> <span className="text-sm text-[#f8dc8d]">TND</span></p>
            </div>
            <div className="relative mt-5 flex items-end justify-between text-[8px] text-white/70"><span>YASMINE BEN SALEM</span><span>•••• 2508</span></div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#e9d8b9] bg-white/75 p-2.5">
              <div className="mb-1 flex items-center gap-1 text-[8px] text-stone-500"><Trophy size={10} className="text-[#b48225]" /> YOUR TIER</div>
              <p className="text-xs font-bold text-stone-900">Gold Member</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#eee2cc]"><div className="h-full w-[72%] rounded-full bg-[linear-gradient(90deg,#b67a18,#efd17b)]" /></div>
            </div>
            <div className="rounded-xl border border-[#e9d8b9] bg-white/75 p-2.5">
              <div className="mb-1 flex items-center gap-1 text-[8px] text-stone-500"><Gift size={10} className="text-[#b48225]" /> NEXT REWARD</div>
              <p className="text-xs font-bold text-stone-900">Free Coffee</p>
              <p className="mt-1 text-[8px] text-[#a67018]">75 TND to go</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#e9d8b9] bg-white/75 p-3">
            <div className="flex items-center justify-between"><p className="text-[9px] font-semibold text-stone-800">Tap to collect your points</p><span className="grid h-6 w-6 place-items-center rounded-full bg-[#f7edd8] text-[#a67018]"><Nfc size={13} /></span></div>
            <div className="mt-2 flex items-center gap-2"><div className="h-1 flex-1 overflow-hidden rounded-full bg-[#f0e5d1]"><div className="h-full w-2/3 rounded-full bg-[#c38b26]" /></div><span className="text-[8px] font-semibold text-stone-500">650 / 1,000</span></div>
          </div>
          <div className="mt-5 flex items-center justify-around border-t border-[#e7d8bd] pt-3 text-[8px] text-stone-400">
            <span className="flex flex-col items-center gap-1 text-[#a67018]"><WalletCards size={13} /> Pass</span><span className="flex flex-col items-center gap-1"><Gift size={13} /> Rewards</span><span className="flex flex-col items-center gap-1"><Store size={13} /> Places</span>
          </div>
        </div>
      </motion.div>
      <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0, 0.45] }} transition={{ duration: 2.4, repeat: Infinity }} className="absolute -right-6 top-[48%] grid h-16 w-16 place-items-center rounded-full border border-[#c99c4c]/60 bg-[#fbf2dd]/70 text-[#ae7418] backdrop-blur-sm"><Nfc size={24} /></motion.div>
      <div className="absolute -bottom-7 left-1/2 -z-10 h-20 w-[110%] -translate-x-1/2 rounded-[100%] bg-[#d2a247]/25 blur-2xl" />
    </motion.div>
  );
}

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="relative isolate overflow-hidden bg-[#faf8f5] text-[#1c1917] selection:bg-[#d9b969]/40">
      <GoldOrb className="-right-52 -top-32 h-[32rem] w-[32rem] bg-[#f2cf77]/25" />
      <GoldOrb className="left-[-20rem] top-[34rem] h-[36rem] w-[36rem] bg-[#ddbd77]/15" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#faf8f5_0%,#f9f5ee_46%,#f3ece0_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.28] [background-image:radial-gradient(rgba(119,85,30,0.19)_0.7px,transparent_0.7px)] [background-size:13px_13px]" />

      <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease }} className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center" aria-label="RIADH CARD home"><LogoMark size={36} /></Link>
        <nav className="hidden items-center gap-8 text-sm text-stone-600 md:flex"><a href="#experience" className="transition hover:text-stone-950">Experience</a><a href="#features" className="transition hover:text-stone-950">Features</a><a href="#pricing" className="transition hover:text-stone-950">Pricing</a></nav>
        <div className="hidden items-center gap-3 md:flex"><Link href="/merchant/login" className="rounded-full px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white/70">Sign in</Link><a href="#pricing" className="rounded-full border border-[#b88329]/30 bg-white/60 px-4 py-2 text-sm font-semibold text-[#7c5212] shadow-[0_8px_20px_-12px_rgba(117,75,11,0.5)] backdrop-blur transition hover:border-[#b88329]/60">Become a partner</a></div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="grid h-10 w-10 place-items-center rounded-full border border-[#b88329]/25 bg-white/70 text-stone-800 md:hidden" aria-label="Toggle navigation">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
        {mobileOpen && <div className="absolute right-5 top-[4.5rem] flex w-56 flex-col gap-1 rounded-2xl border border-[#d9bd86]/45 bg-[#fffcf7]/95 p-3 shadow-xl backdrop-blur md:hidden"><a onClick={() => setMobileOpen(false)} href="#experience" className="rounded-xl px-3 py-2 text-sm">Experience</a><a onClick={() => setMobileOpen(false)} href="#features" className="rounded-xl px-3 py-2 text-sm">Features</a><a onClick={() => setMobileOpen(false)} href="#pricing" className="rounded-xl px-3 py-2 text-sm">Pricing</a><Link href="/merchant/login" className="mt-1 rounded-xl bg-stone-900 px-3 py-2 text-center text-sm font-semibold text-white">Merchant login</Link></div>}
      </motion.header>
      {/* Separator line between navbar and content */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="border-t border-[#d9c28a]/40" /></div>

      <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-8 sm:px-8 sm:pb-20 md:grid-cols-[1.05fr_.95fr] md:items-center lg:px-10 lg:pb-24 lg:pt-12">
        <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }} className="relative z-10 max-w-2xl">
          <motion.div variants={fadeUp} transition={{ duration: 0.65, ease }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#cfaa5c]/35 bg-white/65 px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-[#8d5f14] shadow-sm backdrop-blur"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#bf8b2d] opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#b98021]" /></span> TUNISIA&apos;S LUXURY LOYALTY LAYER</motion.div>
          <motion.h1 variants={fadeUp} transition={{ duration: 0.75, ease }} className="font-display text-[2.75rem] font-semibold leading-[0.95] tracking-[-0.04em] text-[#1c1917] sm:text-5xl lg:text-[4.25rem]">Replace Paper Cards with <span className="bg-[linear-gradient(115deg,#8a5b13,#e2bf63,#8a5b13)] bg-clip-text text-transparent">Ultra-Luxury</span> NFC Digital Loyalty.</motion.h1>
          <motion.p variants={fadeUp} transition={{ duration: 0.65, ease }} className="mt-7 max-w-xl text-base leading-7 text-stone-600 sm:text-lg">Every <strong className="font-semibold text-stone-800">1 TND = points</strong>. Customers tap their phone or scan a live QR to collect. Your best guests receive elegant, timely 100m proximity alerts before they walk by.</motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.65, ease }} className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/merchant/login" className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#201c18] px-6 py-3.5 text-sm font-semibold text-[#fff9ed] shadow-[0_14px_32px_-14px_rgba(34,25,14,0.7)] transition hover:-translate-y-0.5 hover:bg-[#3b2d1b]">Merchant Login <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></Link><Link href="/b/demo-cafe" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#b47c21]/40 bg-white/60 px-6 py-3.5 text-sm font-semibold text-[#815711] backdrop-blur transition hover:border-[#9a6614] hover:bg-white/90"><Sparkles size={16} /> Try Live Customer Demo</Link></motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.65, ease }} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-stone-500"><span className="flex items-center gap-1.5"><BadgeCheck size={15} className="text-[#a56f19]" /> No app download required</span><span className="flex items-center gap-1.5"><BadgeCheck size={15} className="text-[#a56f19]" /> Tunisian merchant support</span></motion.div>
        </motion.div>
        <div id="experience" className="relative flex min-h-[620px] items-center justify-center md:min-h-[680px]">
          <div className="absolute h-[28rem] w-[28rem] rounded-full border border-[#d6b66e]/25 bg-[radial-gradient(circle,rgba(255,253,248,.92)_0%,rgba(241,215,156,.2)_48%,transparent_71%)]" />
          <div className="absolute h-[22rem] w-[22rem] rounded-full border border-dashed border-[#c99d48]/30" />
          <div className="absolute left-0 top-[16%] hidden rounded-2xl border border-[#dfc38b]/40 bg-white/70 p-3.5 shadow-[0_18px_35px_-22px_rgba(75,50,15,.5)] backdrop-blur sm:block"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#f5e7c9] text-[#9b6717]"><MapPin size={15} /></span><div><p className="text-[10px] text-stone-500">Nearby now</p><p className="text-xs font-bold">12 VIP guests</p></div></div></div>
          <div className="absolute bottom-[15%] right-0 hidden items-center gap-2 rounded-2xl border border-[#dfc38b]/40 bg-white/70 p-3.5 shadow-[0_18px_35px_-22px_rgba(75,50,15,.5)] backdrop-blur sm:flex"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#f5e7c9] text-[#9b6717]"><CircleDollarSign size={15} /></span><div><p className="text-[10px] text-stone-500">Points earned today</p><p className="text-xs font-bold">+ 6,480 TND</p></div></div>
          <PhoneMockup />
        </div>
      </section>

      <motion.section initial="hidden" animate="visible" transition={{ delay: 0.72, staggerChildren: 0.11 }} className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="grid overflow-hidden rounded-[1.6rem] border border-[#cda65a]/35 bg-[#231d17] text-[#fffaf0] shadow-[0_22px_55px_-22px_rgba(65,43,12,.5)] md:grid-cols-3">{[[Zap, '100ms', 'Instant NFC Sync'], [Radar, '100m', 'Proximity Radar'], [Medal, '1 TND', 'Base Reward Rate']].map(([Icon, value, label], i) => { const StatIcon = Icon as typeof Zap; return <motion.div variants={fadeUp} transition={{ duration: 0.5, ease }} key={label as string} className={`flex items-center gap-4 px-6 py-5 sm:px-9 ${i < 2 ? 'border-b border-[#d2ad61]/20 md:border-b-0 md:border-r' : ''}`}><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f2d583]/10 text-[#efcf78]"><StatIcon size={20} /></span><div><p className="font-display text-2xl font-semibold leading-none text-[#f4d982]">{value as string}</p><p className="mt-1 text-xs text-[#f9f1dd]/65">{label as string}</p></div></motion.div>})}</div></motion.section>

      <motion.section id="features" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.16 }} transition={{ staggerChildren: 0.1 }} className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <motion.div variants={sectionReveal} transition={{ duration: 0.65, ease }} className="mb-12 max-w-xl"><p className="mb-3 text-xs font-bold tracking-[0.16em] text-[#986417]">MADE FOR REMEMBERED MOMENTS</p><h2 className="font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">A loyalty program your customers want to keep.</h2><p className="mt-4 leading-7 text-stone-600">The delight of a premium membership card, paired with the speed of a modern operating system.</p></motion.div>
        <div className="grid gap-4 md:grid-cols-2"><motion.article variants={sectionReveal} transition={{ duration: 0.6, ease }} whileHover={{ y: -5 }} className="relative min-h-[320px] overflow-hidden rounded-[1.75rem] border border-[#d8bb80]/45 bg-[#fffdf9]/75 p-7 shadow-[0_18px_40px_-27px_rgba(78,53,17,.32)] backdrop-blur"><div className="relative z-10 max-w-[18rem]"><span className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-[#f6e6c3] text-[#925e10]"><Nfc size={21} /></span><h3 className="font-display text-3xl font-semibold">Tap. Scan. Done.</h3><p className="mt-3 text-sm leading-6 text-stone-600">An elegant NFC stand and a dynamic QR code mean every reward interaction is instant, reliable and worth repeating.</p></div><div className="absolute bottom-6 right-6 flex items-center gap-4 rounded-2xl border border-[#e7d3a7] bg-white p-3 shadow-lg"><div className="grid h-12 w-12 place-items-center rounded-xl bg-stone-900 text-[#efd484]"><Nfc size={24} /></div><QrPattern /></div></motion.article>
          <motion.article variants={sectionReveal} transition={{ duration: 0.6, ease }} whileHover={{ y: -5 }} className="relative min-h-[320px] overflow-hidden rounded-[1.75rem] border border-[#d8bb80]/45 bg-[linear-gradient(145deg,#fffaf0,#f0e1c6)] p-7 shadow-[0_18px_40px_-27px_rgba(78,53,17,.32)]"><span className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-[#382d20] text-[#f0d17d]"><Crown size={21} /></span><h3 className="font-display text-3xl font-semibold">Tiers that feel earned.</h3><p className="mt-3 max-w-sm text-sm leading-6 text-stone-600">Your best members rise automatically from Bronze to Silver, Gold and Platinum—with benefits that keep them coming back.</p><div className="absolute bottom-7 right-7 flex items-end gap-2 text-[9px] font-bold"><span className="rounded-lg bg-[#b67537] px-2 py-3 text-white">BRONZE</span><span className="rounded-lg bg-[#c9c7bf] px-2 py-5 text-stone-700">SILVER</span><span className="rounded-lg bg-[#c9982d] px-2 py-7 text-stone-900">GOLD</span><span className="rounded-lg bg-[#40434a] px-2 py-9 text-white">PLATINUM</span></div></motion.article>
          <motion.article variants={sectionReveal} transition={{ duration: 0.6, ease }} whileHover={{ y: -5 }} className="relative min-h-[300px] overflow-hidden rounded-[1.75rem] border border-[#d8bb80]/45 bg-[#e9dec9] p-7 shadow-[0_18px_40px_-27px_rgba(78,53,17,.32)]"><div className="relative z-10 max-w-[19rem]"><span className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-white/75 text-[#925e10]"><Radar size={21} /></span><h3 className="font-display text-3xl font-semibold">A gentle nudge, right on time.</h3><p className="mt-3 text-sm leading-6 text-stone-600">Invite nearby customers back with thoughtful push alerts triggered within a precise 100-metre radius.</p></div><div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full border-[22px] border-[#c5922d]/20" /><div className="absolute bottom-6 right-7 rounded-xl border border-white/70 bg-white/80 p-3 text-xs shadow-lg"><span className="flex items-center gap-2 font-semibold text-stone-800"><BellRing size={14} className="text-[#ad7115]" /> Your coffee awaits</span><span className="mt-1 block text-[10px] text-stone-500">You&apos;re 82m from Maison Riadh</span></div></motion.article>
          <motion.article variants={sectionReveal} transition={{ duration: 0.6, ease }} whileHover={{ y: -5 }} className="relative min-h-[300px] overflow-hidden rounded-[1.75rem] border border-[#d8bb80]/45 bg-[#2a241e] p-7 text-[#fff9eb] shadow-[0_18px_40px_-27px_rgba(78,53,17,.4)]"><div className="relative z-10 max-w-[19rem]"><span className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-[#f2d581]/15 text-[#f2d581]"><Gift size={21} /></span><h3 className="font-display text-3xl font-semibold">Rewards, beautifully managed.</h3><p className="mt-3 text-sm leading-6 text-white/65">Create a merchant reward catalogue and redeem rewards at the desk in one gracious tap.</p></div><div className="absolute bottom-6 right-6 w-40 rounded-2xl border border-[#e8cb79]/30 bg-white/10 p-3 backdrop-blur"><div className="flex items-center justify-between text-[9px] text-[#f5d888]"><span>REWARDS</span><ChevronRight size={12} /></div><div className="mt-3 flex items-center gap-2 rounded-lg bg-white/10 p-2"><span className="grid h-7 w-7 place-items-center rounded-md bg-[#d59e32] text-stone-900"><Star size={13} fill="currentColor" /></span><span className="text-[9px]">Complimentary dessert</span></div></div></motion.article>
        </div>
      </motion.section>

      <section id="pricing" className="relative border-y border-[#d5bb88]/30 bg-white/35 py-24 backdrop-blur-[2px] lg:py-32"><GoldOrb className="left-1/2 top-0 h-80 w-[36rem] -translate-x-1/2 bg-[#f0d188]/20" /><div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold tracking-[0.16em] text-[#986417]">SIMPLE, LOCAL PRICING</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">An exceptional loyalty program, priced for Tunisia.</h2><p className="mt-4 text-stone-600">All plans are billed monthly in TND. Upgrade as your guest list grows.</p></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{plans.map((plan) => <motion.article key={plan.name} whileHover={{ y: -6 }} className={`relative rounded-[1.7rem] border p-7 backdrop-blur-xl ${plan.featured ? 'border-[#b98021]/60 bg-[linear-gradient(150deg,rgba(255,253,247,.94),rgba(246,228,186,.84))] shadow-[0_24px_50px_-24px_rgba(125,79,10,.44)]' : 'border-[#ddc697]/55 bg-white/65 shadow-[0_16px_38px_-28px_rgba(73,50,17,.28)]'}`}>{plan.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2a2119] px-3 py-1 text-[10px] font-bold tracking-[0.13em] text-[#f3d684]">MOST LOVED</div>}<p className="text-sm font-bold tracking-wide text-[#95631b]">{plan.name}</p><p className="mt-4 font-display text-5xl font-semibold">{plan.price}<span className="ml-1 text-lg font-sans font-medium text-stone-500">TND</span></p><p className="mt-2 text-sm text-stone-500">per month</p><p className="mt-6 min-h-10 text-sm leading-5 text-stone-600">{plan.description}</p><a href="mailto:hello@riadhcard.tn" className={`mt-7 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${plan.featured ? 'bg-[#241f1a] text-[#fff9ec] hover:bg-[#423224]' : 'border border-[#ba872c]/40 bg-white/70 text-[#7c5212] hover:bg-white'}`}>Choose {plan.name} <ArrowRight size={15} /></a><ul className="mt-7 space-y-3 border-t border-[#d5bd8c]/35 pt-6">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm text-stone-600"><Check size={16} className="mt-0.5 shrink-0 text-[#a46e18]" />{feature}</li>)}</ul></motion.article>)}</div></div></section>

      <footer className="relative bg-[#211c17] px-5 py-12 text-[#fff8e9] sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end"><div><div className="flex items-center"><div style={{ filter: 'brightness(0) invert(1)' }}><LogoMark size={36} /></div></div><p className="mt-4 max-w-sm text-sm leading-6 text-white/55">The loyalty experience your regulars deserve.</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/60"><a href="#features" className="hover:text-white">Features</a><a href="#pricing" className="hover:text-white">Pricing</a><Link href="/merchant/login" className="hover:text-white">Merchant Login</Link></div></div><div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-5 text-xs text-white/35">© {new Date().getFullYear()} RIADH CARD. Crafted for the modern Tunisian merchant.</div></footer>
    </main>
  );
}

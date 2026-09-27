'use client';
/**
 * @file components/dashboard/QrNfcClient.tsx
 * @description Interactive QR Code + NFC management panel for merchants.
 *
 *  Features:
 *   - Live QR code rendered on canvas via `qrcode` library
 *   - Download as PNG (high-res)
 *   - Copy link to clipboard
 *   - Web Share API (mobile)
 *   - Tab: NFC programming step-by-step guide
 *   - Tab: Print-ready poster preview
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  QrCode, Wifi, Copy, Download, Share2,
  CheckCheck, Printer, Smartphone, Tag,
  ChevronRight, ExternalLink, Info,
} from 'lucide-react';

interface Props {
  merchantName: string;
  merchantSlug: string;
  loyaltyUrl:   string;
}

type Tab = 'qr' | 'nfc' | 'print';

/* ─────────────────────────────────────────────────── */
export function QrNfcClient({ merchantName, merchantSlug, loyaltyUrl }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [tab, setTab]   = useState<Tab>('qr');
  const [copied, setCopied] = useState(false);
  const [qrReady, setQrReady] = useState(false);

  /* Generate QR on canvas */
  const drawQr = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, loyaltyUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#1C1917', light: '#FFFDF5' },
      errorCorrectionLevel: 'H',
    }).then(() => setQrReady(true)).catch(console.error);
  }, [loyaltyUrl]);

  useEffect(() => { drawQr(); }, [drawQr]);

  /* ── Copy link ─────────────────────────────────── */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(loyaltyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Download PNG ──────────────────────────────── */
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* High-res off-screen canvas */
    const size = 1024;
    const off  = document.createElement('canvas');
    off.width  = size;
    off.height = size + 120;
    const ctx  = off.getContext('2d')!;

    /* Background */
    ctx.fillStyle = '#FFFDF5';
    ctx.fillRect(0, 0, off.width, off.height);

    /* Gold border */
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth   = 6;
    ctx.strokeRect(3, 3, off.width - 6, off.height - 6);

    /* QR (scaled) */
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, size, size);

    /* Merchant name */
    ctx.fillStyle   = '#1C1917';
    ctx.font        = `bold 36px serif`;
    ctx.textAlign   = 'center';
    ctx.fillText(merchantName, size / 2, size + 50);

    /* Sub label */
    ctx.fillStyle = '#D4AF37';
    ctx.font      = `500 22px sans-serif`;
    ctx.fillText('Scan to join our loyalty club', size / 2, size + 90);

    const link      = document.createElement('a');
    link.download   = `${merchantSlug}-loyalty-qr.png`;
    link.href       = off.toDataURL('image/png');
    link.click();
  };

  /* ── Web Share ─────────────────────────────────── */
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${merchantName} — Loyalty Club`,
        text:  'Join my loyalty club and start earning points! 🎉',
        url:   loyaltyUrl,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  /* ─── NFC steps ───────────────────────────────── */
  const nfcSteps = [
    {
      icon: '🛒',
      title: 'Buy an NFC Tag',
      body:  'Purchase NTAG213 or NTAG215 stickers (Amazon, AliExpress). Price: ~$0.30 each. Recommended: 25-pack.',
    },
    {
      icon: '📲',
      title: 'Install NFC Tools',
      body:  'Download "NFC Tools" (iOS / Android) — free app by wakdev. It lets you write any URL to your tag.',
    },
    {
      icon: '✍️',
      title: 'Write Your Link',
      body:  `Open NFC Tools → Write → Add a record → URL → paste your link:\n${loyaltyUrl}`,
      code:  loyaltyUrl,
    },
    {
      icon: '📡',
      title: 'Scan to Verify',
      body:  'Hold your phone near the tag. It should open your loyalty page instantly — no app required!',
    },
    {
      icon: '🏪',
      title: 'Place in Your Store',
      body:  'Stick the tag on your counter, menu card, receipt printer, or table stand. Done!',
    },
  ];

  /* ─── TABS ───────────────────────────────────── */
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'qr',    label: 'QR Code',    icon: QrCode    },
    { id: 'nfc',   label: 'NFC Setup',  icon: Wifi      },
    { id: 'print', label: 'Print',      icon: Printer   },
  ];

  return (
    <div className="animate-fade-up flex flex-col gap-6">

      {/* ── Tabs ──────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gold-50 border border-gold-200 rounded-2xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${tab === id
                ? 'bg-obsidian-900 text-white shadow-md'
                : 'text-obsidian-500 hover:text-obsidian-800'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════ QR TAB ══════════ */}
      {tab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* QR Preview card */}
          <div className="card-luxury p-8 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <p className="label-gold">Your Loyalty QR Code</p>
              <p className="text-obsidian-400 text-xs text-center">
                Customers scan this to join <span className="font-semibold text-obsidian-700">{merchantName}</span>&apos;s loyalty club
              </p>
            </div>

            {/* Canvas */}
            <div className="relative p-3 rounded-2xl border-2 border-gold-300 bg-[#FFFDF5] shadow-[0_0_40px_rgba(212,175,55,0.15)]">
              <canvas ref={canvasRef} className="rounded-xl block" />
              {!qrReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* URL chip */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold-50 border border-gold-200 w-full max-w-xs">
              <ExternalLink className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
              <span className="text-obsidian-600 text-xs font-mono truncate">/b/{merchantSlug}</span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-3 w-full">
              <button
                onClick={handleCopy}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all
                  ${copied
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-white border-gold-200 text-obsidian-700 hover:bg-gold-50 hover:border-gold-400'}`}
              >
                {copied ? <CheckCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>

              <button
                onClick={handleDownload}
                disabled={!qrReady}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-gold-200 bg-white text-obsidian-700 text-xs font-semibold hover:bg-gold-50 hover:border-gold-400 transition-all disabled:opacity-40"
              >
                <Download className="w-5 h-5" />
                Download
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-gold-200 bg-white text-obsidian-700 text-xs font-semibold hover:bg-gold-50 hover:border-gold-400 transition-all"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>

          {/* Info / tips */}
          <div className="flex flex-col gap-4">
            {/* How it works */}
            <div className="card-luxury p-6">
              <h3 className="label-gold mb-4">How It Works</h3>
              <ol className="flex flex-col gap-4">
                {[
                  { icon: Smartphone, step: '1', text: 'Customer opens camera & scans your QR code' },
                  { icon: ExternalLink, step: '2', text: `Browser opens ${merchantName}'s loyalty page instantly` },
                  { icon: Tag, step: '3', text: 'Customer enters their phone → loyalty card created' },
                  { icon: CheckCheck, step: '4', text: 'Points accumulate on every visit' },
                ].map(({ icon: Icon, step, text }) => (
                  <li key={step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-obsidian-900 text-xs font-black">{step}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gold-600 flex-shrink-0" />
                      <p className="text-obsidian-600 text-sm">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Pro tip */}
            <div className="card-luxury p-5 border-gold-300"
              style={{ background: 'linear-gradient(135deg, #FFFDF0, #FDF9D7)' }}>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-gold-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-obsidian-800 text-sm font-semibold mb-1">💡 Pro Tip</p>
                  <p className="text-obsidian-600 text-xs leading-relaxed">
                    Print the QR code on table tents, receipts, or a small counter sign.
                    Laminate it for durability. Customers with any modern smartphone can scan
                    without installing any app.
                  </p>
                </div>
              </div>
            </div>

            {/* Open link */}
            <a
              href={loyaltyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold text-center text-sm py-3"
            >
              ↗ Preview Customer View
            </a>
          </div>
        </div>
      )}

      {/* ══════════ NFC TAB ══════════ */}
      {tab === 'nfc' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Steps */}
          <div className="card-luxury p-6 flex flex-col gap-5">
            <div>
              <p className="label-gold mb-1">Step-by-Step NFC Setup</p>
              <p className="text-obsidian-400 text-xs">
                Program an NFC sticker so customers just tap their phone — no scanning needed.
              </p>
            </div>

            <ol className="flex flex-col gap-4">
              {nfcSteps.map((s, i) => (
                <li key={i} className="flex gap-4 items-start group">
                  {/* Step number */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-md text-obsidian-900 font-black text-sm">
                    {s.icon}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-obsidian-800 font-semibold text-sm mb-0.5">{s.title}</p>
                    <p className="text-obsidian-500 text-xs leading-relaxed whitespace-pre-line">{s.body}</p>
                    {s.code && (
                      <code className="mt-2 block text-[11px] bg-obsidian-50 border border-obsidian-100 rounded-lg px-3 py-2 text-gold-700 font-mono break-all">
                        {s.code}
                      </code>
                    )}
                  </div>
                  {i < nfcSteps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gold-400 mt-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* NFC info panel */}
          <div className="flex flex-col gap-4">
            <div className="card-luxury p-6">
              <h3 className="label-gold mb-4">NFC vs QR — Which to use?</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'QR Code',  pros: ['Free to generate', 'Works on all phones', 'Easy to print'], color: '#D4AF37' },
                  { label: 'NFC Tag',  pros: ['No camera needed', 'Just tap phone', 'Premium feel'], color: '#B0C4DE' },
                ].map(({ label, pros, color }) => (
                  <div key={label} className="p-4 rounded-xl bg-obsidian-50 border border-obsidian-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <p className="text-obsidian-800 font-semibold text-sm">{label}</p>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {pros.map(p => (
                        <li key={p} className="flex items-center gap-1.5 text-obsidian-500 text-xs">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended hardware */}
            <div className="card-luxury p-5" style={{ background: 'linear-gradient(135deg, #FFFDF0, #FDF9D7)', borderColor: 'rgba(212,175,55,0.30)' }}>
              <p className="label-gold mb-3">🛒 Recommended Tags</p>
              <ul className="flex flex-col gap-2">
                {[
                  { name: 'NTAG213 Stickers', note: 'Best for counter / table' },
                  { name: 'NTAG215 Cards',    note: 'Credit-card size, durable' },
                  { name: 'NFC Wristbands',   note: 'For events & VIP members' },
                ].map(({ name, note }) => (
                  <li key={name} className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-gold-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-obsidian-800 text-xs font-semibold">{name}</p>
                      <p className="text-obsidian-400 text-[11px]">{note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ PRINT TAB ══════════ */}
      {tab === 'print' && (
        <div className="flex flex-col gap-6">
          <div className="card-luxury p-6">
            <p className="label-gold mb-1">Print-Ready Poster</p>
            <p className="text-obsidian-400 text-xs mb-6">
              Download the QR code and place it in a table tent or counter sign.
            </p>

            {/* Poster preview */}
            <div className="mx-auto max-w-xs bg-[#FFFDF5] border-4 border-[#D4AF37] rounded-3xl p-8 flex flex-col items-center gap-5 shadow-[0_20px_60px_rgba(212,175,55,0.2)]">
              {/* Logo area */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl font-black text-obsidian-900 shadow-md"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #8B6914)' }}>
                  {merchantName.charAt(0)}
                </div>
                <p className="text-obsidian-900 font-black text-lg tracking-tight">{merchantName}</p>
                <p className="text-gold-600 text-xs font-semibold uppercase tracking-widest">VIP Loyalty Program</p>
              </div>

              {/* QR */}
              <div className="p-2 bg-white rounded-xl border border-gold-200">
                <canvas ref={canvasRef} className="rounded-lg block w-48 h-48" style={{ width: 192, height: 192 }} />
              </div>

              <div className="text-center">
                <p className="text-obsidian-800 font-bold text-sm">Scan to Join 📱</p>
                <p className="text-obsidian-400 text-[11px] mt-1">Earn points on every visit</p>
              </div>
            </div>

            {/* Download button */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleDownload}
                disabled={!qrReady}
                className="btn-gold flex items-center justify-center gap-2 text-sm py-3 px-8 disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                Download High-Res PNG
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 text-sm py-3 px-8 rounded-full border border-gold-300 text-obsidian-700 font-semibold hover:bg-gold-50 transition-all"
              >
                <Printer className="w-4 h-4" />
                Print This Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


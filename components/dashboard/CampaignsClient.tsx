'use client';
/**
 * @file components/dashboard/CampaignsClient.tsx
 * @description Interactive campaigns composer + history panel.
 *
 *  Features:
 *   - Message type selector (Promotion / Reminder / Event / Announcement)
 *   - Title + message composer with live character count
 *   - Preview card before sending
 *   - Send to all customers → POST /api/campaigns
 *   - Campaign history table with status badges
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Send, Clock, Users, Megaphone, Tag, Bell, Star, Eye, CheckCircle } from 'lucide-react';

type CampaignType = 'PROMOTION' | 'REMINDER' | 'EVENT' | 'ANNOUNCEMENT';

interface Campaign {
  id:              string;
  title:           string;
  message:         string;
  type:            CampaignType;
  recipient_count: number;
  status:          string;
  sent_at:         string;
}

interface Props {
  merchantId:    string;
  merchantName:  string;
  customerCount: number;
}

const TYPE_CONFIG: Record<CampaignType, {
  label: string; icon: React.ElementType; color: string; bg: string; placeholder: string;
}> = {
  PROMOTION:    { label: 'Promotion',    icon: Tag,      color: '#D4AF37', bg: '#FFFDF0', placeholder: '🎉 Special offer: Get 2× points on all purchases this weekend only!' },
  REMINDER:     { label: 'Reminder',     icon: Bell,     color: '#3B82F6', bg: '#EFF6FF', placeholder: '👋 Hey! You have 200 points ready to redeem. Come visit us!' },
  EVENT:        { label: 'Event',        icon: Star,     color: '#8B5CF6', bg: '#F5F3FF', placeholder: '🎊 Join us this Saturday for our Grand Opening! Free gifts for all members.' },
  ANNOUNCEMENT: { label: 'Announcement', icon: Megaphone, color: '#10B981', bg: '#ECFDF5', placeholder: '📢 We\'ve updated our menu! Come try our new items and earn extra points.' },
};

const MAX_MSG_LENGTH = 280;

export function CampaignsClient({ merchantId, merchantName, customerCount }: Props) {
  const [tab, setTab]         = useState<'compose' | 'history'>('compose');
  const [type, setType]       = useState<CampaignType>('PROMOTION');
  const [title, setTitle]     = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState<{ count: number } | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [history, setHistory] = useState<Campaign[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const cfg = TYPE_CONFIG[type];

  /* ── Load campaign history ──────────────────────────────── */
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res  = await fetch(`/api/campaigns?merchantId=${merchantId}`);
      const data = await res.json();
      if (data.success) setHistory(data.campaigns);
    } catch {
      // silently fail
    } finally {
      setLoadingHistory(false);
    }
  }, [merchantId]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  /* ── Send campaign ──────────────────────────────────────── */
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Please fill in both the title and message.');
      return;
    }
    setSending(true);
    setError(null);

    try {
      const res  = await fetch('/api/campaigns', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ merchantId, title, message, type }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message ?? 'Failed to send campaign.');
        return;
      }

      setSent({ count: data.recipient_count });
      setPreview(false);
      setTitle('');
      setMessage('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const resetComposer = () => {
    setSent(null);
    setError(null);
    setPreview(false);
  };

  /* ── Helpers ────────────────────────────────────────────── */
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const TypeIcon = cfg.icon;

  return (
    <div className="flex flex-col gap-6 animate-fade-up">

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gold-50 border border-gold-200 rounded-2xl w-fit">
        {([
          { id: 'compose', label: 'Compose', icon: Send },
          { id: 'history', label: 'History', icon: Clock },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); resetComposer(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${tab === id ? 'bg-obsidian-900 text-white shadow-md' : 'text-obsidian-500 hover:text-obsidian-800'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════ COMPOSE TAB ═══════════ */}
      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: Composer ─────────────────────────── */}
          <div className="lg:col-span-3 card-luxury p-6 flex flex-col gap-5">

            {sent ? (
              /* SUCCESS state */
              <div className="flex flex-col items-center gap-5 py-6 animate-scale-in">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-4xl">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-obsidian-900 font-black text-2xl mb-1">Campaign Sent! 🎉</p>
                  <p className="text-obsidian-500 text-sm">
                    Your message was delivered to{' '}
                    <span className="font-bold text-obsidian-800">{sent.count} customers</span>
                  </p>
                </div>
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={resetComposer}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-obsidian-900"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #B89020)' }}
                  >
                    New Campaign
                  </button>
                  <button
                    onClick={() => setTab('history')}
                    className="flex-1 py-3 rounded-xl border border-gold-300 text-obsidian-700 text-sm font-semibold hover:bg-gold-50 transition-all"
                  >
                    View History
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="label-gold mb-3">Message Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(TYPE_CONFIG) as [CampaignType, typeof cfg][]).map(([key, c]) => {
                      const Icon = c.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setType(key)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all
                            ${type === key
                              ? 'border-obsidian-900 bg-obsidian-900 text-white'
                              : 'border-gold-200 bg-white text-obsidian-700 hover:border-gold-400'}`}
                        >
                          <Icon className="w-4 h-4" style={{ color: type === key ? '#D4AF37' : c.color }} />
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="campaign-title" className="label-gold mb-2 block">Title</label>
                  <input
                    id="campaign-title"
                    type="text"
                    maxLength={80}
                    placeholder={`e.g. Weekend Special Offer`}
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setError(null); }}
                    className="w-full border border-gold-200 rounded-xl px-4 py-3 text-obsidian-900 text-sm font-semibold focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200 bg-white"
                  />
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="campaign-message" className="label-gold">Message</label>
                    <span className={`text-xs font-medium ${message.length > MAX_MSG_LENGTH * 0.9 ? 'text-red-400' : 'text-obsidian-400'}`}>
                      {message.length}/{MAX_MSG_LENGTH}
                    </span>
                  </div>
                  <textarea
                    id="campaign-message"
                    rows={4}
                    maxLength={MAX_MSG_LENGTH}
                    placeholder={cfg.placeholder}
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); setError(null); }}
                    className="w-full border border-gold-200 rounded-xl px-4 py-3 text-obsidian-700 text-sm focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200 bg-white resize-none leading-relaxed"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <span className="text-red-500 text-sm">⚠ {error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setPreview(!preview)}
                    disabled={!title || !message}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gold-300 text-obsidian-700 text-sm font-semibold hover:bg-gold-50 transition-all disabled:opacity-40"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending || !title.trim() || !message.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-obsidian-900 text-sm font-bold transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #B89020)' }}
                  >
                    {sending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-obsidian-900/30 border-t-obsidian-900 rounded-full animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send to {customerCount} Customers
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Right: Preview + Tips ───────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Live preview */}
            {preview && title && message ? (
              <div className="card-luxury p-5" style={{ background: cfg.bg, borderColor: `${cfg.color}44` }}>
                <p className="label-gold mb-3" style={{ color: cfg.color }}>Message Preview</p>

                {/* Phone mockup */}
                <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-obsidian-100">
                  {/* Phone notification bar */}
                  <div className="bg-obsidian-900 px-4 py-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-obsidian-900"
                      style={{ background: 'linear-gradient(135deg, #D4AF37, #8B6914)' }}>
                      R
                    </div>
                    <span className="text-white text-xs font-semibold">RIADH CARD</span>
                    <span className="text-white/40 text-xs ml-auto">now</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <TypeIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
                      <div>
                        <p className="text-obsidian-900 font-bold text-sm">{title}</p>
                        <p className="text-obsidian-600 text-xs mt-1 leading-relaxed">{message}</p>
                        <p className="text-obsidian-300 text-[10px] mt-2">from {merchantName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-luxury p-5">
                <p className="label-gold mb-3">Audience</p>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-obsidian-50 border border-obsidian-100">
                  <Users className="w-6 h-6 text-gold-600" />
                  <div>
                    <p className="text-obsidian-900 font-bold text-xl">{customerCount}</p>
                    <p className="text-obsidian-400 text-xs">registered customers</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="card-luxury p-5" style={{ background: 'linear-gradient(135deg, #FFFDF0, #FDF9D7)', borderColor: 'rgba(212,175,55,0.30)' }}>
              <p className="label-gold mb-3">💡 Tips for Better Campaigns</p>
              <ul className="flex flex-col gap-2 text-obsidian-600 text-xs leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-gold-500 mt-0.5">✦</span>
                  Keep messages under 160 characters for SMS compatibility
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-500 mt-0.5">✦</span>
                  Include a clear call-to-action (e.g., "Visit us today!")
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-500 mt-0.5">✦</span>
                  Mention the reward or discount clearly upfront
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-500 mt-0.5">✦</span>
                  Send promotions on Thursdays and Fridays for best engagement
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ HISTORY TAB ═══════════ */}
      {tab === 'history' && (
        <div className="card-luxury p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="label-gold">Campaign History</p>
            <button
              onClick={loadHistory}
              className="text-xs text-gold-600 hover:text-gold-700 font-semibold transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-gold-50 animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-obsidian-300">
              <Megaphone className="w-12 h-12 opacity-30" />
              <p className="text-sm">No campaigns sent yet.</p>
              <button
                onClick={() => setTab('compose')}
                className="text-gold-600 hover:text-gold-700 text-sm font-semibold transition-colors"
              >
                Send your first campaign →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((c) => {
                const cfg = TYPE_CONFIG[c.type as CampaignType] ?? TYPE_CONFIG.ANNOUNCEMENT;
                const Icon = cfg.icon;
                return (
                  <div key={c.id} className="flex items-start gap-4 p-4 rounded-2xl border border-obsidian-100 hover:border-gold-200 transition-colors bg-white">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-obsidian-900 font-semibold text-sm truncate">{c.title}</p>
                        <span
                          className="flex-shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-obsidian-500 text-xs mt-1 line-clamp-2">{c.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-obsidian-300 text-[10px]">{formatDate(c.sent_at)}</span>
                        <span className="text-obsidian-300 text-[10px]">•</span>
                        <span className="text-obsidian-500 text-[10px] flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {c.recipient_count} recipients
                        </span>
                        <span className="text-emerald-500 text-[10px] flex items-center gap-1 ml-auto">
                          <CheckCircle className="w-3 h-3" />
                          {c.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

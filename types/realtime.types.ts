/**
 * @file realtime.types.ts
 * @description Strict typed envelopes for all Supabase Realtime events
 *              broadcast on the merchant:{slug}:events channel.
 *
 *              The dashboard useRealtimeChannel() hook receives payloads
 *              that conform to these interfaces — no `any` anywhere.
 */

import type { NfcEventRow, LoyaltyCardRow, LoyaltyTier } from './database.types';
import type { CustomerSearchResult } from './entities';

// ─────────────────────────────────────────────────────────────────────────────
// Realtime event categories
// ─────────────────────────────────────────────────────────────────────────────

export type RealtimeEventType =
  | 'NFC_TAP'          // Customer NFC tap detected — opens cashier modal
  | 'POINTS_AWARDED'   // award_points() RPC succeeded — card updated
  | 'POINTS_REDEEMED'  // redeem_points() RPC succeeded
  | 'CARD_UPDATED'     // Any loyalty_cards row change
  | 'PRESENCE_JOIN'    // A cashier session joined the channel
  | 'PRESENCE_LEAVE';  // A cashier session left the channel

// ─────────────────────────────────────────────────────────────────────────────
// Base envelope — wraps every broadcast payload
// ─────────────────────────────────────────────────────────────────────────────

export interface RealtimeEnvelope<T extends RealtimeEventType, P> {
  event: T;
  merchantId: string;
  payload: P;
  timestamp: string; // ISO 8601
}

// ─────────────────────────────────────────────────────────────────────────────
// NFC_TAP  (postgres_changes on nfc_events INSERT)
// ─────────────────────────────────────────────────────────────────────────────

export interface NfcTapPayload {
  nfcEventId: string;
  merchantId: string;
  customerId: string | null;
  customer: CustomerSearchResult | null;
  rawPayload: Record<string, unknown>;
  createdAt: string;
}

export type NfcTapEvent = RealtimeEnvelope<'NFC_TAP', NfcTapPayload>;

// ─────────────────────────────────────────────────────────────────────────────
// POINTS_AWARDED  (broadcast after award_points() RPC)
// ─────────────────────────────────────────────────────────────────────────────

export interface PointsAwardedPayload {
  transactionId: string;
  cardId: string;
  customerId: string;
  customerName: string;
  pointsAdded: number;
  totalPoints: number;
  lifetimePoints: number;
  previousTier: LoyaltyTier;
  currentTier: LoyaltyTier;
  tierChanged: boolean;
  amountSpentTnd: number;
  awardedAt: string;
}

export type PointsAwardedEvent = RealtimeEnvelope<'POINTS_AWARDED', PointsAwardedPayload>;

// ─────────────────────────────────────────────────────────────────────────────
// POINTS_REDEEMED
// ─────────────────────────────────────────────────────────────────────────────

export interface PointsRedeemedPayload {
  transactionId: string;
  cardId: string;
  customerId: string;
  customerName: string;
  pointsRedeemed: number;
  remainingPoints: number;
  currentTier: LoyaltyTier;
  redeemedAt: string;
}

export type PointsRedeemedEvent = RealtimeEnvelope<'POINTS_REDEEMED', PointsRedeemedPayload>;

// ─────────────────────────────────────────────────────────────────────────────
// CARD_UPDATED  (postgres_changes on loyalty_cards UPDATE)
// ─────────────────────────────────────────────────────────────────────────────

export interface CardUpdatedPayload {
  old: Pick<LoyaltyCardRow, 'id' | 'total_points' | 'lifetime_points' | 'current_tier'>;
  new: Pick<LoyaltyCardRow, 'id' | 'total_points' | 'lifetime_points' | 'current_tier'>;
}

export type CardUpdatedEvent = RealtimeEnvelope<'CARD_UPDATED', CardUpdatedPayload>;

// ─────────────────────────────────────────────────────────────────────────────
// PRESENCE events
// ─────────────────────────────────────────────────────────────────────────────

export interface PresencePayload {
  sessionId: string;
  cashierName: string;
  joinedAt: string;
}

export type PresenceJoinEvent  = RealtimeEnvelope<'PRESENCE_JOIN',  PresencePayload>;
export type PresenceLeaveEvent = RealtimeEnvelope<'PRESENCE_LEAVE', PresencePayload>;

// ─────────────────────────────────────────────────────────────────────────────
// Discriminated union — used in the channel event handler switch statement
// ─────────────────────────────────────────────────────────────────────────────

export type MerchantRealtimeEvent =
  | NfcTapEvent
  | PointsAwardedEvent
  | PointsRedeemedEvent
  | CardUpdatedEvent
  | PresenceJoinEvent
  | PresenceLeaveEvent;

// ─────────────────────────────────────────────────────────────────────────────
// postgres_changes raw payload shape (Supabase SDK)
// ─────────────────────────────────────────────────────────────────────────────

export interface PostgresChangesPayload<T extends Record<string, unknown>> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Partial<T>;
  old: Partial<T>;
  errors: string[] | null;
}

export type NfcEventChanges   = PostgresChangesPayload<NfcEventRow>;
export type LoyaltyCardChanges = PostgresChangesPayload<LoyaltyCardRow>;

/**
 * @file entities.ts
 * @description Rich application-level domain models.
 *              Built on top of raw DB rows — adds computed fields,
 *              display helpers, and UI-ready shapes.
 */

import type {
  MerchantRow,
  CustomerRow,
  LoyaltyCardRow,
  TransactionRow,
  NfcEventRow,
  LoyaltyTier,
  MerchantDashboardSummaryRow,
} from './database.types';

// ─────────────────────────────────────────────────────────────────────────────
// Merchant
// ─────────────────────────────────────────────────────────────────────────────

export interface Merchant extends MerchantRow {
  /** Resolved logo URL with fallback */
  displayLogoUrl: string;
  /** Tier thresholds indexed by tier name */
  tierThresholds: Record<LoyaltyTier, number>;
}

export interface MerchantPublicProfile
  extends Pick<MerchantRow, 'id' | 'name' | 'slug' | 'logo_url' | 'cover_image_url' | 'description' | 'address' | 'welcome_message'> {
  /** Tier configuration surfaced to the PWA */
  tierThresholds: Record<LoyaltyTier, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer
// ─────────────────────────────────────────────────────────────────────────────

export interface Customer extends CustomerRow {
  /** Display-friendly initials for avatar fallback */
  initials: string;
}

export type CustomerSearchResult = Pick<
  CustomerRow,
  'id' | 'full_name' | 'phone' | 'email' | 'avatar_url'
>;

// ─────────────────────────────────────────────────────────────────────────────
// Loyalty Card
// ─────────────────────────────────────────────────────────────────────────────

export interface LoyaltyCard extends LoyaltyCardRow {
  /** Customer profile joined in */
  customer: CustomerSearchResult;
  /** Merchant minimal info joined in */
  merchant: Pick<MerchantRow, 'id' | 'name' | 'slug' | 'logo_url' | 'tier_silver_min' | 'tier_gold_min' | 'tier_platinum_min'>;
  /** Points required to reach next tier (null if PLATINUM) */
  pointsToNextTier: number | null;
  /** Progress percentage within current tier (0–100) */
  tierProgressPercent: number;
}

export interface LoyaltyCardSummary
  extends Pick<
    LoyaltyCardRow,
    'id' | 'total_points' | 'lifetime_points' | 'current_tier' | 'is_blocked'
  > {
  merchant: Pick<MerchantRow, 'id' | 'name' | 'slug' | 'logo_url'>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction
// ─────────────────────────────────────────────────────────────────────────────

export interface Transaction extends TransactionRow {
  /** Human-readable type for UI rendering */
  displayType: 'EARN' | 'REDEEM';
  /** Signed delta used in charts (+N or -N) */
  pointsDelta: number;
}

export type TransactionListItem = Pick<
  TransactionRow,
  | 'id'
  | 'points_added'
  | 'points_redeemed'
  | 'amount_spent'
  | 'source'
  | 'note'
  | 'created_at'
>;

// ─────────────────────────────────────────────────────────────────────────────
// NFC Event
// ─────────────────────────────────────────────────────────────────────────────

export interface NfcEvent extends NfcEventRow {
  /** Customer profile if already resolved */
  customer?: CustomerSearchResult | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardSummary extends MerchantDashboardSummaryRow {}

export interface TierDistribution {
  tier: LoyaltyTier;
  count: number;
  color: string;
  gradientClass: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cashier Modal state (used exclusively in the dashboard UI)
// ─────────────────────────────────────────────────────────────────────────────

export type CashierModalStep = 'IDLE' | 'AWAITING_AMOUNT' | 'CONFIRMING' | 'SUCCESS' | 'ERROR';

export interface CashierSessionState {
  step: CashierModalStep;
  nfcEventId: string | null;
  customer: CustomerSearchResult | null;
  card: Pick<LoyaltyCardRow, 'id' | 'total_points' | 'current_tier'> | null;
  billAmountTnd: string; // string to support controlled <input>
  projectedPoints: number;
  errorMessage: string | null;
}

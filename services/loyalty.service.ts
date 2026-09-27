/**
 * @file loyalty.service.ts
 * @description Atomic loyalty operations — wraps the award_points()
 *              and redeem_points() Supabase RPCs.
 *              Safe to call from Server Actions or API Route Handlers.
 */

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import type {
  AwardPointsArgs,
  AwardPointsResult,
  RedeemPointsArgs,
  RedeemPointsResult,
  LoyaltyCardRow,
  TransactionRow,
} from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// RPC wrappers
// ─────────────────────────────────────────────────────────────────────────────

export async function awardPoints(
  args: AwardPointsArgs,
): Promise<AwardPointsResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc('award_points', {
    p_merchant_id:  args.p_merchant_id,
    p_customer_id:  args.p_customer_id,
    p_amount_tnd:   args.p_amount_tnd,
    p_nfc_event_id: args.p_nfc_event_id ?? null,
    p_source:       args.p_source       ?? 'CASHIER',
    p_note:         args.p_note         ?? null,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return data as AwardPointsResult;
}

export async function redeemPoints(
  args: RedeemPointsArgs,
): Promise<RedeemPointsResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc('redeem_points', {
    p_merchant_id: args.p_merchant_id,
    p_customer_id: args.p_customer_id,
    p_points:      args.p_points,
    p_note:        args.p_note ?? null,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return data as RedeemPointsResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Loyalty card queries
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch a customer's loyalty card for a specific merchant. */
export async function getLoyaltyCard(
  customerId: string,
  merchantId: string,
): Promise<LoyaltyCardRow | null> {
  const admin = await createSupabaseAdminClient();

  const { data, error } = await admin
    .from('loyalty_cards')
    .select('*')
    .eq('customer_id', customerId)
    .eq('merchant_id', merchantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // row not found — new customer
    console.error('[getLoyaltyCard]', error.message);
    return null;
  }

  return data;
}

/** Fetch all loyalty cards for a merchant (for the dashboard table). */
export async function getMerchantLoyaltyCards(
  merchantId: string,
  limit = 50,
  offset = 0,
): Promise<LoyaltyCardRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('loyalty_cards')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[getMerchantLoyaltyCards]', error.message);
    return [];
  }

  return data ?? [];
}

/** Fetch recent transactions for a loyalty card. */
export async function getCardTransactions(
  loyaltyCardId: string,
  limit = 20,
): Promise<TransactionRow[]> {
  const admin = await createSupabaseAdminClient();

  const { data, error } = await admin
    .from('transactions')
    .select('*')
    .eq('loyalty_card_id', loyaltyCardId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getCardTransactions]', error.message);
    return [];
  }

  return data ?? [];
}

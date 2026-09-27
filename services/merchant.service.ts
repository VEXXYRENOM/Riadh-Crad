/**
 * @file merchant.service.ts
 * @description Server-side merchant data access layer.
 *              All functions run in RSC / Server Action context.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { MerchantRow, MerchantDashboardSummaryRow } from '@/types';

/** Fetch full merchant row by slug — used in the PWA /b/[slug] page. */
export async function getMerchantBySlug(
  slug: string,
): Promise<MerchantRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[getMerchantBySlug]', error.message);
    return null;
  }

  return data;
}

/** Fetch merchant row by owner UID — used in the dashboard. */
export async function getMerchantByOwnerId(
  ownerId: string,
): Promise<MerchantRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('owner_id', ownerId)
    .single();

  if (error) {
    console.error('[getMerchantByOwnerId]', error.message);
    return null;
  }

  return data;
}

/** Fetch dashboard KPI summary directly from tables. */
export async function getMerchantDashboardSummary(merchantId: string): Promise<MerchantDashboardSummaryRow | null> {
  const supabase = await createSupabaseServerClient();

  // 0. Get merchant info
  const { data: merchant } = await supabase
    .from('merchants')
    .select('name, slug')
    .eq('id', merchantId)
    .single();
    
  if (!merchant) return null;

  // 1. Total members
  const { count: totalCustomers } = await supabase
    .from('loyalty_cards')
    .select('*', { count: 'exact', head: true })
    .eq('merchant_id', merchantId);

  // 2. Points & Tiers
  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('lifetime_points, total_points, current_tier')
    .eq('merchant_id', merchantId);
    
  let totalPointsIssued = 0;
  let activePointsBalance = 0;
  
  let platinumMembers = 0;
  let goldMembers = 0;
  let silverMembers = 0;
  let bronzeMembers = 0;
  
  if (cards) {
    cards.forEach(card => {
      totalPointsIssued += card.lifetime_points;
      activePointsBalance += card.total_points;
      
      if (card.current_tier === 'PLATINUM') platinumMembers++;
      else if (card.current_tier === 'GOLD') goldMembers++;
      else if (card.current_tier === 'SILVER') silverMembers++;
      else bronzeMembers++;
    });
  }

  // 3. Transactions today/30d
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: txs } = await supabase
    .from('transactions')
    .select('points_added, amount_spent')
    .eq('merchant_id', merchantId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  let revenue30d = 0;
  let pointsIssued30d = 0;
  
  if (txs) {
    txs.forEach(tx => {
      revenue30d += (tx.amount_spent || 0);
      pointsIssued30d += (tx.points_added || 0);
    });
  }

  return {
    merchant_id: merchantId,
    merchant_name: merchant.name,
    slug: merchant.slug,
    total_customers: totalCustomers || 0,
    total_points_outstanding: activePointsBalance,
    total_points_ever_issued: totalPointsIssued,
    platinum_members: platinumMembers,
    gold_members: goldMembers,
    silver_members: silverMembers,
    bronze_members: bronzeMembers,
    revenue_30d: revenue30d,
    points_issued_30d: pointsIssued30d,
  };
}

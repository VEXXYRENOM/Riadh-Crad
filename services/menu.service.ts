/** Data access helpers for the customer menu and merchant menu management. */

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { MenuItemRow } from '@/types';

export async function getAvailableMenuItems(merchantId: string): Promise<MenuItemRow[]> {
  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('is_available', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getAvailableMenuItems]', error.message);
    return [];
  }
  return data ?? [];
}

export async function getMerchantMenuItems(merchantId: string): Promise<MenuItemRow[]> {
  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getMerchantMenuItems]', error.message);
    return [];
  }
  return data ?? [];
}

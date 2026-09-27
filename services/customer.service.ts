/**
 * @file customer.service.ts
 * @description Customer lookup and creation utilities.
 *              Used by the cashier modal and PWA onboarding flow.
 */

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import type { CustomerRow, CustomerInsert, CustomerSearchResult } from '@/types';

/** Look up a customer by phone number (exact match). */
export async function getCustomerByPhone(
  phone: string,
): Promise<CustomerRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[getCustomerByPhone]', error.message);
    return null;
  }

  return data;
}

/** Look up a customer by their ID (used by cookie session in PWA). */
export async function getCustomerById(
  id: string,
): Promise<CustomerRow | null> {
  const admin = await createSupabaseAdminClient();

  const { data, error } = await admin
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[getCustomerById]', error.message);
    return null;
  }

  return data;
}

/** Fuzzy name search for the cashier lookup typeahead. */
export async function searchCustomersByName(
  merchantId: string,
  query: string,
  limit = 8,
): Promise<CustomerSearchResult[]> {
  const supabase = await createSupabaseServerClient();

  // Join through loyalty_cards to restrict results to THIS merchant's customers
  const { data, error } = await supabase
    .from('customers')
    .select(`
      id,
      full_name,
      phone,
      email,
      avatar_url,
      loyalty_cards!inner(merchant_id)
    `)
    .eq('loyalty_cards.merchant_id', merchantId)
    .ilike('full_name', `%${query}%`)
    .limit(limit);

  if (error) {
    console.error('[searchCustomersByName]', error.message);
    return [];
  }

  return (data ?? []).map(({ loyalty_cards: _lc, ...rest }) => rest);
}

/** Create a new customer record (used in the PWA onboarding). */
export async function createCustomer(
  payload: CustomerInsert,
): Promise<CustomerRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('customers')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[createCustomer]', error.message);
    return null;
  }

  return data;
}

/** Fetch customer by auth UID (for the PWA profile page). */
export async function getCustomerByAuthUid(
  authUid: string,
): Promise<CustomerRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_uid', authUid)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[getCustomerByAuthUid]', error.message);
    return null;
  }

  return data;
}

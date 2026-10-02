/**
 * @file database.types.ts
 * @description Raw Supabase schema types — auto-generated shape.
 *              These are the 1-to-1 mirrors of the PostgreSQL tables.
 *              Do NOT add business logic here; use /types/entities.ts instead.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type TransactionSource =
  | 'CASHIER'
  | 'NFC'
  | 'MANUAL'
  | 'REDEMPTION'
  | 'ADJUSTMENT';

export type NfcEventStatus = 'PENDING' | 'RESOLVED' | 'EXPIRED' | 'FAILED';

// ─────────────────────────────────────────────────────────────────────────────
// Table Row Types  (exact column names from migration 001)
// ─────────────────────────────────────────────────────────────────────────────

export type MerchantRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  /** Wide storefront image shown on the public loyalty card. */
  cover_image_url: string | null;
  /** Merchant-controlled public profile details. */
  description: string | null;
  phone: string | null;
  address: string | null;
  welcome_message: string | null;
  referral_reward_points: number;
  latitude: number | null;
  longitude: number | null;
  proximity_enabled: boolean;
  proximity_radius_m: number;
  points_per_dinar: number;
  tier_bronze_min: number;
  tier_silver_min: number;
  tier_gold_min: number;
  tier_platinum_min: number;
  created_at: string;
  updated_at: string;
};

export type CustomerRow = {
  id: string;
  auth_uid: string | null;
  phone: string;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type LoyaltyCardRow = {
  id: string;
  customer_id: string;
  merchant_id: string;
  total_points: number;
  lifetime_points: number;
  current_tier: LoyaltyTier;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
};

export type TransactionRow = {
  id: string;
  loyalty_card_id: string;
  merchant_id: string;
  customer_id: string;
  points_added: number;
  points_redeemed: number;
  amount_spent: number | null;
  note: string | null;
  source: TransactionSource;
  created_at: string;
};

export type NfcEventRow = {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  raw_payload: Record<string, unknown>;
  status: NfcEventStatus;
  resolved_at: string | null;
  created_at: string;
};

export type MerchantReviewRow = {
  id: string;
  merchant_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  /** Privacy-safe name, e.g. "Amine B." — never the full customer name. */
  display_name: string;
  created_at: string;
  updated_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Menu
// ─────────────────────────────────────────────────────────────────────────────

/** A merchant-controlled product displayed in the customer rewards menu. */
export type MenuItemRow = {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  ingredients: string[];
  price_tnd: number;
  reward_points: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Insert / Update payloads (Supabase postgrest types)
// ─────────────────────────────────────────────────────────────────────────────

export type MerchantInsert = Omit<MerchantRow, 'id' | 'created_at' | 'updated_at'>;
export type MerchantUpdate = Partial<MerchantInsert>;

export type CustomerInsert = Omit<CustomerRow, 'id' | 'created_at' | 'updated_at'>;
export type CustomerUpdate = Partial<CustomerInsert>;

export type NfcEventInsert = Pick<NfcEventRow, 'merchant_id' | 'raw_payload'> &
  Partial<Pick<NfcEventRow, 'customer_id'>>;

export type MenuItemInsert = Omit<MenuItemRow, 'id' | 'created_at' | 'updated_at'>;
export type MenuItemUpdate = Partial<Omit<MenuItemInsert, 'merchant_id'>>;

// ─────────────────────────────────────────────────────────────────────────────
// Supabase DB generic (used to type the createClient call)
// ─────────────────────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      merchants: {
        Row: MerchantRow;
        Insert: MerchantInsert;
        Update: MerchantUpdate;
        Relationships: [
          {
            foreignKeyName: 'merchants_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      customers: {
        Row: CustomerRow;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
        Relationships: [];
      };
      loyalty_cards: {
        Row: LoyaltyCardRow;
        Insert: Omit<LoyaltyCardRow, 'id' | 'created_at' | 'updated_at' | 'current_tier'>;
        Update: Partial<Pick<LoyaltyCardRow, 'is_blocked'>>;
        Relationships: [];
      };
      transactions: {
        Row: TransactionRow;
        Insert: { [key: string]: never };
        Update: { [key: string]: never };
        Relationships: [];
      };
      nfc_events: {
        Row: NfcEventRow;
        Insert: NfcEventInsert;
        Update: Partial<Pick<NfcEventRow, 'status' | 'resolved_at'>>;
        Relationships: [];
      };
      merchant_reviews: {
        Row: MerchantReviewRow;
        Insert: Omit<MerchantReviewRow, 'id' | 'created_at' | 'updated_at' | 'display_name'>;
        Update: Partial<Pick<MerchantReviewRow, 'rating' | 'comment'>>;
        Relationships: [];
      };
      menu_items: {
        Row: MenuItemRow;
        Insert: MenuItemInsert;
        Update: MenuItemUpdate;
        Relationships: [];
      };
    };
    Views: {
      merchant_dashboard_summary: {
        Row: MerchantDashboardSummaryRow;
        Relationships: [];
      };
    };
    Functions: {
      award_points: {
        Args: AwardPointsArgs;
        Returns: AwardPointsResult;
      };
      redeem_points: {
        Args: RedeemPointsArgs;
        Returns: RedeemPointsResult;
      };
      redeem_menu_item: {
        Args: RedeemMenuItemArgs;
        Returns: RedeemMenuItemResult;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// View row types
// ─────────────────────────────────────────────────────────────────────────────

export type MerchantDashboardSummaryRow = {
  merchant_id: string;
  merchant_name: string;
  slug: string;
  total_customers: number;
  total_points_outstanding: number;
  total_points_ever_issued: number;
  platinum_members: number;
  gold_members: number;
  silver_members: number;
  bronze_members: number;
  revenue_30d: number;
  points_issued_30d: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// RPC argument / return types
// ─────────────────────────────────────────────────────────────────────────────

export type AwardPointsArgs = {
  p_merchant_id: string;
  p_customer_id: string;
  p_amount_tnd: number;
  p_nfc_event_id?: string | null;
  p_source?: TransactionSource;
  p_note?: string | null;
};

export type AwardPointsResult = {
  success: boolean;
  transaction_id?: string;
  card_id?: string;
  points_added?: number;
  total_points?: number;
  lifetime_points?: number;
  current_tier?: LoyaltyTier;
  merchant_name?: string;
  awarded_at?: string;
  error_code?: string;
  message?: string;
};

export type RedeemPointsArgs = {
  p_merchant_id: string;
  p_customer_id: string;
  p_points: number;
  p_note?: string | null;
};

export type RedeemPointsResult = {
  success: boolean;
  transaction_id?: string;
  card_id?: string;
  points_redeemed?: number;
  total_points?: number;
  current_tier?: LoyaltyTier;
  merchant_name?: string;
  redeemed_at?: string;
  error_code?: string;
  message?: string;
};

export type RedeemMenuItemArgs = {
  p_merchant_id: string;
  p_customer_id: string;
  p_menu_item_id: string;
};

export type RedeemMenuItemResult = RedeemPointsResult & {
  menu_item_name?: string;
};

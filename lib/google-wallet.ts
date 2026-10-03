import { createSign } from 'crypto';
import { readFile } from 'fs/promises';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1';
const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type WalletCardData = {
  merchant: { id: string; name: string; slug: string; logo_url: string | null; latitude: number | null; longitude: number | null; proximity_enabled: boolean };
  customer: { id: string; full_name: string | null };
  card: { id: string; total_points: number; current_tier: string };
};

class GoogleWalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleWalletError';
  }
}

let accessTokenCache: { value: string; expiresAt: number } | null = null;
const MAX_WALLET_SYNC_CONCURRENCY = 4;
let activeWalletSyncs = 0;
const queuedWalletSyncs: Array<{ key: string; work: () => Promise<void>; resolve: () => void }> = [];
const walletSyncByCard = new Map<string, Promise<void>>();

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function safeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 80);
}

function signJwt(claims: object, privateKey: string) {
  const encodedHeader = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const encodedClaims = base64Url(JSON.stringify(claims));
  const signer = createSign('RSA-SHA256');
  signer.update(`${encodedHeader}.${encodedClaims}`);
  signer.end();
  return `${encodedHeader}.${encodedClaims}.${signer.sign(privateKey).toString('base64url')}`;
}

function pause(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Google calls have bounded time and retry only transient errors. */
async function googleFetch(url: string, init: RequestInit) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.status !== 429 && response.status < 500) return response;
      lastError = new Error(`Google Wallet returned ${response.status}`);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
    if (attempt < 2) await pause(250 * (2 ** attempt));
  }
  throw lastError;
}

function normalizePrivateKey(key: string) {
  const trimmed = key.trim();
  return trimmed.includes('\\n') ? trimmed.replace(/\\n/g, '\n') : trimmed;
}

/** Parses service-account JSON from env (handles common Vercel paste mistakes). */
function parseServiceAccountRaw(raw: string): GoogleServiceAccount | null {
  let text = raw.trim();
  if (!text) return null;

  if (
    (text.startsWith('"') && text.endsWith('"'))
    || (text.startsWith("'") && text.endsWith("'"))
  ) {
    try {
      const unwrapped = JSON.parse(text) as unknown;
      if (typeof unwrapped === 'string') text = unwrapped.trim();
      else text = text.slice(1, -1);
    } catch {
      text = text.slice(1, -1);
    }
  }

  let parsed: Partial<GoogleServiceAccount>;
  try {
    parsed = JSON.parse(text) as Partial<GoogleServiceAccount>;
  } catch {
    try {
      parsed = JSON.parse(Buffer.from(text, 'base64').toString('utf8')) as Partial<GoogleServiceAccount>;
    } catch {
      return null;
    }
  }

  if (!parsed.client_email || !parsed.private_key) return null;
  return {
    client_email: parsed.client_email,
    private_key: normalizePrivateKey(parsed.private_key),
    token_uri: parsed.token_uri,
  };
}

async function readServiceAccountFromEnv(): Promise<string | null> {
  const jsonInline = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonInline) return jsonInline;

  const b64 = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_B64?.trim();
  if (b64) {
    try {
      return Buffer.from(b64, 'base64').toString('utf8');
    } catch {
      return null;
    }
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim().replace(/^"|"$/g, '');
  if (!credPath) return null;
  try {
    return await readFile(credPath, 'utf8');
  } catch {
    return null;
  }
}

async function credentials(): Promise<GoogleServiceAccount | null> {
  try {
    const raw = await readServiceAccountFromEnv();
    if (!raw) return null;
    return parseServiceAccountRaw(raw);
  } catch {
    // Do not log credential details from a public customer route.
    return null;
  }
}

/** Safe deployment check — never returns secrets. */
export async function getGoogleWalletEnvStatus() {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID?.trim() ?? '';
  const account = await credentials();
  const hasJson = Boolean(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON?.trim());
  const hasB64 = Boolean(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_B64?.trim());
  const hasFilePath = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim());
  return {
    configured: Boolean(issuerId && account),
    hasIssuerId: issuerId.length > 0,
    issuerIdValid: /^\d{10,}$/.test(issuerId),
    hasCredentials: Boolean(account),
    credentialSources: { json: hasJson, base64: hasB64, filePath: hasFilePath },
    hint: !issuerId
      ? 'Set GOOGLE_WALLET_ISSUER_ID in Vercel (Production), then redeploy.'
      : !account
        ? hasFilePath && !hasJson && !hasB64
          ? 'GOOGLE_APPLICATION_CREDENTIALS does not work on Vercel. Use GOOGLE_WALLET_SERVICE_ACCOUNT_JSON or GOOGLE_WALLET_SERVICE_ACCOUNT_B64.'
          : 'Service account JSON is missing or invalid. Paste minified JSON or base64 in Vercel, then redeploy.'
        : null,
  };
}

function googleApiError(status: number) {
  if (status === 401 || status === 403) {
    return new GoogleWalletError(
      'Google Wallet rejected the service account. Enable the Google Wallet API and add this service account as a Developer in Google Wallet Console.',
    );
  }
  return new GoogleWalletError('Google Wallet could not prepare the card. Please try again shortly.');
}

async function getAccessToken(account: GoogleServiceAccount) {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60_000) {
    return accessTokenCache.value;
  }

  const tokenUrl = account.token_uri ?? 'https://oauth2.googleapis.com/token';
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt({
    iss: account.client_email,
    scope: WALLET_SCOPE,
    aud: tokenUrl,
    iat: now,
    exp: now + 3600,
  }, account.private_key);

  let response: Response;
  try {
    response = await googleFetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
      cache: 'no-store',
    });
  } catch {
    throw new GoogleWalletError('Could not reach Google Wallet. Check the server internet connection and try again.');
  }

  if (!response.ok) throw googleApiError(response.status);
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new GoogleWalletError('Google Wallet authentication did not return an access token.');

  accessTokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max(60, data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

async function walletRequest(
  account: GoogleServiceAccount,
  path: string,
  init: RequestInit = {},
) {
  const token = await getAccessToken(account);
  let response: Response;
  try {
    response = await googleFetch(`${WALLET_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new GoogleWalletError('Could not reach Google Wallet. Check the server internet connection and try again.');
  }
  return response;
}

async function ensureWalletResource(
  account: GoogleServiceAccount,
  resourcePath: string,
  collectionPath: string,
  resource: object,
  updateWhenPresent: boolean,
) {
  const current = await walletRequest(account, resourcePath);
  if (current.status === 404) {
    const created = await walletRequest(account, collectionPath, {
      method: 'POST',
      body: JSON.stringify(resource),
    });
    // A simultaneous request may have created the same resource. It is ready to use.
    if (created.ok || created.status === 409) return;
    throw googleApiError(created.status);
  }
  if (!current.ok) throw googleApiError(current.status);
  if (!updateWhenPresent) return;

  const updated = await walletRequest(account, resourcePath, {
    method: 'PATCH',
    body: JSON.stringify(resource),
  });
  if (!updated.ok) throw googleApiError(updated.status);
}

/** Maps tier name to a rich gold/silver/bronze/platinum hex colour for the card background. */
function tierHexColor(tier: string): string {
  switch (tier.toUpperCase()) {
    case 'PLATINUM': return '#1a1a2e'; // deep midnight
    case 'GOLD':     return '#1C1709'; // deep gold-black
    case 'SILVER':   return '#1a1a1a'; // cool dark
    default:         return '#1C1917'; // warm obsidian (BRONZE)
  }
}

/** Returns a premium abstract banner image URL based on the tier for the Wallet Card header. */
function tierHeroImage(tier: string): string {
  switch (tier.toUpperCase()) {
    case 'PLATINUM': // Dark blue/diamond abstract
      return 'https://images.unsplash.com/photo-1601314167099-232775bbabdf?q=80&w=1032&auto=format&fit=crop';
    case 'GOLD': // Gold liquid abstract
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1032&auto=format&fit=crop';
    case 'SILVER': // Silver/chrome fluid
      return 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?q=80&w=1032&auto=format&fit=crop';
    default: // BRONZE - Warm copper/bronze geometric
      return 'https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=1032&auto=format&fit=crop';
  }
}

function classResource(classId: string, merchant: WalletCardData['merchant']) {

  // Google Wallet requires a programLogo over HTTPS — use merchant logo or fall back to RIADH CARD default.
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').startsWith('https://')
    ? process.env.NEXT_PUBLIC_APP_URL!
    : 'https://riadh-card.vercel.app';
  const logoUri = merchant.logo_url?.startsWith('https://')
    ? merchant.logo_url
    : `${appUrl}/logo.png`;

  const locationData = merchant.proximity_enabled && merchant.latitude !== null && merchant.longitude !== null
    ? { locations: [{ latitude: merchant.latitude, longitude: merchant.longitude }] }
    : {};

  return {
    id: classId,
    issuerName: 'RIADH CARD',
    programName: merchant.name,
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: '#1C1917',
    heroImage: {
      sourceUri: { uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1032&auto=format&fit=crop' },
      contentDescription: {
        defaultValue: { language: 'en', value: 'Premium Background' },
      },
    },
    programLogo: {
      sourceUri: { uri: logoUri },
      contentDescription: {
        defaultValue: { language: 'en', value: `${merchant.name} loyalty card` },
      },
    },
    // Secondary logo — RIADH CARD watermark shown on the back
    secondaryProgramLogo: {
      sourceUri: { uri: `${appUrl}/logo.png` },
      contentDescription: {
        defaultValue: { language: 'en', value: 'RIADH CARD' },
      },
    },
    // Localised labels
    localizedIssuerName: {
      defaultValue: { language: 'en', value: 'RIADH CARD' },
      translatedValues: [{ language: 'fr', value: 'RIADH CARD' }, { language: 'ar', value: 'رياض كارد' }],
    },
    localizedProgramName: {
      defaultValue: { language: 'en', value: merchant.name },
    },
    ...locationData,
  };
}

function objectResource(objectId: string, classId: string, data: WalletCardData) {
  const points = Math.max(0, Math.trunc(data.card.total_points));
  const tier = data.card.current_tier.toUpperCase();
  const tierEmoji: Record<string, string> = { BRONZE: '🥉', SILVER: '🥈', GOLD: '🏅', PLATINUM: '💎' };
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').startsWith('https://')
    ? process.env.NEXT_PUBLIC_APP_URL!
    : 'https://riadh-card.vercel.app';

  return {
    id: objectId,
    classId,
    state: 'ACTIVE',
    // ── Header fields ──────────────────────────────────────────
    accountId: data.card.id,
    accountName: data.customer.full_name || 'RIADH CARD member',
    // ── Points balance ─────────────────────────────────────────
    loyaltyPoints: {
      label: 'POINTS',
      balance: { int: points },
      localizedLabel: {
        defaultValue: { language: 'en', value: 'Points' },
        translatedValues: [{ language: 'fr', value: 'Points' }, { language: 'ar', value: 'نقاط' }],
      },
    },
    // ── QR code — encodes slug:cardId for NFC/scan counter ─────
    barcode: {
      type: 'QR_CODE',
      value: `${data.merchant.slug}:${data.card.id}`,
      alternateText: data.card.id.slice(0, 8).toUpperCase(),
    },
    // ── Tier badge & extra info panels ─────────────────────────
    textModulesData: [
      {
        id: 'tier',
        header: 'MEMBERSHIP',
        body: `${tierEmoji[tier] ?? ''} ${tier}`,
        localizedHeader: { defaultValue: { language: 'en', value: 'Membership' } },
        localizedBody: { defaultValue: { language: 'en', value: `${tierEmoji[tier] ?? ''} ${tier}` } },
      },
      {
        id: 'merchant',
        header: 'STORE',
        body: data.merchant.name,
        localizedHeader: { defaultValue: { language: 'en', value: 'Store' } },
      },
    ],
    // ── Info links on the back of the card ─────────────────────
    linksModuleData: {
      uris: [
        {
          uri: `${appUrl}/b/${data.merchant.slug}`,
          description: 'View my loyalty card',
          id: 'loyalty_url',
          localizedDescription: {
            defaultValue: { language: 'en', value: 'View My Loyalty Card' },
            translatedValues: [{ language: 'fr', value: 'Voir ma carte de fidélité' }],
          },
        },
      ],
    },
    // ── Dynamic background colour per tier ─────────────────────
    hexBackgroundColor: tierHexColor(tier),
  };
}

async function getCardData(merchantId: string, customerId: string): Promise<WalletCardData | null> {
  const supabase = await createSupabaseAdminClient();
  const [{ data: merchant }, { data: customer }] = await Promise.all([
    supabase.from('merchants').select('id, name, slug, logo_url, latitude, longitude, proximity_enabled').eq('id', merchantId).maybeSingle(),
    supabase.from('customers').select('id, full_name').eq('id', customerId).maybeSingle(),
  ]);
  if (!merchant || !customer) return null;

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, total_points, current_tier')
    .eq('merchant_id', merchant.id)
    .eq('customer_id', customer.id)
    .maybeSingle();
  return card ? { merchant, customer, card } : null;
}

async function prepareGoogleWalletCard(merchantId: string, customerId: string) {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID?.trim();
  const account = await credentials();
  if (!issuerId || !account) throw new GoogleWalletError('Google Wallet is not configured yet.');
  if (!/^\d{10,}$/.test(issuerId)) throw new GoogleWalletError('Google Wallet Issuer ID must be numeric.');

  const data = await getCardData(merchantId, customerId);
  if (!data) throw new GoogleWalletError('Loyalty account was not found. Join this loyalty programme first.');

  const classId = `${issuerId}.riadh-${safeId(data.merchant.slug)}`;
  const objectId = `${issuerId}.member-${safeId(data.merchant.id)}-${safeId(data.customer.id)}`;
  await ensureWalletResource(account, `/loyaltyClass/${encodeURIComponent(classId)}`, '/loyaltyClass', classResource(classId, data.merchant), true);
  await ensureWalletResource(account, `/loyaltyObject/${encodeURIComponent(objectId)}`, '/loyaltyObject', objectResource(objectId, classId, data), true);

  return { account, classId, objectId };
}

/** Updates the location metadata shared by every Google Wallet pass for one store. */
export async function syncGoogleWalletMerchantClass(merchantId: string) {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const account = await credentials();
  if (!issuerId || !account || !/^\d{10,}$/.test(issuerId)) return;
  try {
    const supabase = await createSupabaseAdminClient();
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, name, slug, logo_url, latitude, longitude, proximity_enabled')
      .eq('id', merchantId)
      .maybeSingle();
    if (!merchant) return;
    const classId = `${issuerId}.riadh-${safeId(merchant.slug)}`;
    await ensureWalletResource(account, `/loyaltyClass/${encodeURIComponent(classId)}`, '/loyaltyClass', classResource(classId, merchant), true);
  } catch (error) {
    console.error('[google-wallet class sync]', error instanceof Error ? error.message : 'Unknown error');
  }
}

/** Prepares the Google resources, then returns the official Save to Google Wallet URL. */
export async function createGoogleWalletSaveUrl(merchantId: string, customerAuthUid: string) {
  try {
    const supabase = await createSupabaseAdminClient();
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_uid', customerAuthUid)
      .maybeSingle();
    if (!customer) return { url: null, error: 'Loyalty account was not found. Sign in before adding your card.' };

    const { account, classId, objectId } = await prepareGoogleWalletCard(merchantId, customer.id);
    const now = Math.floor(Date.now() / 1000);
    const token = signJwt({
      iss: account.client_email,
      aud: 'google',
      typ: 'savetowallet',
      iat: now,
      payload: { loyaltyObjects: [{ id: objectId, classId }] },
    }, account.private_key);
    return { url: `https://pay.google.com/gp/v/save/${token}`, error: null };
  } catch (error) {
    return {
      url: null,
      error: error instanceof GoogleWalletError
        ? error.message
        : 'Google Wallet could not prepare the card. Please try again shortly.',
    };
  }
}

/**
 * Keeps an already saved pass current after points, tier, or reward redemptions.
 * A loyalty transaction is never rolled back if Google Wallet is temporarily unavailable.
 */
function drainWalletSyncQueue() {
  while (activeWalletSyncs < MAX_WALLET_SYNC_CONCURRENCY && queuedWalletSyncs.length > 0) {
    const job = queuedWalletSyncs.shift();
    if (!job) return;
    activeWalletSyncs += 1;
    void job.work().catch((error) => {
      console.error('[google-wallet sync]', error instanceof Error ? error.message : 'Unknown error');
    }).finally(() => {
      activeWalletSyncs -= 1;
      walletSyncByCard.delete(job.key);
      job.resolve();
      drainWalletSyncQueue();
    });
  }
}

/**
 * Coalesces duplicate balance updates and limits outbound Google traffic per server.
 * The critical Supabase points transaction has already completed before this runs.
 */
export function syncGoogleWalletLoyaltyCard(merchantId: string, customerId: string) {
  if (!process.env.GOOGLE_WALLET_ISSUER_ID) return Promise.resolve();
  const key = `${merchantId}:${customerId}`;
  const existing = walletSyncByCard.get(key);
  if (existing) return existing;

  let resolve!: () => void;
  const completion = new Promise<void>((done) => { resolve = done; });
  walletSyncByCard.set(key, completion);
  queuedWalletSyncs.push({
    key,
    resolve,
    work: async () => { await prepareGoogleWalletCard(merchantId, customerId); },
  });
  drainWalletSyncQueue();
  return completion;
}

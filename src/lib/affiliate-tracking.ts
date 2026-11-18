import { supabase } from '@/integrations/supabase/client';

const REF_STORAGE_KEY = 'modulajar_affiliate_ref';
const REF_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const CLICK_SESSION_PREFIX = 'modulajar_aff_clicked_';

interface StoredRef {
  code: string;
  savedAt: number;
}

/**
 * Save affiliate referral code to localStorage with 30-day TTL
 */
export function saveAffiliateRef(code: string): string {
  const clean = code.trim().toUpperCase();
  if (!clean) return '';
  try {
    const payload: StoredRef = { code: clean, savedAt: Date.now() };
    localStorage.setItem(REF_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
  return clean;
}

/**
 * Retrieve active affiliate referral code (returns null if expired or absent)
 */
export function getStoredAffiliateRef(): string | null {
  try {
    const raw = localStorage.getItem(REF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRef;
    if (!parsed?.code || !parsed?.savedAt) return null;
    if (Date.now() - parsed.savedAt > REF_TTL_MS) {
      localStorage.removeItem(REF_STORAGE_KEY);
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}

/**
 * Track a unique click per session via SECURITY DEFINER RPC
 */
export async function trackAffiliateClickOnce(code: string): Promise<void> {
  const clean = code.trim().toUpperCase();
  if (!clean) return;
  const sessionKey = `${CLICK_SESSION_PREFIX}${clean}`;
  try {
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');
  } catch {
    // ignore sessionStorage errors
  }

  try {
    await (supabase as any).rpc('track_affiliate_click', { p_code: clean });
  } catch (err) {
    console.warn('Could not track affiliate click:', err);
  }
}

/**
 * Fetch public recommender display info for landing page / checkout badge
 */
export async function fetchAffiliatePublicInfo(
  code: string
): Promise<{ id: string; affiliate_code: string; display_name: string } | null> {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  try {
    const { data, error } = await (supabase as any).rpc('get_affiliate_public_info', {
      p_code: clean,
    });
    if (error || !data || !Array.isArray(data) || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
}

/**
 * Helper to build affiliate landing page URL
 */
export function buildAffiliateLandingUrl(code: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://modulajar.online';
  return `${origin}/?ref=${encodeURIComponent(code.trim().toUpperCase())}`;
}

/**
 * Helper to inject {LINK_AFILIASI} and {NAMA_AFILIATOR} placeholders in Marketing Kit text
 */
export function renderMarketingKitText(
  template: string,
  affiliateCode: string,
  affiliateName: string
): string {
  const link = buildAffiliateLandingUrl(affiliateCode);
  return template
    .replace(/\{LINK_AFILIASI\}/gi, link)
    .replace(/\{KODE_AFILIASI\}/gi, affiliateCode.toUpperCase())
    .replace(/\{NAMA_AFILIATOR\}/gi, affiliateName);
}

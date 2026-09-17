// ---------------------------------------------------------------------------
// IP-based country detection for pricing.
//
// Tries two free, key-less HTTPS geolocation APIs, then falls back to the
// browser's timezone/locale so the UI always has an answer. The result is
// cached for the session. Users can still override the country manually in
// the registration form; the server re-validates the price at checkout.
// ---------------------------------------------------------------------------

export interface GeoResult {
  countryCode: string; // ISO 3166-1 alpha-2
  countryName?: string;
  city?: string;
  source: "ip" | "timezone" | "locale" | "default";
}

const CACHE_KEY = "tt_geo_v1";

const TZ_TO_COUNTRY: Record<string, string> = {
  "Asia/Kolkata": "IN", "Asia/Calcutta": "IN", "Asia/Karachi": "PK", "Asia/Dhaka": "BD", "Asia/Kathmandu": "NP", "Asia/Colombo": "LK",
  "Asia/Dubai": "AE", "Asia/Singapore": "SG", "Asia/Tokyo": "JP", "Asia/Manila": "PH", "Asia/Kuala_Lumpur": "MY", "Asia/Jakarta": "ID",
  "Europe/London": "GB", "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Madrid": "ES", "Europe/Rome": "IT", "Europe/Amsterdam": "NL", "Europe/Dublin": "IE",
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US", "America/Los_Angeles": "US", "America/Toronto": "CA", "America/Vancouver": "CA",
  "America/Sao_Paulo": "BR", "America/Mexico_City": "MX", "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Pacific/Auckland": "NZ",
  "Africa/Lagos": "NG", "Africa/Nairobi": "KE", "Africa/Johannesburg": "ZA",
};

async function fetchJson(url: string, ms = 3500): Promise<Record<string, unknown> | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function fallback(): GeoResult {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz && TZ_TO_COUNTRY[tz]) return { countryCode: TZ_TO_COUNTRY[tz], source: "timezone" };
  const region = navigator.language?.split("-")[1]?.toUpperCase();
  if (region && /^[A-Z]{2}$/.test(region)) return { countryCode: region, source: "locale" };
  return { countryCode: "US", source: "default" };
}

export async function detectCountry(): Promise<GeoResult> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached) as GeoResult;
  } catch { /* ignore */ }

  let result: GeoResult | null = null;

  // Provider 1: ipapi.co
  const a = await fetchJson("https://ipapi.co/json/");
  if (a && typeof a.country_code === "string" && /^[A-Z]{2}$/.test(a.country_code)) {
    result = { countryCode: a.country_code, countryName: a.country_name as string, city: a.city as string, source: "ip" };
  }
  // Provider 2: ipwho.is
  if (!result) {
    const b = await fetchJson("https://ipwho.is/");
    if (b && b.success !== false && typeof b.country_code === "string") {
      result = { countryCode: b.country_code, countryName: b.country as string, city: b.city as string, source: "ip" };
    }
  }
  if (!result) result = fallback();

  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch { /* ignore */ }
  return result;
}

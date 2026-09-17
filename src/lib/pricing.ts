// ---------------------------------------------------------------------------
// Membership pricing – two regional tiers driven by the artist's country
// (auto-detected from IP, editable in the form; re-validated server-side).
//
//   South Asia (India, Pakistan, Bangladesh + neighbours)  →  ₹500 / year
//   Everywhere else (USA, UK, Canada, Europe, Australia…)  →  $10 / year
//
// Update here AND in the payment Cloud Function in lockstep – the server is
// the source of truth for what is actually charged.
// ---------------------------------------------------------------------------

export type PriceTier = "south-asia" | "global";

export const SOUTH_ASIA = new Set(["IN", "PK", "BD", "NP", "LK", "BT", "MV"]);

export const TIER_PRICES: Record<PriceTier, { amount: number; currency: string; label: string }> = {
  "south-asia": { amount: 500, currency: "INR", label: "₹500" },
  global: { amount: 10, currency: "USD", label: "$10" },
};

export function priceTierForCountry(countryCode?: string): PriceTier {
  return SOUTH_ASIA.has((countryCode ?? "").toUpperCase()) ? "south-asia" : "global";
}

export function membershipPriceForCountry(countryCode?: string): { amount: number; currency: string; label: string; tier: PriceTier } {
  const tier = priceTierForCountry(countryCode);
  return { ...TIER_PRICES[tier], tier };
}

/** Kept for callers that only know a currency. */
export function membershipPrice(currency: string) {
  return currency === "INR" ? TIER_PRICES["south-asia"] : TIER_PRICES.global;
}

const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "IDR", "UGX", "CLP", "COP", "HUF", "LBP", "TZS", "PKR", "NGN", "KES", "ARS", "INR"]);

export function formatMoney(amount: number, currency: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale ?? (currency === "INR" ? "en-IN" : "en-US"), {
      style: "currency",
      currency,
      maximumFractionDigits: ZERO_DECIMAL.has(currency) || Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function formatDate(iso?: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, opts) : "—";
}

import { isFirebaseConfigured } from "@/lib/firebase";
import { SUBSCRIPTION_DAYS, type Payment, type Talent } from "@/lib/types";
import { membershipPriceForCountry } from "@/lib/pricing";
import { dataService, uid } from "@/services";
import { MockGateway } from "./mockGateway";
import { RazorpayGateway } from "./razorpayGateway";
import type { PaymentGateway } from "./types";

// ---------------------------------------------------------------------------
// Gateway selection.
//   VITE_PAYMENT_MODE=live  → Razorpay (requires Firebase + Cloud Functions).
//                             Razorpay supports international cards and 100+
//                             currencies; swap in a StripeGateway for regions
//                             where Razorpay is unavailable (same interface).
//   anything else           → Mock gateway (development / demo)
// The live path never falls back to mock silently: if live is requested but
// mis-configured, checkout returns an error.
// ---------------------------------------------------------------------------
const env = import.meta.env;
export const PAYMENT_MODE: "live" | "test" =
  env.VITE_PAYMENT_MODE === "live" && isFirebaseConfigured ? "live" : "test";

export const paymentGateway: PaymentGateway =
  PAYMENT_MODE === "live"
    ? new RazorpayGateway(env.VITE_PAYMENT_API_URL ?? "", env.VITE_RAZORPAY_KEY_ID ?? "")
    : new MockGateway();

export interface SubscribeOutcome {
  success: boolean;
  error?: string;
  talent?: Talent;
}

/**
 * Starts the annual membership checkout (priced in the talent's local
 * currency) and, on success, records the payment + activates the subscription.
 *
 * In LIVE mode the Cloud Function `verifyPayment` is the source of truth and
 * has already updated Firestore; we simply re-read the talent document.
 * In TEST mode the client writes the records directly (dev only).
 */
export async function purchaseAnnualMembership(talent: Talent): Promise<SubscribeOutcome> {
  const price = membershipPriceForCountry(talent.country);
  const result = await paymentGateway.checkout({
    talent,
    amount: price.amount,
    currency: price.currency,
    description: "Talent Tube – Annual Talent Membership",
    customer: { name: talent.fullName, email: talent.email, contact: `+${talent.mobile}` },
  });

  if (!result.success) return { success: false, error: result.error };

  if (paymentGateway.mode === "live") {
    const fresh = await dataService.getTalent(talent.id);
    return { success: true, talent: fresh ?? talent };
  }

  // ---- TEST MODE ONLY (client-side activation) ----
  const now = new Date();
  const start = now.toISOString();
  const expiry = new Date(now.getTime() + SUBSCRIPTION_DAYS * 86400000).toISOString();

  const payment: Payment = {
    id: result.paymentId ?? uid(),
    talentId: talent.id,
    uid: talent.uid,
    amount: price.amount,
    currency: price.currency,
    status: "success",
    provider: "mock",
    mode: "test",
    orderId: result.orderId,
    paymentId: result.paymentId,
    signature: result.signature,
    createdAt: start,
  };
  await dataService.createPayment(payment);

  const patch: Partial<Talent> = {
    subscriptionStatus: "active",
    subscriptionStartDate: start,
    subscriptionExpiryDate: expiry,
    paymentId: payment.id,
    // A renewed-but-expired profile goes back to pending for a quick re-check
    status: talent.status === "expired" ? "pending" : talent.status,
  };
  await dataService.updateTalent(talent.id, patch);
  return { success: true, talent: { ...talent, ...patch } };
}

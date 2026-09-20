import { SUBSCRIPTION_DAYS, type Payment, type Talent } from "@/lib/types";
import { membershipPriceForCountry } from "@/lib/pricing";
import { dataService, uid } from "@/services";
import { MockGateway } from "./mockGateway";
import type { PaymentGateway } from "./types";

export const PAYMENT_MODE: "live" | "test" = "test";
export const paymentGateway: PaymentGateway = new MockGateway();

export interface SubscribeOutcome {
  success: boolean;
  error?: string;
  talent?: Talent;
}

/**
 * Starts the annual membership checkout (priced in the talent's local
 * currency) and records the payment + activates the subscription in MongoDB / local DB.
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
    status: talent.status === "expired" ? "pending" : talent.status,
  };
  await dataService.updateTalent(talent.id, patch);
  return { success: true, talent: { ...talent, ...patch } };
}

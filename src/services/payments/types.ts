import type { Talent } from "@/lib/types";

export interface CheckoutRequest {
  talent: Talent;
  /** Amount in MAJOR units of `currency` (e.g. 9 USD, 500 INR). */
  amount: number;
  /** ISO 4217 currency code. */
  currency: string;
  description: string;
  customer: { name: string; email?: string; contact: string };
}

export interface CheckoutResult {
  success: boolean;
  /** Gateway payment id (e.g. Razorpay `pay_xxx`, Stripe `pi_xxx`) */
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

/**
 * Every gateway (Razorpay, Stripe, PayPal, mock…) implements this so the
 * subscription page never depends on a specific provider.
 */
export interface PaymentGateway {
  readonly name: "razorpay" | "stripe" | "mock";
  readonly mode: "live" | "test";
  checkout(req: CheckoutRequest): Promise<CheckoutResult>;
}

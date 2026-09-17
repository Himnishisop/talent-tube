import type { CheckoutRequest, CheckoutResult, PaymentGateway } from "./types";

// ---------------------------------------------------------------------------
// LIVE Razorpay gateway.
//
// Flow (standard Razorpay "Orders" integration – see README):
//   1. Client → POST {PAYMENT_API_URL}/createOrder  (Firebase Cloud Function)
//      Server creates a Razorpay order with the secret key and returns
//      { orderId, amount, currency, keyId }.
//   2. Client opens Razorpay Checkout with that orderId.
//   3. Razorpay returns razorpay_payment_id / order_id / signature.
//   4. Client → POST {PAYMENT_API_URL}/verifyPayment with those values.
//      Server verifies HMAC-SHA256 signature with the secret, writes the
//      `payments` doc and activates the talent's subscription (server-side
//      only – the client never writes subscription fields in production).
//
// Nothing here fakes success: if the server does not confirm, we fail.
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(s);
  });
}

async function getIdToken(): Promise<string | undefined> {
  const { auth } = await import("@/lib/firebase");
  return auth?.currentUser?.getIdToken();
}

export class RazorpayGateway implements PaymentGateway {
  readonly name = "razorpay" as const;
  readonly mode = "live" as const;

  constructor(private apiUrl: string, private keyId: string) {}

  async checkout(req: CheckoutRequest): Promise<CheckoutResult> {
    if (!this.apiUrl || !this.keyId) {
      return { success: false, error: "Payment gateway is not configured (VITE_PAYMENT_API_URL / VITE_RAZORPAY_KEY_ID)." };
    }

    const token = await getIdToken();
    if (!token) return { success: false, error: "Please sign in again to continue." };

    // 1. Create order on the server
    const orderRes = await fetch(`${this.apiUrl}/createOrder`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ talentId: req.talent.id, plan: "annual" }),
    });
    if (!orderRes.ok) return { success: false, error: "Could not create payment order." };
    const order: { orderId: string; amount: number; currency: string } = await orderRes.json();

    // 2. Open Razorpay checkout
    await loadScript(RAZORPAY_SCRIPT);
    if (!window.Razorpay) return { success: false, error: "Razorpay SDK unavailable." };

    const gatewayResponse = await new Promise<{ razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string } | null>(
      (resolve) => {
        const rzp = new window.Razorpay!({
          key: this.keyId,
          amount: order.amount, // in paise, from server
          currency: order.currency,
          order_id: order.orderId,
          name: "Talent Tube",
          description: req.description,
          prefill: { name: req.customer.name, email: req.customer.email, contact: req.customer.contact },
          notes: { talentId: req.talent.id },
          theme: { color: "#13284a" },
          modal: { ondismiss: () => resolve(null) },
          handler: (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => resolve(resp),
        });
        rzp.on("payment.failed", () => resolve(null));
        rzp.open();
      }
    );

    if (!gatewayResponse) return { success: false, error: "Payment cancelled or failed." };

    // 3. Verify on server (signature check + subscription activation)
    const verifyRes = await fetch(`${this.apiUrl}/verifyPayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...gatewayResponse, talentId: req.talent.id }),
    });
    if (!verifyRes.ok) return { success: false, error: "Payment verification failed. Contact support with your payment id." };

    return {
      success: true,
      paymentId: gatewayResponse.razorpay_payment_id,
      orderId: gatewayResponse.razorpay_order_id,
      signature: gatewayResponse.razorpay_signature,
    };
  }
}

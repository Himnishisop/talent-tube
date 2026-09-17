import type { CheckoutRequest, CheckoutResult, PaymentGateway } from "./types";
import { formatMoney } from "@/lib/pricing";

// ---------------------------------------------------------------------------
// TEST / MOCK gateway – development only.
// Enabled ONLY when VITE_PAYMENT_MODE !== "live" (or Firebase is absent).
// Shows a simple in-app dialog where the developer can simulate a successful
// or failed payment. It is never bundled into the "live" flow decision path.
// ---------------------------------------------------------------------------

export class MockGateway implements PaymentGateway {
  readonly name = "mock" as const;
  readonly mode = "test" as const;

  checkout(req: CheckoutRequest): Promise<CheckoutResult> {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className =
        "fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-4";
      overlay.innerHTML = `
        <div class="w-full max-w-sm rounded-2xl border border-line bg-panel p-5 shadow-2xl">
          <div class="mb-1 inline-flex items-center gap-2 rounded-md border border-silver/30 bg-panel-raised px-3 py-1 text-xs font-semibold text-silver">
            TEST MODE - Mock Gateway
          </div>
          <h3 class="mt-3 text-lg font-bold text-slate-900">Talent Tube</h3>
          <p class="text-sm text-slate-600">${req.description}</p>
          <div class="my-4 rounded-xl bg-slate-50 p-4 text-center">
            <div class="text-3xl font-extrabold text-slate-900">${formatMoney(req.amount, req.currency)}</div>
            <div class="text-xs text-slate-500">${req.customer.name} · ${req.customer.contact}</div>
          </div>
          <button data-action="success" class="button-primary mb-2 h-12 w-full rounded-xl font-semibold active:scale-[0.98]">Simulate Success</button>
          <button data-action="fail" class="mb-2 h-12 w-full rounded-xl bg-rose-100 font-semibold text-rose-700 active:scale-[0.98]">Simulate Failure</button>
          <button data-action="cancel" class="h-11 w-full rounded-xl text-sm font-medium text-slate-500">Cancel</button>
        </div>`;

      const done = (result: CheckoutResult) => {
        overlay.remove();
        resolve(result);
      };

      overlay.addEventListener("click", (e) => {
        const target = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
        if (!target) return;
        const action = target.dataset.action;
        const stamp = Date.now().toString(36);
        if (action === "success") {
          done({ success: true, paymentId: `pay_test_${stamp}`, orderId: `order_test_${stamp}`, signature: "test_signature" });
        } else if (action === "fail") {
          done({ success: false, error: "Simulated payment failure" });
        } else {
          done({ success: false, error: "Payment cancelled" });
        }
      });

      document.body.appendChild(overlay);
    });
  }
}

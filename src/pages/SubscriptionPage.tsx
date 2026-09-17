import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck, Search, PhoneCall, PlayCircle, Lock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { dataService } from "@/services";
import { PAYMENT_MODE, purchaseAnnualMembership } from "@/services/payments";
import type { Talent } from "@/lib/types";
import { formatDate, formatMoney, membershipPriceForCountry } from "@/lib/pricing";
import { getCountry } from "@/lib/geo";
import { Button, Spinner } from "@/components/ui";

export function SubscriptionPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [talent, setTalent] = useState<Talent | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user) dataService.getTalent(user.uid).then(setTalent);
  }, [user]);

  if (!user) return null;
  if (talent === undefined) return <Spinner label={t("loading")} />;
  if (talent === null) return <Navigate to="/register" replace />;

  const pay = async () => {
    setBusy(true);
    setError("");
    const res = await purchaseAnnualMembership(talent);
    setBusy(false);
    if (res.success) {
      setTalent(res.talent ?? talent);
      setDone(true);
    } else {
      setError(res.error ?? t("paymentFailed"));
    }
  };

  const expiry = talent.subscriptionExpiryDate ? new Date(talent.subscriptionExpiryDate) : null;
  const active = talent.subscriptionStatus === "active" && expiry && expiry.getTime() > Date.now();
  const price = membershipPriceForCountry(talent.country);
  const priceLabel = formatMoney(price.amount, price.currency);
  const perDay = formatMoney(Math.ceil((price.amount / 365) * 100) / 100, price.currency);
  const countryName = getCountry(talent.country).name;

  if (done) {
    return (
      <div className="mx-auto max-w-md animate-fade-up rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold">{t("paymentSuccess")}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your membership is active until <b>{formatDate(talent.subscriptionExpiryDate, { day: "numeric", month: "long", year: "numeric" })}</b>.
          {talent.status !== "approved" && " Our team will review your profile within 24–48 hours."}
        </p>
        <p className="mt-1 text-xs text-slate-400">Payment ID: {talent.paymentId}</p>
        <Button className="mt-6" full size="lg" onClick={() => navigate("/dashboard", { replace: true })}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md animate-fade-up">
      {PAYMENT_MODE === "test" && (
        <div className="mb-3 rounded-xl border border-silver/30 bg-panel-raised p-3 text-center text-xs font-bold text-silver">{t("testModeBanner")}</div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="membership-header p-6 text-heading">
          <p className="text-xs font-semibold uppercase tracking-widest text-neon">{t("membership")}</p>
          <div className="mt-2 flex items-end gap-1">
            <span className="brand-word text-5xl font-extrabold">{priceLabel}</span>
            <span className="mb-2 text-slate-300">/ {t("perYear")}</span>
          </div>
          <p className="mt-1 text-sm text-slate-300">About {perDay} per day. Priced for {countryName}. No commission on bookings, ever.</p>
        </div>

        <ul className="space-y-3 p-6 text-sm text-slate-700">
          <li className="flex gap-3"><Search className="h-5 w-5 shrink-0 text-brand-600" /> Get discovered by clients searching locally and worldwide</li>
          <li className="flex gap-3"><PlayCircle className="h-5 w-5 shrink-0 text-brand-600" /> Showcase up to 5 YouTube videos on your profile</li>
          <li className="flex gap-3"><PhoneCall className="h-5 w-5 shrink-0 text-brand-600" /> Direct Call & WhatsApp buttons – customers contact you directly</li>
          <li className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-brand-600" /> Eligible for the Verified badge after admin review</li>
        </ul>

        <div className="px-6 pb-6">
          {active && (
            <p className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              Your membership is currently active until {formatDate(talent.subscriptionExpiryDate)}. Renewing will extend it by one year from today.
            </p>
          )}
          {error && <p className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <Button full size="lg" loading={busy} onClick={pay} icon={<Lock className="h-5 w-5" />}>
            {t("payWithRazorpay")} · {priceLabel}
          </Button>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            {PAYMENT_MODE === "live" ? "Secure checkout. International cards, UPI, wallets and local payment methods where available." : "Test mode uses a mock gateway. Set VITE_PAYMENT_MODE=live for real payments."}
          </p>
          <p className="mt-2 text-center text-xs">
            <Link to="/dashboard" className="font-semibold text-slate-500">Pay later →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

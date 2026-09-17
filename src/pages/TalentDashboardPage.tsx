import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Pencil, Eye, CreditCard, Clock, CheckCircle2, XCircle, PauseCircle, AlertTriangle, Video } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { useCategories } from "@/hooks/useCategories";
import { dataService, isPubliclyVisible } from "@/services";
import type { Talent } from "@/lib/types";
import { Avatar, Button, Spinner, StatusBadge, SubBadge } from "@/components/ui";
import { formatDate, formatMoney, membershipPriceForCountry } from "@/lib/pricing";
import { getCountry } from "@/lib/geo";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";

const fmt = (iso?: string) => formatDate(iso);

export function TalentDashboardPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const { byId } = useCategories();
  const [talent, setTalent] = useState<Talent | null | undefined>(undefined);

  useEffect(() => {
    if (user) dataService.getTalent(user.uid).then(setTalent);
  }, [user]);

  if (!user) return null;
  if (talent === undefined) return <Spinner label={t("loading")} />;
  if (talent === null) return <Navigate to="/register" replace />;

  const cat = byId(talent.categoryId);
  const live = isPubliclyVisible(talent);
  const daysLeft = talent.subscriptionExpiryDate ? Math.ceil((new Date(talent.subscriptionExpiryDate).getTime() - Date.now()) / 86400000) : null;
  const needsPayment = talent.subscriptionStatus !== "active" || (daysLeft !== null && daysLeft <= 0);
  const price = membershipPriceForCountry(talent.country);
  const priceLabel = formatMoney(price.amount, price.currency);

  // Checklist for going live
  const checks = [
    { label: "Registration complete", ok: talent.registrationComplete, icon: CheckCircle2 },
    { label: `Membership active (${priceLabel} / year)`, ok: talent.subscriptionStatus === "active" && !needsPayment, icon: CreditCard },
    { label: "Admin approval", ok: talent.status === "approved", icon: talent.status === "rejected" ? XCircle : Clock },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-up">
      <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <Avatar src={talent.photoURL} name={talent.fullName} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold">{talent.fullName}</h1>
          <p className="truncate text-sm text-brand-700">{cat?.name} · {talent.subCategory}</p>
          <p className="text-xs text-slate-500">{talent.city}, {talent.state}, {getCountry(talent.country).name}</p>
        </div>
      </div>

      {/* Live status banner */}
      <div className={`rounded-2xl p-4 ${live ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
        <p className="font-bold">{live ? "You're in the spotlight. Your profile is live." : "Your profile is not public yet."}</p>
        {!live && <p className="mt-1 text-sm">Complete all 3 steps below to go live.</p>}
        <ul className="mt-3 space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              <c.icon className={`h-5 w-5 ${c.ok ? "text-emerald-600" : "text-amber-500"}`} />
              <span className={c.ok ? "font-medium" : ""}>{c.label}</span>
              {c.ok && <span className="ml-auto text-xs font-bold text-emerald-700">Done</span>}
            </li>
          ))}
        </ul>
      </div>

      {talent.status === "rejected" && (
        <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <XCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Profile rejected</p>
            <p>{talent.rejectionReason ?? "Please update your profile details and re-submit."}</p>
          </div>
        </div>
      )}
      {talent.status === "suspended" && (
        <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <PauseCircle className="h-5 w-5 shrink-0" />
          <p><span className="font-bold">Profile suspended.</span> Contact support at support@talenttube.in.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("profileStatus")}</p>
          <div className="mt-2"><StatusBadge status={talent.status} /></div>
          <p className="mt-2 text-xs text-slate-500">Last updated {fmt(talent.updatedAt)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("subscription")}</p>
          <div className="mt-2"><SubBadge status={needsPayment && talent.subscriptionStatus === "active" ? "expired" : talent.subscriptionStatus} /></div>
          <p className="mt-2 text-xs text-slate-500">
            {t("validTill")}: {fmt(talent.subscriptionExpiryDate)}
            {daysLeft !== null && daysLeft > 0 && ` (${daysLeft} days left)`}
          </p>
          {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> Expiring soon – renew to stay visible</p>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {needsPayment ? (
          <Link to="/subscribe" className="sm:col-span-3"><Button full size="lg" icon={<CreditCard className="h-5 w-5" />}>{talent.subscriptionStatus === "pending" ? `Activate membership · ${priceLabel} / year` : t("renewNow")}</Button></Link>
        ) : (
          daysLeft !== null && daysLeft <= 30 && <Link to="/subscribe" className="sm:col-span-3"><Button full size="lg" variant="secondary" icon={<CreditCard className="h-5 w-5" />}>{t("renewNow")}</Button></Link>
        )}
        <Link to="/register"><Button full variant="outline" icon={<Pencil className="h-4 w-4" />}>{t("editProfile")}</Button></Link>
        <Link to={`/talent/${talent.id}`}><Button full variant="outline" icon={<Eye className="h-4 w-4" />}>{t("viewPublicProfile")}</Button></Link>
        <Link to="/register"><Button full variant="outline" icon={<Video className="h-4 w-4" />}>{t("videos")} ({talent.videos.length}/5)</Button></Link>
      </div>

      {talent.videos.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">{t("videos")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {talent.videos.map((v) => <YouTubeEmbed key={v.videoId} videoId={v.videoId} title={v.title} />)}
          </div>
        </section>
      )}
    </div>
  );
}

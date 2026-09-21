import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Eye, CreditCard, Clock, CheckCircle2, XCircle, PauseCircle, AlertTriangle, Video, Sparkles, Copy, Check, MessageSquare, Phone, ExternalLink } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) dataService.getTalent(user.uid).then(setTalent);
  }, [user]);

  if (!user) return null;
  if (talent === undefined) return <Spinner label={t("loading")} />;

  // Welcoming onboarding view for newly registered talents who haven't built their profile yet
  if (talent === null) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
        <div className="rounded-3xl border border-line bg-panel p-6 sm:p-8 text-center shadow-lg relative overflow-hidden">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-heading">
            Welcome to Talent Tube, {user.displayName || "Artist"}!
          </h1>
          <p className="mt-3 text-sm text-muted max-w-lg mx-auto leading-relaxed">
            Your talent account is active ({user.email}). Complete your artist profile to appear in search results and connect directly with casting directors and recruiters.
          </p>

          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-surface/60 p-4">
              <div className="font-bold text-xs text-brand-600 mb-1">STEP 1</div>
              <h3 className="font-semibold text-sm text-heading">Talent Category</h3>
              <p className="mt-1 text-xs text-muted">Select your specialty, skills, language, and city.</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface/60 p-4">
              <div className="font-bold text-xs text-brand-600 mb-1">STEP 2</div>
              <h3 className="font-semibold text-sm text-heading">Showcase Videos</h3>
              <p className="mt-1 text-xs text-muted">Add your YouTube performance links and headshot.</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface/60 p-4">
              <div className="font-bold text-xs text-brand-600 mb-1">STEP 3</div>
              <h3 className="font-semibold text-sm text-heading">Go Live</h3>
              <p className="mt-1 text-xs text-muted">Receive inquiries directly via WhatsApp with 0% commission.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full" icon={<Pencil className="h-5 w-5" />}>
                Build Your Artist Profile
              </Button>
            </Link>
            <Link to="/app" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full" icon={<ExternalLink className="h-4 w-4" />}>
                Open Mobile App View
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cat = byId(talent.categoryId);
  const live = isPubliclyVisible(talent);
  const daysLeft = talent.subscriptionExpiryDate ? Math.ceil((new Date(talent.subscriptionExpiryDate).getTime() - Date.now()) / 86400000) : null;
  const needsPayment = talent.subscriptionStatus !== "active" || (daysLeft !== null && daysLeft <= 0);
  const price = membershipPriceForCountry(talent.country);
  const priceLabel = formatMoney(price.amount, price.currency);

  const copyProfileLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/talent/${talent.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Checklist for going live
  const checks = [
    { label: "Registration complete", ok: talent.registrationComplete, icon: CheckCircle2 },
    { label: `Membership active (${priceLabel} / year)`, ok: talent.subscriptionStatus === "active" && !needsPayment, icon: CreditCard },
    { label: "Admin approval", ok: talent.status === "approved", icon: talent.status === "rejected" ? XCircle : Clock },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-line bg-panel p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar src={talent.photoURL} name={talent.fullName} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold text-heading">{talent.fullName}</h1>
            <p className="truncate text-sm text-brand-600 font-medium">{cat?.name} · {talent.subCategory}</p>
            <p className="text-xs text-muted">{talent.city}, {talent.state}, {getCountry(talent.country).name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyProfileLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/80 px-3.5 py-2 text-xs font-semibold text-heading hover:bg-surface transition"
            title="Copy public link"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Link Copied" : "Share Profile"}
          </button>
          <Link to={`/talent/${talent.id}`}>
            <Button variant="outline" size="sm" icon={<Eye className="h-3.5 w-3.5" />}>
              Preview
            </Button>
          </Link>
        </div>
      </div>

      {/* Live status banner */}
      <div className={`rounded-2xl p-4 ${live ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-amber-500/10 border border-amber-500/30 text-amber-300"}`}>
        <p className="font-bold">{live ? "You're in the spotlight. Your profile is live." : "Your profile is not public yet."}</p>
        {!live && <p className="mt-1 text-sm text-muted">Complete all 3 steps below to go live and appear in recruiter searches.</p>}
        <ul className="mt-3 space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              <c.icon className={`h-5 w-5 ${c.ok ? "text-emerald-500" : "text-amber-500"}`} />
              <span className={c.ok ? "font-medium text-heading" : "text-muted"}>{c.label}</span>
              {c.ok && <span className="ml-auto text-xs font-bold text-emerald-500">Done</span>}
            </li>
          ))}
        </ul>
      </div>

      {talent.status === "rejected" && (
        <div className="flex gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <p className="font-bold">Profile rejected</p>
            <p>{talent.rejectionReason ?? "Please update your profile details and re-submit."}</p>
          </div>
        </div>
      )}
      {talent.status === "suspended" && (
        <div className="flex gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <PauseCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <p><span className="font-bold">Profile suspended.</span> Contact support at support@talenttube.in.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("profileStatus")}</p>
          <div className="mt-2"><StatusBadge status={talent.status} /></div>
          <p className="mt-2 text-xs text-muted">Last updated {fmt(talent.updatedAt)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("subscription")}</p>
          <div className="mt-2"><SubBadge status={needsPayment && talent.subscriptionStatus === "active" ? "expired" : talent.subscriptionStatus} /></div>
          <p className="mt-2 text-xs text-muted">
            {t("validTill")}: {fmt(talent.subscriptionExpiryDate)}
            {daysLeft !== null && daysLeft > 0 && ` (${daysLeft} days left)`}
          </p>
          {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-500"><AlertTriangle className="h-3.5 w-3.5" /> Expiring soon – renew to stay visible</p>
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
        <section className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-heading">{t("videos")}</h2>
            <Link to="/register" className="text-xs text-brand-500 hover:underline">Manage videos</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {talent.videos.map((v) => <YouTubeEmbed key={v.videoId} videoId={v.videoId} title={v.title} />)}
          </div>
        </section>
      )}

      {/* Recruiter direct contact preview */}
      <section className="rounded-2xl border border-line bg-panel p-5">
        <h3 className="text-sm font-bold text-heading flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-500" />
          Direct Inquiries Channel
        </h3>
        <p className="mt-1 text-xs text-muted">Recruiters and casting directors contact you directly through these channels with zero commission taken by Talent Tube:</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-heading">
          <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-emerald-500" /> {talent.mobile}</span>
          <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp: {talent.whatsapp}</span>
        </div>
      </section>
    </div>
  );
}


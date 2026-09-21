import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, MapPin, Briefcase, Languages, Flag, Share2, EyeOff, Clapperboard, CheckCircle2, Pencil } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { dataService, isPubliclyVisible, uid } from "@/services";
import { bestVideoOf, type Talent } from "@/lib/types";
import { REPORT_REASONS } from "@/lib/constants";
import { getCountry } from "@/lib/geo";
import { Avatar, Badge, Button, Empty, FeaturedBadge, Select, Spinner, Textarea, VerifiedBadge } from "@/components/ui";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { FloatingShowcasePlayer } from "@/components/FloatingShowcasePlayer";
import { Star } from "lucide-react";

/** Numbers are stored as E.164 digits; legacy 10-digit Indian numbers get the +91 prefix. */
const toIntl = (n: string) => {
  const digits = n.replace(/\D/g, "");
  return digits.length === 10 && /^[6-9]/.test(digits) ? `91${digits}` : digits;
};

export function TalentProfilePage() {
  const { id } = useParams();
  const { t } = useLang();
  const { user, isAdmin } = useAuth();
  const { byId } = useCategories();
  const navigate = useNavigate();
  const [talent, setTalent] = useState<Talent | null | undefined>(undefined);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    dataService.getTalent(id).then(setTalent);
  }, [id]);

  if (talent === undefined) return <Spinner label={t("loading")} />;

  // Owner and admins may preview a non-public profile
  const isOwner = user?.uid === talent?.uid;
  if (!talent || (!isPubliclyVisible(talent) && !isOwner && !isAdmin)) {
    return <Empty icon={<EyeOff className="h-9 w-9" />} title="Profile not available" sub="This talent profile is not public yet or has been removed." action={<Link to="/search"><Button>Explore talent</Button></Link>} />;
  }

  const category = byId(talent.categoryId);
  const catName = category?.name ?? talent.categoryId;
  // "Best Video" → floating auto-play mini-player for guests (not for the owner
  // editing their own page, or admins moderating).
  const bestVideo = bestVideoOf(talent.videos);
  const showFloatingPlayer = !!bestVideo && !isOwner && !isAdmin;
  const waText = encodeURIComponent(`Hi ${talent.fullName}, I found your profile on Talent Tube and would like to enquire about booking you.`);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${talent.fullName} – Talent Tube`, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  return (
    <div className="animate-fade-up pb-24 md:pb-0">
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
        <ArrowLeft className="h-4 w-4" /> {t("back")}
      </button>

      {isOwner && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-neon/40 bg-neon/10 p-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-heading">
              This is how recruiters and casting directors see your profile on Talent Tube.
            </span>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-neon px-4 py-2 font-black text-canvas hover:bg-neon/90 transition shadow shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile in Studio
          </Link>
        </div>
      )}

      {!isPubliclyVisible(talent) && (
        <div className="mb-3 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800">
          Preview mode: this profile is not visible to customers (status: {talent.status}, subscription: {talent.subscriptionStatus}).
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Left / top: identity card */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-line bg-panel">
            <div className="profile-cover h-24" />
            <div className="px-5 pb-5">
              <div className="-mt-12 flex items-end justify-between">
                <Avatar src={talent.photoURL} name={talent.fullName} size={96} className="ring-4 ring-panel" />
                <div className="mb-2 flex gap-2">
                  {talent.featured && <FeaturedBadge />}
                </div>
              </div>
              <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{talent.fullName}</h1>
              <p className="font-semibold text-neon">
                {catName} · {talent.subCategory}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {talent.verified ? <Badge tone="blue"><VerifiedBadge small /></Badge> : <Badge tone="slate">Not verified</Badge>}
                <Badge tone="slate"><Briefcase className="h-3.5 w-3.5" /> {talent.experienceYears}+ {t("years")}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {talent.city}, {talent.state}, {getCountry(talent.country).name}</p>
                <p className="flex items-center gap-2"><Languages className="h-4 w-4 text-slate-400" /> {talent.languages.join(", ")}</p>
              </div>

              {/* Desktop contact buttons */}
              <div className="mt-5 hidden gap-2 md:grid">
                <a href={`tel:+${toIntl(talent.mobile)}`}><Button full size="lg" icon={<Phone className="h-5 w-5" />}>{t("callTalent")}</Button></a>
                <a href={`https://wa.me/${toIntl(talent.whatsapp)}?text=${waText}`} target="_blank" rel="noreferrer"><Button full size="lg" variant="whatsapp" icon={<MessageCircle className="h-5 w-5" />}>{t("whatsappTalent")}</Button></a>
                <p className="mt-1 text-center text-[11px] text-muted">Direct contact &middot; No sign-in required &middot; Zero commission</p>
              </div>

              <div className="mt-4 flex justify-between text-xs">
                <button onClick={share} className="inline-flex items-center gap-1 font-semibold text-slate-600"><Share2 className="h-3.5 w-3.5" /> {t("share")}</button>
                <button onClick={() => setReportOpen(true)} className="inline-flex items-center gap-1 font-semibold text-rose-600"><Flag className="h-3.5 w-3.5" /> {t("reportProfile")}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: about + videos */}
        <div className="space-y-4">
          <section className="border-b border-line px-1 pb-7 pt-2">
            <h2 className="mb-2 text-lg font-bold">{t("about")}</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{talent.description}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">
              {t("videos")} <span className="text-sm font-medium text-slate-500">({talent.videos.length}/5)</span>
            </h2>
            {talent.videos.length === 0 ? (
              <Empty icon={<Clapperboard className="h-9 w-9" />} title={t("noVideos")} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {talent.videos.map((v) => (
                  <div key={v.videoId} className="relative">
                    {bestVideo?.videoId === v.videoId && (
                      <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-md bg-neon px-2 py-1 text-[10px] font-bold text-canvas shadow">
                        <Star className="h-3 w-3 fill-current" /> Primary showcase
                      </span>
                    )}
                    <YouTubeEmbed videoId={v.videoId} title={v.title} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile sticky contact bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 p-2.5 backdrop-blur-xl md:hidden" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}>
        <div className="mb-1.5 flex items-center justify-center gap-1.5 text-[10px] font-medium text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Direct contact &middot; No sign-in needed</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:+${toIntl(talent.mobile)}`}><Button full size="lg" icon={<Phone className="h-5 w-5" />}>{t("callTalent")}</Button></a>
          <a href={`https://wa.me/${toIntl(talent.whatsapp)}?text=${waText}`} target="_blank" rel="noreferrer"><Button full size="lg" variant="whatsapp" icon={<MessageCircle className="h-5 w-5" />}>WhatsApp</Button></a>
        </div>
      </div>

      {reportOpen && <ReportDialog talent={talent} reporterUid={user?.uid} onClose={() => setReportOpen(false)} />}

      {/* Floating "Best Video" mini-player (guest flow) */}
      {showFloatingPlayer && bestVideo && (
        <FloatingShowcasePlayer key={bestVideo.videoId} videoId={bestVideo.videoId} title={bestVideo.title} talentName={talent.fullName} />
      )}
    </div>
  );
}

function ReportDialog({ talent, reporterUid, onClose }: { talent: Talent; reporterUid?: string; onClose: () => void }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setBusy(true);
    await dataService.createReport({ id: `rep_${uid()}`, talentId: talent.id, talentName: talent.fullName, reporterUid, reason, details, status: "open", createdAt: new Date().toISOString() });
    setBusy(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-neon" />
            <p className="mt-2 font-bold">Thank you for reporting</p>
            <p className="text-sm text-slate-500">Our team will review this profile.</p>
            <Button className="mt-4" full onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold">Report {talent.fullName}</h3>
            <div className="mt-3 space-y-3">
              <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                {REPORT_REASONS.map((r) => <option key={r}>{r}</option>)}
              </Select>
              <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add details (optional)" className="min-h-[90px]" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="danger" loading={busy} onClick={submit}>Submit report</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

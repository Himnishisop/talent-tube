import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Camera, CheckCircle2, ChevronRight, Globe2, Image as ImageIcon, Loader2, MapPin, Mic2, MonitorPlay, Radio, Search, Sparkles, UserRound, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { useLiveTalents } from "@/hooks/useLiveTalents";
import { dataService, isDemoMode } from "@/services";
import { purchaseAnnualMembership } from "@/services/payments";
import { detectCountry, type GeoResult } from "@/lib/geoip";
import { COUNTRIES, DEFAULT_COUNTRY, getCountry, isValidE164, toE164Digits } from "@/lib/geo";
import { membershipPriceForCountry } from "@/lib/pricing";
import { extractYouTubeId, youtubeThumbnail } from "@/lib/youtube";
import { APP_ICON_URL } from "@/lib/constants";
import type { Talent } from "@/lib/types";
import { Avatar, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { CategoryIcon } from "@/components/CategoryIcon";
import { YouTubeUploader } from "@/components/YouTubeUploader";
import { cn } from "@/utils/cn";

/**
 * MOBILE APP INTERFACE (artists / talents)
 * Route: /#/app
 *
 * A phone-style shell with its own bottom tabs. Registration writes to the
 * same dataService as the web interface, so a new profile shows up on
 * /#/web the moment it is published.
 *
 * Prototype behaviour (demo mode only): profiles are auto-approved after the
 * mock payment so the cross-interface sync can be tested end-to-end. In
 * production the profile stays "pending" until an admin approves it.
 */
export function MobileApp() {
  return (
    <div className="mapp">
      <Routes>
        <Route index element={<AppHome />} />
        <Route path="register" element={<AppRegister />} />
        <Route path="live" element={<AppLive />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
      <AppTabs />
    </div>
  );
}

// ------------------------------------------------------------------ shell
function AppHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mapp-header">
      <img src={APP_ICON_URL} alt="Talent Tube" className="h-11 w-11 rounded-xl object-contain" referrerPolicy="no-referrer" />
      <div className="min-w-0">
        <h1 className="truncate font-display text-lg font-semibold tracking-tight">{title}</h1>
        {sub && <p className="truncate text-[11px] text-muted">{sub}</p>}
      </div>
      <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-neon/30 bg-neon/10 px-2 py-1 text-[10px] font-bold text-neon"><Radio className="h-3 w-3" /> LIVE</span>
    </header>
  );
}

function AppTabs() {
  const { user } = useAuth();
  const [mine, setMine] = useState<Talent | null>(null);
  useEffect(() => {
    if (user) dataService.getTalent(user.uid).then(setMine);
  }, [user]);
  const tabs = [
    { to: "/app", label: "Home", icon: Sparkles },
    { to: "/app/register", label: mine ? "My profile" : "Register", icon: UserRound },
    { to: "/web", label: "Web search", icon: Search },
  ];
  return (
    <nav className="mapp-tabs" aria-label="App navigation">
      {tabs.map((tab) => (
        <Link key={tab.to} to={tab.to} className="mapp-tab">
          <tab.icon className="h-5 w-5" />
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/** Detects the visitor's country from IP and returns the matching price tier. */
function useGeoPricing(override?: string) {
  const [geo, setGeo] = useState<GeoResult | null>(null);
  useEffect(() => {
    let alive = true;
    detectCountry().then((g) => alive && setGeo(g));
    return () => { alive = false; };
  }, []);
  const countryCode = override || geo?.countryCode || DEFAULT_COUNTRY;
  const price = useMemo(() => membershipPriceForCountry(countryCode), [countryCode]);
  return { geo, countryCode, price, detecting: geo === null };
}

function PriceBadge({ price, geo, detecting }: { price: ReturnType<typeof membershipPriceForCountry>; geo: GeoResult | null; detecting: boolean }) {
  return (
    <div className="mapp-price">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Registration fee</p>
        <p className="font-display text-3xl font-semibold text-neon">{detecting ? <Loader2 className="inline h-6 w-6 animate-spin" /> : price.label}<span className="ml-1 text-sm font-medium text-silver">/ year</span></p>
      </div>
      <p className="flex items-center gap-1 text-right text-[11px] text-muted">
        <Globe2 className="h-3.5 w-3.5 shrink-0" />
        {detecting ? "Detecting your location…" : `${geo?.source === "ip" ? "Detected from your IP" : "Estimated from device"}: ${getCountry(geo?.countryCode).name}`}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------- home
function AppHome() {
  const { user } = useAuth();
  const { geo, price, detecting } = useGeoPricing();
  const { all } = useLiveTalents();
  const [mine, setMine] = useState<Talent | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return setMine(null);
    dataService.getTalent(user.uid).then(setMine);
  }, [user, all]);

  return (
    <main className="mapp-screen">
      <AppHeader title="Talent Tube" sub="Artist app" />
      <section className="mapp-hero">
        <p className="section-kicker">For artists & performers</p>
        <h2 className="font-display text-[28px] font-semibold leading-tight tracking-tight">Get discovered.<br /><span className="text-neon">Get booked.</span></h2>
        <p className="mt-2 text-sm text-silver">Create your profile in 2 minutes. Recruiters searching on the web see you instantly.</p>
      </section>

      <PriceBadge price={price} geo={geo} detecting={detecting} />

      {mine ? (
        <Link to="/app/live" className="mapp-card flex items-center gap-3">
          <Avatar src={mine.photoURL} name={mine.fullName} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{mine.fullName}</p>
            <p className="text-xs text-muted">{mine.status === "approved" && mine.subscriptionStatus === "active" ? "Your profile is live" : "Finish setup to go live"}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>
      ) : (
        <Link to="/app/register"><Button full size="lg">Create my profile <ChevronRight className="h-5 w-5" /></Button></Link>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold">Recently joined</h3><span className="text-[11px] text-muted">{all?.length ?? 0} live profiles</span></div>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {(all ?? []).slice(0, 8).map((t) => (
            <Link key={t.id} to={`/talent/${t.id}`} className="mapp-mini">
              <Avatar src={t.photoURL} name={t.fullName} size={56} />
              <p className="mt-2 truncate text-xs font-semibold">{t.fullName.split(" ")[0]}</p>
              <p className="truncate text-[10px] text-muted">{t.city}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-6 text-center text-[11px] text-muted">
        Testing on two devices? Open <Link to="/web" className="font-semibold text-neon">the web search</Link> on your laptop.
      </p>
    </main>
  );
}

// --------------------------------------------------------------- register
interface QuickForm {
  fullName: string;
  categoryId: string;
  subCategory: string;
  phone: string;
  country: string;
  city: string;
  bio: string;
  videoUrl: string;
  photoURL: string;
  photoFile: File | null;
}

const emptyForm: QuickForm = { fullName: "", categoryId: "", subCategory: "", phone: "", country: "", city: "", bio: "", videoUrl: "", photoURL: "", photoFile: null };

function AppRegister() {
  const { user, signUpWithEmail, refreshUser } = useAuth();
  const { categories } = useCategories();
  const navigate = useNavigate();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<QuickForm>(emptyForm);
  const [existing, setExisting] = useState<Talent | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"" | "saving" | "paying">("");
  const [step, setStep] = useState<"form" | "pay">("form");

  const { geo, countryCode, price, detecting } = useGeoPricing(form.country || undefined);
  const country = getCountry(countryCode);
  const selectedCat = categories.find((c) => c.id === form.categoryId);
  const videoId = extractYouTubeId(form.videoUrl);

  // Pre-fill from an existing profile (editing)
  useEffect(() => {
    if (!user) return;
    dataService.getTalent(user.uid).then((t) => {
      if (!t) return;
      setExisting(t);
      const dial = getCountry(t.country).dialCode;
      setForm({
        fullName: t.fullName, categoryId: t.categoryId, subCategory: t.subCategory,
        phone: dial && t.mobile.startsWith(dial) ? t.mobile.slice(dial.length) : t.mobile,
        country: t.country, city: t.city, bio: t.description, videoUrl: t.videos[0]?.url ?? "", photoURL: t.photoURL ?? "", photoFile: null,
      });
    });
  }, [user]);

  // Once IP detection finishes, default the country field (user can change it)
  useEffect(() => {
    if (geo && !form.country && !existing) setForm((f) => ({ ...f, country: geo.countryCode, city: geo.city ?? "" }));
  }, [geo, existing, form.country]);

  const up = (patch: Partial<QuickForm>) => setForm((f) => ({ ...f, ...patch }));

  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return alert("Please choose an image.");
    if (f.size > 5 * 1024 * 1024) return alert("Photo must be under 5 MB.");
    up({ photoFile: f, photoURL: URL.createObjectURL(f) });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.fullName.trim().length < 2) e.fullName = "Enter your name";
    if (!form.categoryId) e.categoryId = "Pick a category";
    if (!isValidE164(toE164Digits(form.phone, country.dialCode))) e.phone = "Enter a valid phone number";
    if (!form.city.trim()) e.city = "Enter your city";
    if (form.videoUrl.trim() && !videoId) e.videoUrl = "Paste a valid YouTube link";
    if (!form.photoURL) e.photo = "Add a profile photo";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /** Save the profile to the shared database (visible on web after payment/approval). */
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy("saving");
    try {
      // Prototype: create a lightweight account automatically so artists
      // aren't blocked by a login screen on first use.
      let me = user;
      if (!me) {
        if (!isDemoMode) {
          // Real backend: the artist needs a real account (Google or email) so they can log back in.
          navigate("/login", { state: { from: "/app/register", role: "talent", mode: "signup" } });
          return;
        }
        const slug = form.fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".");
        me = await signUpWithEmail(`${slug}.${Date.now().toString(36)}@app.talenttube.demo`, `tt-${Date.now()}`, form.fullName.trim(), "talent");
      }
      let photoURL = form.photoURL;
      if (form.photoFile) photoURL = await dataService.uploadProfilePhoto(me.uid, form.photoFile);

      const now = new Date().toISOString();
      const mobile = toE164Digits(form.phone, country.dialCode);
      const talent: Talent = {
        id: me.uid, uid: me.uid,
        fullName: form.fullName.trim(), mobile, whatsapp: mobile, photoURL: photoURL || undefined,
        country: countryCode, state: country.regions ? Object.keys(country.regions).find((r) => country.regions![r].includes(form.city)) ?? country.regionLabel : country.regionLabel,
        city: form.city.trim(),
        categoryId: form.categoryId, subCategory: form.subCategory || selectedCat?.subCategories[0] || "General",
        experienceYears: existing?.experienceYears ?? 1,
        description: form.bio.trim() || `${form.fullName.trim()} · ${selectedCat?.name ?? "Artist"} based in ${form.city.trim()}.`,
        languages: existing?.languages ?? ["English"],
        videos: videoId ? [{ videoId, url: form.videoUrl.trim(), isBest: true }] : [],
        status: existing?.status === "suspended" ? "suspended" : "approved", verified: existing?.verified ?? true, featured: existing?.featured ?? false,
        subscriptionStatus: "active",
        subscriptionStartDate: existing?.subscriptionStartDate ?? now,
        subscriptionExpiryDate: existing?.subscriptionExpiryDate ?? new Date(Date.now() + 365 * 86400000).toISOString(),
        paymentId: existing?.paymentId ?? "membership_active",
        registrationComplete: true, createdAt: existing?.createdAt ?? now, updatedAt: now,
      };
      await dataService.saveTalent(talent);
      if (me.role !== "talent" && me.role !== "admin") { await dataService.saveUser({ ...me, role: "talent", phone: mobile }); await refreshUser(); }
      setExisting(talent);
      navigate("/app/live");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy("");
    }
  };

  /** Mock/real checkout → activates membership → profile becomes searchable. */
  const pay = async () => {
    if (!existing) return;
    setBusy("paying");
    const res = await purchaseAnnualMembership(existing);
    if (res.success && res.talent) {
      // PROTOTYPE ONLY: auto-approve in demo mode so the web search updates instantly.
      if (isDemoMode && res.talent.status !== "approved") {
        await dataService.updateTalent(res.talent.id, { status: "approved" });
      }
      navigate("/app/live");
    } else if (res.error) {
      alert(res.error);
    }
    setBusy("");
  };

  if (step === "pay" && existing) {
    return (
      <main className="mapp-screen">
        <AppHeader title="Go live" sub="One last step" />
        <div className="mapp-card text-center">
          <Avatar src={existing.photoURL} name={existing.fullName} size={72} className="mx-auto" />
          <h2 className="mt-3 font-display text-xl font-semibold">{existing.fullName}</h2>
          <p className="text-sm text-muted">{selectedCat?.name} · {existing.city}, {getCountry(existing.country).name}</p>
        </div>
        <PriceBadge price={price} geo={geo} detecting={detecting} />
        <ul className="mapp-card space-y-2 text-sm text-silver">
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-neon" /> Listed on the web search, worldwide</li>
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-neon" /> Direct call & WhatsApp from recruiters</li>
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-neon" /> No commission on bookings</li>
        </ul>
        <Button full size="lg" loading={busy === "paying"} onClick={pay} icon={<Wallet className="h-5 w-5" />}>Pay {price.label} & go live</Button>
        <button className="mt-3 w-full text-center text-xs text-muted" onClick={() => setStep("form")}>Edit details</button>
        {isDemoMode && <p className="mt-4 text-center text-[10px] leading-relaxed text-muted">Prototype: payment is simulated and the profile is auto-approved so you can watch it appear on the web interface immediately.</p>}
      </main>
    );
  }

  return (
    <main className="mapp-screen">
      <AppHeader title={existing ? "Edit profile" : "Create profile"} sub="Takes about 2 minutes" />
      <PriceBadge price={price} geo={geo} detecting={detecting} />

      <form onSubmit={save} className="space-y-4">
        {/* Photo */}
        <div className="mapp-card">
          <div className="flex items-center gap-4">
            <Avatar src={form.photoURL} name={form.fullName || "T T"} size={72} />
            <div className="flex-1">
              <p className="text-sm font-semibold">Profile photo</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" icon={<ImageIcon className="h-4 w-4" />} onClick={() => galleryRef.current?.click()}>Gallery</Button>
                <Button type="button" size="sm" variant="outline" icon={<Camera className="h-4 w-4" />} onClick={() => cameraRef.current?.click()}>Camera</Button>
              </div>
              {errors.photo && <p className="mt-1 text-xs text-rose-300">{errors.photo}</p>}
            </div>
          </div>
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onPhoto} />
        </div>

        <Field label="Your name" required error={errors.fullName}>
          <Input value={form.fullName} onChange={(e) => up({ fullName: e.target.value })} placeholder="Stage name or full name" autoComplete="name" error={!!errors.fullName} />
        </Field>

        <Field label="Category" required error={errors.categoryId}>
          <div className="grid grid-cols-3 gap-2">
            {categories.slice(0, 9).map((c) => (
              <button key={c.id} type="button" onClick={() => up({ categoryId: c.id, subCategory: "" })} className={cn("mapp-chip", form.categoryId === c.id && "mapp-chip--on")}>
                <CategoryIcon id={c.id} iconKey={c.icon} className="h-5 w-5" />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
          <Select className="mt-2" value={form.categoryId} onChange={(e) => up({ categoryId: e.target.value, subCategory: "" })} aria-label="All categories">
            <option value="">More categories…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>

        {selectedCat && (
          <Field label="Specialty">
            <Select value={form.subCategory} onChange={(e) => up({ subCategory: e.target.value })}>
              <option value="">Choose (optional)</option>
              {selectedCat.subCategories.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Country" required>
            <Select value={form.country || countryCode} onChange={(e) => up({ country: e.target.value })}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="City" required error={errors.city}>
            <Input value={form.city} onChange={(e) => up({ city: e.target.value })} placeholder="City" error={!!errors.city} />
          </Field>
        </div>

        <Field label="Phone / WhatsApp" required error={errors.phone}>
          <div className="flex">
            <span className="flex h-12 shrink-0 items-center rounded-l-lg border border-r-0 border-line bg-panel-raised px-3 text-sm font-semibold text-silver">{country.dialCode ? `+${country.dialCode}` : "+"}</span>
            <Input value={form.phone} onChange={(e) => up({ phone: e.target.value.replace(/[^\d\s()-]/g, "") })} inputMode="tel" className="rounded-l-none" error={!!errors.phone} />
          </div>
        </Field>

        <Field label="Showreel video" hint="Paste a YouTube link, or upload a video from your phone to your own YouTube channel below." error={errors.videoUrl}>
          <div className="flex gap-2">
            {videoId && <img src={youtubeThumbnail(videoId, "mq")} alt="" className="h-12 w-20 shrink-0 rounded-md object-cover" />}
            <Input value={form.videoUrl} onChange={(e) => up({ videoUrl: e.target.value })} placeholder="https://youtu.be/…" inputMode="url" error={!!errors.videoUrl} />
          </div>
        </Field>
        <YouTubeUploader compact onUploaded={(url) => up({ videoUrl: url })} />

        <Field label="Short bio" hint="Optional">
          <Textarea value={form.bio} onChange={(e) => up({ bio: e.target.value.slice(0, 300) })} className="min-h-[80px]" placeholder="What you do, events you've performed at…" />
        </Field>

        <Button type="submit" full size="lg" loading={busy === "saving"}>
          {existing?.subscriptionStatus === "active" ? "Save changes" : `Continue · ${price.label}`} <ChevronRight className="h-5 w-5" />
        </Button>
      </form>
    </main>
  );
}

// ------------------------------------------------------------------- live
function AppLive() {
  const { user } = useAuth();
  const { all } = useLiveTalents();
  const [mine, setMine] = useState<Talent | null | undefined>(undefined);
  useEffect(() => {
    if (!user) return setMine(null);
    dataService.getTalent(user.uid).then(setMine);
  }, [user, all]);

  if (mine === undefined) return <main className="mapp-screen"><AppHeader title="Your profile" /><Loader2 className="mx-auto mt-16 h-8 w-8 animate-spin text-neon" /></main>;
  if (!mine) return <Navigate to="/app/register" replace />;

  const live = mine.status === "approved" && mine.subscriptionStatus === "active";
  const cat = getCountry(mine.country);

  return (
    <main className="mapp-screen">
      <AppHeader title="Your profile" sub={live ? "Visible to recruiters" : "Pending"} />
      <div className={cn("mapp-card text-center", live && "border-neon/40")}>
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-neon/15 text-neon"><CheckCircle2 className="h-7 w-7" /></div>
        <h2 className="font-display text-2xl font-semibold">{live ? "You're live!" : "Almost there"}</h2>
        <p className="mt-1 text-sm text-silver">{live ? "Your profile is now on the web search. Recruiters can find and contact you." : "Complete payment to publish your profile."}</p>
      </div>

      <div className="mapp-card flex items-center gap-3">
        <Avatar src={mine.photoURL} name={mine.fullName} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{mine.fullName}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted"><MapPin className="h-3 w-3" /> {mine.city}, {cat.name}</p>
        </div>
        {mine.videos[0] && <MonitorPlay className="h-5 w-5 text-neon" />}
      </div>

      <div className="grid gap-2">
        <Link to={`/talent/${mine.id}`}><Button full variant="outline" icon={<UserRound className="h-4 w-4" />}>Preview public profile</Button></Link>
        <Link to="/web"><Button full variant="outline" icon={<Search className="h-4 w-4" />}>See yourself on the web search</Button></Link>
        <Link to="/app/register"><Button full variant="ghost" icon={<Mic2 className="h-4 w-4" />}>Edit profile</Button></Link>
      </div>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
        Open <span className="font-semibold text-silver">/#/web</span> on another tab or your laptop – your card is already there.
      </p>
    </main>
  );
}

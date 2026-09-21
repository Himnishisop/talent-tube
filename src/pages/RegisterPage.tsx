import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Camera, Image as ImageIcon, Plus, Trash2, CheckCircle2, Star, MonitorPlay as Youtube } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { useCategories } from "@/hooks/useCategories";
import { dataService } from "@/services";
import { extractYouTubeId, youtubeThumbnail } from "@/lib/youtube";
import { LANGUAGES } from "@/lib/constants";
import { COUNTRIES, DEFAULT_COUNTRY, citiesOf, getCountry, isValidE164, regionNames, toE164Digits } from "@/lib/geo";
import { MAX_VIDEOS, type Talent } from "@/lib/types";
import { Avatar, Button, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { cn } from "@/utils/cn";
import { CategoryIcon } from "@/components/CategoryIcon";
import { SubCategoryOptions } from "@/components/SubCategoryOptions";
import { YouTubeUploader } from "@/components/YouTubeUploader";

interface FormState {
  fullName: string;
  mobile: string;
  whatsapp: string;
  sameWhatsapp: boolean;
  email: string;
  photoURL: string;
  photoFile: File | null;
  country: string;
  state: string;
  customState: string;
  city: string;
  customCity: string;
  categoryId: string;
  subCategory: string;
  experienceYears: string;
  languages: string[];
  description: string;
  videoUrls: string[];
  /** Index into videoUrls of the "Primary Showcase Video". */
  bestVideoIndex: number;
}

const empty: FormState = {
  fullName: "", mobile: "", whatsapp: "", sameWhatsapp: true, email: "", photoURL: "", photoFile: null,
  country: DEFAULT_COUNTRY, state: "", customState: "", city: "", customCity: "", categoryId: "", subCategory: "", experienceYears: "1", languages: ["English"],
  description: "", videoUrls: [""], bestVideoIndex: 0,
};

/** Strip the country code from a stored E.164 number for editing. */
const localPart = (e164: string, dialCode: string) => (dialCode && e164.startsWith(dialCode) ? e164.slice(dialCode.length) : e164);

export function RegisterPage() {
  const { user, loading, refreshUser } = useAuth();
  const { t } = useLang();
  const { categories } = useCategories();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [existing, setExisting] = useState<Talent | null | undefined>(undefined);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Load existing profile for editing
  useEffect(() => {
    if (!user) return;
    dataService.getTalent(user.uid).then((tal) => {
      setExisting(tal);
      if (tal) {
        const country = tal.country || DEFAULT_COUNTRY;
        const dial = getCountry(country).dialCode;
        const hasRegions = regionNames(country).length > 0;
        const knownState = hasRegions && regionNames(country).includes(tal.state);
        const knownCity = knownState && citiesOf(country, tal.state).includes(tal.city);
        setForm({
          fullName: tal.fullName, mobile: localPart(tal.mobile, dial), whatsapp: localPart(tal.whatsapp, dial), sameWhatsapp: tal.mobile === tal.whatsapp,
          email: tal.email ?? "", photoURL: tal.photoURL ?? "", photoFile: null,
          country,
          state: hasRegions ? (knownState ? tal.state : "__other") : tal.state, customState: hasRegions && !knownState ? tal.state : "",
          city: knownCity ? tal.city : hasRegions && knownState ? "__other" : tal.city, customCity: knownCity ? "" : tal.city,
          categoryId: tal.categoryId, subCategory: tal.subCategory, experienceYears: String(tal.experienceYears),
          languages: tal.languages, description: tal.description,
          videoUrls: tal.videos.length ? tal.videos.map((v) => v.url) : [""],
          bestVideoIndex: Math.max(0, tal.videos.findIndex((v) => v.isBest)),
        });
      } else if (user) {
        setForm((prev) => ({
          ...prev,
          fullName: user.displayName || prev.fullName,
          email: user.email || prev.email,
          photoURL: user.photoURL || prev.photoURL,
        }));
      }
    });
  }, [user]);

  const selectedCat = useMemo(() => categories.find((c) => c.id === form.categoryId), [categories, form.categoryId]);
  const steps = [t("basicInfo"), t("location"), t("talentDetails"), t("yourVideos")];

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: "/register", role: "talent", mode: "signup" }} replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (existing === undefined) return <Spinner label={t("loading")} />;

  const up = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const onPhotoPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    // Reset so picking the same file again (or switching camera ↔ gallery) still fires onChange.
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return alert("Please select an image file (JPG, PNG, HEIC).");
    if (f.size > 5 * 1024 * 1024) return alert("Photo must be under 5 MB");
    up({ photoFile: f, photoURL: URL.createObjectURL(f) });
  };

  const country = getCountry(form.country);
  const dial = country.dialCode;
  const hasRegions = regionNames(form.country).length > 0;
  const regionOptions = regionNames(form.country);
  const cityOptions = form.state !== "__other" ? citiesOf(form.country, form.state) : [];
  const phoneOk = (v: string) => isValidE164(toE164Digits(v, dial));

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.fullName.trim()) e.fullName = t("requiredField");
      if (!phoneOk(form.mobile)) e.mobile = t("invalidMobile");
      if (!form.sameWhatsapp && !phoneOk(form.whatsapp)) e.whatsapp = t("invalidMobile");
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    }
    if (s === 1) {
      if (!form.country) e.country = t("requiredField");
      if (!form.state.trim()) e.state = t("requiredField");
      if (form.state === "__other" && !form.customState.trim()) e.customState = t("requiredField");
      if (!form.city.trim()) e.city = t("requiredField");
      if (form.city === "__other" && !form.customCity.trim()) e.customCity = t("requiredField");
    }
    if (s === 2) {
      if (!form.categoryId) e.categoryId = t("requiredField");
      if (!form.subCategory) e.subCategory = t("requiredField");
      if (form.description.trim().length < 30) e.description = "Please write at least 30 characters";
      if (form.languages.length === 0) e.languages = t("requiredField");
    }
    if (s === 3) {
      const filled = form.videoUrls.filter((u) => u.trim());
      filled.forEach((u) => {
        if (!extractYouTubeId(u)) e[`video_${form.videoUrls.indexOf(u)}`] = t("invalidYoutube");
      });
      const ids = filled.map(extractYouTubeId);
      if (new Set(ids).size !== ids.length) e.videos = "Duplicate videos are not allowed";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate(step) && setStep((s) => Math.min(s + 1, 3));

  const submit = async () => {
    if (!validate(3)) return;
    setBusy(true);
    try {
      let photoURL = form.photoURL;
      if (form.photoFile) photoURL = await dataService.uploadProfilePhoto(user.uid, form.photoFile);

      const bestUrl = form.videoUrls[form.bestVideoIndex]?.trim();
      const videos = form.videoUrls
        .map((u) => u.trim())
        .filter(Boolean)
        .slice(0, MAX_VIDEOS)
        .map((url, i, arr) => ({
          videoId: extractYouTubeId(url)!,
          url,
          // Exactly one primary showcase: the chosen one, or the first if the chosen row was emptied.
          isBest: bestUrl && arr.includes(bestUrl) ? url === bestUrl : i === 0,
        }));

      const now = new Date().toISOString();
      const talent: Talent = {
        id: user.uid,
        uid: user.uid,
        fullName: form.fullName.trim(),
        mobile: toE164Digits(form.mobile, dial),
        whatsapp: form.sameWhatsapp ? toE164Digits(form.mobile, dial) : toE164Digits(form.whatsapp, dial),
        email: form.email.trim() || undefined,
        photoURL: photoURL || undefined,
        country: form.country,
        state: (form.state === "__other" ? form.customState : form.state).trim(),
        city: (form.city === "__other" ? form.customCity : form.city).trim(),
        categoryId: form.categoryId,
        subCategory: form.subCategory,
        experienceYears: Number(form.experienceYears) || 0,
        description: form.description.trim(),
        languages: form.languages,
        videos,
        status: existing?.status === "suspended" ? "suspended" : "approved",
        verified: existing?.verified ?? true,
        featured: existing?.featured ?? false,
        rejectionReason: undefined,
        subscriptionStatus: "active",
        subscriptionStartDate: existing?.subscriptionStartDate ?? now,
        subscriptionExpiryDate: existing?.subscriptionExpiryDate ?? new Date(Date.now() + 365 * 86400000).toISOString(),
        paymentId: existing?.paymentId ?? "membership_active",
        registrationComplete: true,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await dataService.saveTalent(talent);

      if (user.role !== "talent") {
        await dataService.saveUser({ ...user, role: "talent", phone: talent.mobile });
        await refreshUser();
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <h1 className="text-2xl font-extrabold">{existing ? t("editProfile") : t("talentRegistration")}</h1>
      <p className="text-sm text-slate-500">
        {t("step")} {step + 1} {t("of")} {steps.length} · {steps[step]}
      </p>

      {/* Stepper */}
      <div className="mt-4 flex gap-1.5">
        {steps.map((s, i) => (
          <button key={s} onClick={() => i < step && setStep(i)} className={cn("h-1.5 flex-1 rounded-full transition", i <= step ? "bg-neon" : "bg-line")} aria-label={s} />
        ))}
      </div>

      <div className="mt-5 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        {step === 0 && (
          <>
            <div className="flex items-center gap-4">
              <Avatar src={form.photoURL} name={form.fullName || "T T"} size={80} />
              <div>
                {/* Gallery picker: no `capture` attribute, so phones offer Photos / Files / Camera */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhotoPicked}
                />
                {/* Camera picker: opens the front camera directly on mobile */}
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={onPhotoPicked}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" icon={<ImageIcon className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
                    {form.photoURL ? t("changePhoto") : "Choose from gallery"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" icon={<Camera className="h-4 w-4" />} onClick={() => cameraRef.current?.click()}>
                    Take a photo
                  </Button>
                </div>
                <p className="mt-1 text-xs text-slate-500">{t("profilePhoto")} · JPG/PNG, max 5 MB</p>
              </div>
            </div>
            <Field label={t("fullName")} required error={errors.fullName}>
              <Input value={form.fullName} onChange={(e) => up({ fullName: e.target.value })} autoComplete="name" error={!!errors.fullName} />
            </Field>
            <Field label="Country" required error={errors.country} hint="Sets your phone country code, location options and membership currency.">
              <Select value={form.country} onChange={(e) => up({ country: e.target.value, state: "", customState: "", city: "", customCity: "" })} autoComplete="country">
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}{c.dialCode ? ` (+${c.dialCode})` : ""}</option>)}
              </Select>
            </Field>
            <Field label={t("mobileNumber")} required error={errors.mobile} hint="Enter your number without the country code.">
              <div className="flex">
                <span className="flex h-12 shrink-0 items-center rounded-l-lg border border-r-0 border-line bg-panel-raised px-3 text-sm font-semibold text-silver">{dial ? `+${dial}` : "+"}</span>
                <Input value={form.mobile} onChange={(e) => up({ mobile: e.target.value.replace(/[^\d+\s()-]/g, "").slice(0, 18) })} inputMode="tel" autoComplete="tel-national" className="rounded-l-none" error={!!errors.mobile} />
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.sameWhatsapp} onChange={(e) => up({ sameWhatsapp: e.target.checked })} className="h-5 w-5 accent-brand-600" />
              {t("whatsappNumber")}: {t("sameAsMobile")}
            </label>
            {!form.sameWhatsapp && (
              <Field label={t("whatsappNumber")} required error={errors.whatsapp}>
                <div className="flex">
                  <span className="flex h-12 shrink-0 items-center rounded-l-lg border border-r-0 border-line bg-panel-raised px-3 text-sm font-semibold text-silver">{dial ? `+${dial}` : "+"}</span>
                  <Input value={form.whatsapp} onChange={(e) => up({ whatsapp: e.target.value.replace(/[^\d+\s()-]/g, "").slice(0, 18) })} inputMode="tel" className="rounded-l-none" error={!!errors.whatsapp} />
                </div>
              </Field>
            )}
            <Field label={t("emailOptional")} error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => up({ email: e.target.value })} inputMode="email" error={!!errors.email} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Country" required error={errors.country}>
              <Select value={form.country} onChange={(e) => up({ country: e.target.value, state: "", customState: "", city: "", customCity: "" })} error={!!errors.country}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </Select>
            </Field>
            {hasRegions ? (
              <>
                <Field label={country.regionLabel} required error={errors.state}>
                  <Select value={form.state} onChange={(e) => up({ state: e.target.value, city: "", customCity: "" })} error={!!errors.state}>
                    <option value="">Select {country.regionLabel.toLowerCase()}</option>
                    {regionOptions.map((s) => <option key={s}>{s}</option>)}
                    <option value="__other">Other {country.regionLabel.toLowerCase()}…</option>
                  </Select>
                </Field>
                {form.state === "__other" && (
                  <Field label={`Enter your ${country.regionLabel.toLowerCase()}`} required error={errors.customState}>
                    <Input value={form.customState} onChange={(e) => up({ customState: e.target.value })} error={!!errors.customState} />
                  </Field>
                )}
                {form.state && form.state !== "__other" ? (
                  <Field label={t("city")} required error={errors.city}>
                    <Select value={form.city} onChange={(e) => up({ city: e.target.value })} error={!!errors.city}>
                      <option value="">{t("selectCity")}</option>
                      {cityOptions.map((c) => <option key={c}>{c}</option>)}
                      <option value="__other">Other city…</option>
                    </Select>
                  </Field>
                ) : form.state === "__other" ? (
                  <Field label={t("city")} required error={errors.city}>
                    <Input value={form.city === "__other" ? "" : form.city} onChange={(e) => up({ city: e.target.value })} error={!!errors.city} />
                  </Field>
                ) : null}
                {form.city === "__other" && (
                  <Field label="Enter your city" required error={errors.customCity}>
                    <Input value={form.customCity} onChange={(e) => up({ customCity: e.target.value })} error={!!errors.customCity} />
                  </Field>
                )}
              </>
            ) : (
              <>
                <Field label={country.regionLabel} required error={errors.state}>
                  <Input value={form.state} onChange={(e) => up({ state: e.target.value })} placeholder={`e.g. your ${country.regionLabel.toLowerCase()}`} error={!!errors.state} />
                </Field>
                <Field label={t("city")} required error={errors.city}>
                  <Input value={form.city} onChange={(e) => up({ city: e.target.value })} autoComplete="address-level2" error={!!errors.city} />
                </Field>
              </>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Field label={t("category")} required error={errors.categoryId}>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => up({ categoryId: c.id, subCategory: "" })}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-center text-[11px] font-semibold leading-tight transition",
                      form.categoryId === c.id ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-600"
                    )}
                  >
                    <CategoryIcon id={c.id} iconKey={c.icon} className="h-6 w-6" />
                    {c.name}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t("subCategory")} required error={errors.subCategory}>
              <Select value={form.subCategory} onChange={(e) => up({ subCategory: e.target.value })} disabled={!selectedCat} error={!!errors.subCategory}>
                <option value="">{t("subCategory")}</option>
                {selectedCat && <SubCategoryOptions subCategories={selectedCat.subCategories} />}
              </Select>
            </Field>
            <Field label={t("yearsOfExperience")} required>
              <Select value={form.experienceYears} onChange={(e) => up({ experienceYears: e.target.value })}>
                {Array.from({ length: 31 }, (_, i) => <option key={i} value={i}>{i === 0 ? "Less than 1 year" : `${i}${i === 30 ? "+" : ""} ${t("years")}`}</option>)}
              </Select>
            </Field>
            <Field label={t("languages")} required error={errors.languages}>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => {
                  const on = form.languages.includes(l);
                  return (
                    <button key={l} type="button" aria-pressed={on} onClick={() => up({ languages: on ? form.languages.filter((x) => x !== l) : [...form.languages, l] })} className={cn("min-h-10 rounded-lg border px-3 py-1.5 text-sm font-medium transition", on ? "border-neon bg-neon text-canvas" : "border-line bg-field text-silver")}>
                      {l}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label={t("shortDescription")} required hint={t("descriptionHint")} error={errors.description}>
              <Textarea value={form.description} onChange={(e) => up({ description: e.target.value.slice(0, 600) })} maxLength={600} error={!!errors.description} />
              <span className="mt-1 block text-right text-xs text-slate-400">{form.description.length}/600</span>
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-900">
              <p className="flex items-center gap-2 font-bold"><Youtube className="h-5 w-5" /> {t("youtubeUrls")}</p>
              <p className="mt-1 text-xs">{t("youtubeHint")}</p>
            </div>
            {errors.videos && <p className="text-sm font-medium text-rose-600">{errors.videos}</p>}
            <p className="flex items-center gap-2 text-xs text-muted"><Star className="h-3.5 w-3.5 text-neon" /> Tap the star to choose your <b className="text-silver">Primary Showcase Video</b>. It auto-plays in a mini-player when people open your profile.</p>
            {form.videoUrls.map((url, i) => {
              const id = extractYouTubeId(url);
              const isBest = form.bestVideoIndex === i;
              return (
                <div key={i} className={cn("flex gap-2 rounded-xl p-2 transition", isBest && id && "bg-neon/5 ring-1 ring-neon/40")}>
                  <button
                    type="button"
                    onClick={() => id && up({ bestVideoIndex: i })}
                    disabled={!id}
                    aria-pressed={isBest}
                    aria-label={isBest ? "Primary showcase video" : "Set as primary showcase video"}
                    title={isBest ? "Primary showcase video" : "Set as primary showcase"}
                    className={cn("relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 disabled:cursor-not-allowed", isBest && id && "ring-2 ring-neon")}
                  >
                    {id && <img src={youtubeThumbnail(id, "mq")} alt="" className="h-full w-full object-cover" />}
                    <span className={cn("absolute bottom-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full", isBest && id ? "bg-neon text-canvas" : "bg-black/60 text-white")}>
                      <Star className={cn("h-3.5 w-3.5", isBest && id && "fill-current")} />
                    </span>
                  </button>
                  <div className="flex-1">
                    <Input
                      value={url}
                      onChange={(e) => up({ videoUrls: form.videoUrls.map((u, j) => (j === i ? e.target.value : u)) })}
                      placeholder="https://youtu.be/…"
                      inputMode="url"
                      error={!!errors[`video_${i}`] || (!!url.trim() && !id)}
                    />
                    {url.trim() && !id && <span className="text-xs text-rose-600">{t("invalidYoutube")}</span>}
                    {id && <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> {isBest ? "Primary showcase" : `Video ID: ${id}`}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = form.videoUrls.length === 1 ? [""] : form.videoUrls.filter((_, j) => j !== i);
                      const best = form.bestVideoIndex === i ? 0 : form.bestVideoIndex > i ? form.bestVideoIndex - 1 : form.bestVideoIndex;
                      up({ videoUrls: next, bestVideoIndex: Math.min(best, next.length - 1) });
                    }}
                    className="self-start rounded-lg p-3 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
            {form.videoUrls.length < MAX_VIDEOS && (
              <Button type="button" variant="outline" full icon={<Plus className="h-4 w-4" />} onClick={() => up({ videoUrls: [...form.videoUrls, ""] })}>
                {t("addVideo")} ({form.videoUrls.length}/{MAX_VIDEOS})
              </Button>
            )}

            {/* Don't have the video on YouTube yet? Upload it to your own channel from here. */}
            <YouTubeUploader
              disabled={form.videoUrls.filter((u) => u.trim()).length >= MAX_VIDEOS}
              onUploaded={(url) => {
                const urls = [...form.videoUrls];
                const empty = urls.findIndex((u) => !u.trim());
                if (empty >= 0) urls[empty] = url; else if (urls.length < MAX_VIDEOS) urls.push(url);
                up({ videoUrls: urls });
              }}
            />
          </>
        )}

        <div className="flex gap-2 pt-2">
          {step > 0 && <Button type="button" variant="outline" size="lg" onClick={() => setStep((s) => s - 1)} className="flex-1">{t("previous")}</Button>}
          {step < 3 ? (
            <Button type="button" size="lg" onClick={next} className="flex-1">{t("next")} →</Button>
          ) : (
            <Button type="button" size="lg" onClick={submit} loading={busy} className="flex-1">{existing ? t("save") : t("completeRegistration")}</Button>
          )}
        </div>
      </div>
    </div>
  );
}

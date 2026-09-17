import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, Radio } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCategories } from "@/hooks/useCategories";
import { useLiveTalents } from "@/hooks/useLiveTalents";
import type { TalentFilters } from "@/lib/types";
import { EXPERIENCE_OPTIONS, LANGUAGES } from "@/lib/constants";
import { COUNTRIES, citiesOf, getCountry, regionNames } from "@/lib/geo";
import { Button, Empty, Input, Select, Spinner } from "@/components/ui";
import { TalentCard } from "@/components/TalentCard";
import { SubCategoryOptions } from "@/components/SubCategoryOptions";

export function SearchPage() {
  const { t } = useLang();
  const { categories, byId } = useCategories();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState(params.get("q") ?? "");

  const filters: TalentFilters = useMemo(
    () => ({
      query: params.get("q") ?? undefined,
      categoryId: params.get("category") ?? undefined,
      subCategory: params.get("sub") ?? undefined,
      country: params.get("country") ?? undefined,
      state: params.get("state") ?? undefined,
      city: params.get("city") ?? undefined,
      minExperience: Number(params.get("exp") ?? 0) || undefined,
      language: params.get("lang") ?? undefined,
    }),
    [params]
  );

  // Live subscription to the shared database – new/updated artists from the
  // App interface appear here without a refresh.
  const { talents, lastUpdate } = useLiveTalents(filters, categories);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (!lastUpdate) return;
    setPulse(true);
    const id = setTimeout(() => setPulse(false), 1200);
    return () => clearTimeout(id);
  }, [lastUpdate]);

  useEffect(() => setQ(params.get("q") ?? ""), [params]);

  const set = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key === "category") p.delete("sub");
    if (key === "country") { p.delete("state"); p.delete("city"); }
    if (key === "state") p.delete("city");
    setParams(p, { replace: true });
  };

  const activeCount = ["category", "sub", "country", "state", "city", "exp", "lang"].filter((k) => params.get(k)).length;
  const selectedCat = filters.categoryId ? byId(filters.categoryId) : undefined;
  const selectedCountry = filters.country ? getCountry(filters.country) : undefined;
  const regionOptions = regionNames(filters.country);
  const cityOptions = citiesOf(filters.country, filters.state);

  const FilterPanel = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Select aria-label="Category" value={filters.categoryId ?? ""} onChange={(e) => set("category", e.target.value)}>
        <option value="">{t("allCategories")}</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select aria-label="Specialty" value={filters.subCategory ?? ""} onChange={(e) => set("sub", e.target.value)} disabled={!selectedCat}>
        <option value="">{t("allSubCategories")}</option>
        {selectedCat && <SubCategoryOptions subCategories={selectedCat.subCategories} />}
      </Select>
      <Select aria-label="Country" value={filters.country ?? ""} onChange={(e) => set("country", e.target.value)}>
        <option value="">All countries</option>
        {COUNTRIES.filter((c) => c.code !== "OTHER").map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
      </Select>
      {regionOptions.length > 0 ? (
        <Select aria-label={selectedCountry?.regionLabel ?? "Region"} value={filters.state ?? ""} onChange={(e) => set("state", e.target.value)}>
          <option value="">All {selectedCountry?.regionLabel.toLowerCase() ?? "region"}s</option>
          {regionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      ) : (
        <Input aria-label="Region" placeholder={selectedCountry ? `${selectedCountry.regionLabel} (optional)` : "Select a country first"} value={filters.state ?? ""} onChange={(e) => set("state", e.target.value)} disabled={!filters.country} />
      )}
      {cityOptions.length > 0 ? (
        <Select aria-label="City" value={filters.city ?? ""} onChange={(e) => set("city", e.target.value)}>
          <option value="">{t("anyCity")}</option>
          {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      ) : (
        <Input aria-label="City" placeholder="City (optional)" value={filters.city ?? ""} onChange={(e) => set("city", e.target.value)} disabled={!filters.country} />
      )}
      <Select aria-label="Minimum experience" value={String(filters.minExperience ?? 0)} onChange={(e) => set("exp", e.target.value === "0" ? "" : e.target.value)}>
        {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <Select aria-label="Spoken language" value={filters.language ?? ""} onChange={(e) => set("lang", e.target.value)}>
        <option value="">{t("anyLanguage")}</option>
        {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
      </Select>
    </div>
  );

  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="section-kicker">The right talent changes everything</p><h1 className="page-title">Find your standout.</h1><p className="mt-3 text-sm leading-relaxed text-muted">Explore creative professionals by skill, location, and experience.</p></div>
        <span className={`live-badge ${pulse ? "live-badge--pulse" : ""}`} title="Connected to the shared database. New artists appear instantly.">
          <Radio className="h-3.5 w-3.5" /> Live
          {lastUpdate && <span className="text-muted">· updated {new Date(lastUpdate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}
        </span>
      </div>
      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          set("q", q.trim());
        }}
        className="flex gap-2"
        role="search"
        aria-label="Search talent profiles"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input type="search" aria-label="Talent name or specialty" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="pl-11" />
        </div>
        <Button type="button" variant="outline" aria-label="Toggle search filters" aria-expanded={showFilters} aria-controls="search-filters" onClick={() => setShowFilters((s) => !s)} icon={<SlidersHorizontal className="h-4 w-4" />} className="relative lg:hidden">
          {activeCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neon text-[10px] font-bold text-canvas">{activeCount}</span>}
        </Button>
        <Button type="submit" className="hidden sm:inline-flex">{t("search")}</Button>
      </form>

      {/* Desktop filters always visible; mobile toggled */}
      <div id="search-filters" className={`mt-4 rounded-xl border border-line bg-panel p-5 lg:block ${showFilters ? "block" : "hidden"}`}>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-800">{t("filters")}</p>
          {activeCount > 0 && (
            <button onClick={() => setParams(q ? { q } : {}, { replace: true })} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
              <X className="h-3.5 w-3.5" /> {t("clearFilters")}
            </button>
          )}
        </div>
        {FilterPanel}
        <Button className="mt-3 lg:hidden" full onClick={() => setShowFilters(false)}>{t("apply")}</Button>
      </div>

      {/* Active chips */}
      {activeCount > 0 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {selectedCat && <Chip label={selectedCat.name} onClear={() => set("category", "")} />}
          {filters.subCategory && <Chip label={filters.subCategory} onClear={() => set("sub", "")} />}
          {selectedCountry && <Chip label={selectedCountry.name} onClear={() => set("country", "")} />}
          {filters.state && <Chip label={filters.state} onClear={() => set("state", "")} />}
          {filters.city && <Chip label={filters.city} onClear={() => set("city", "")} />}
          {filters.minExperience && <Chip label={`${filters.minExperience}+ yrs`} onClear={() => set("exp", "")} />}
          {filters.language && <Chip label={filters.language} onClear={() => set("lang", "")} />}
        </div>
      )}

      {/* Results */}
      <div className="mt-4">
        {talents === null ? (
          <Spinner label={t("loading")} />
        ) : talents.length === 0 ? (
          <Empty title={t("noResults")} action={<Button variant="outline" onClick={() => setParams({}, { replace: true })}>{t("clearFilters")}</Button>} />
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">
              <span className="font-bold text-slate-900">{talents.length}</span> {talents.length === 1 ? "professional found" : t("results")}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {talents.map((tal) => <TalentCard key={tal.id} talent={tal} category={byId(tal.categoryId)} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-800">
      {label}
      <button onClick={onClear} aria-label="Remove filter"><X className="h-3.5 w-3.5" /></button>
    </span>
  );
}

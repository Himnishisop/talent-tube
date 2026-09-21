import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, MapPin, ArrowRight, ArrowUpRight } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useCategories } from "@/hooks/useCategories";
import { useLiveTalents } from "@/hooks/useLiveTalents";
import { APP_ICON_URL } from "@/lib/constants";
import { COUNTRIES, FEATURED_CITIES, citiesOf, getCountry, regionNames } from "@/lib/geo";
import { Button, Input, Select, Spinner } from "@/components/ui";
import { TalentCard } from "@/components/TalentCard";
import { CategoryIcon } from "@/components/CategoryIcon";

export function HomePage() {
  const { t } = useLang();
  const { categories, byId } = useCategories();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [heroCity, setHeroCity] = useState("");
  const homeCountry = country ? getCountry(country) : undefined;
  const regionOptions = regionNames(country);
  const cityOptions = citiesOf(country, state);
  // Live subscription: the moment an artist registers on the App, they appear here.
  const { talents } = useLiveTalents();
  const [params] = useSearchParams();

  useEffect(() => {
    if (params.get("section") !== "how-it-works" || talents === null) return;
    const frame = requestAnimationFrame(() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "instant" }));
    return () => cancelAnimationFrame(frame);
  }, [params, talents]);

  const featured = useMemo(() => talents?.filter((x) => x.featured).slice(0, 3) ?? [], [talents]);
  const recent = useMemo(
    () => [...(talents ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [talents]
  );

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (heroCity) {
      const [cityName, countryCode] = heroCity.split("|");
      p.set("city", cityName);
      if (countryCode) p.set("country", countryCode);
    }
    navigate(`/search?${p.toString()}`);
  };

  const onLocation = (e: FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (country) p.set("country", country);
    if (state.trim()) p.set("state", state.trim());
    if (city.trim()) p.set("city", city.trim());
    navigate(`/search?${p.toString()}`);
  };

  return (
    <div className="home-page">
      <section className="talent-hero" aria-labelledby="hero-title">
        <img src="/images/talent-stage.jpg" alt="A vocalist performing under the stage lights" className="hero-image" width={1376} height={768} fetchPriority="high" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="content-shell relative z-10">
          <div className="hero-copy">
            <div className="hero-reveal">
              <h1 id="hero-title" className="hero-wordmark"><img src={APP_ICON_URL} alt="Talent Tube" className="hero-logo" width={200} height={200} decoding="async" referrerPolicy="no-referrer" /></h1>
              <h2 className="hero-headline">Showcase your talent.<br /><span className="text-neon">Get endless opportunities.</span></h2>
              <p className="hero-description">Discover remarkable performers and creative professionals. Watch their work. Connect directly.</p>
            </div>
            <form onSubmit={onSearch} className="hero-search hero-reveal-delayed" role="search" aria-label="Find talent">
              <label className="hero-query">
                <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Who are you looking for?" aria-label="Talent, category, or specialty" />
              </label>
              <label className="hero-location">
                <MapPin className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <select value={heroCity} onChange={(e) => setHeroCity(e.target.value)} aria-label="Talent location">
                  <option value="">Worldwide</option>
                  {FEATURED_CITIES.map((place) => <option key={`${place.city}|${place.country}`} value={`${place.city}|${place.country}`}>{place.city}, {getCountry(place.country).name}</option>)}
                </select>
              </label>
              <Button type="submit" className="hero-submit">Find talent <ArrowUpRight className="h-4 w-4" /></Button>
            </form>
          </div>
        </div>
      </section>

      <section className="content-shell section-space" aria-labelledby="categories-title">
        <div className="editorial-section-head">
          <h2 id="categories-title" className="section-title">{t("popularCategories")}</h2>
          <Link to="/categories" className="text-link">All categories <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        <div className="category-browse-grid">
          {categories.slice(0, 8).map((category) => (
            <Link key={category.id} to={`/search?category=${category.id}`} className="category-browse-link">
              <CategoryIcon id={category.id} iconKey={category.icon} className="h-7 w-7" />
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="spotlight-section section-space" aria-labelledby="spotlight-title">
        <div className="content-shell">
          <div className="editorial-section-head">
            <div><p className="section-kicker">Meet the standouts</p><h2 id="spotlight-title" className="section-title">{t("featuredTalents")}</h2><p className="section-description">Distinctive skills. Real passion. People worth discovering.</p></div>
            <Link to="/search" className="text-link">Explore talent <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          {talents === null ? <div className="min-h-72"><Spinner label="Finding the standouts..." /></div> : featured.length ? (
            <div className="spotlight-grid">{featured.map((talent) => <TalentCard key={talent.id} talent={talent} category={byId(talent.categoryId)} compact />)}</div>
          ) : <p className="py-8 text-sm text-muted">The next standout is on the way. Explore all talent to discover more.</p>}
        </div>
      </section>

      <section id="how-it-works" className="content-shell section-space scroll-mt-24" aria-labelledby="how-title">
        <div className="editorial-section-head"><div><p className="section-kicker">Less searching. More connecting.</p><h2 id="how-title" className="section-title">A great connection is only three steps away.</h2></div></div>
        <ol className="how-it-works-grid">
          {[
            { title: "Find your match", description: "Explore by skill, specialty, and location to find the right person for your vision." },
            { title: "See the talent", description: "Watch their YouTube showreel and get a feel for their style before reaching out." },
            { title: "Make it happen", description: "Connect directly by phone or WhatsApp. No sign-in needed, no middleman, zero booking fees." },
          ].map((item, index) => <li key={item.title}><span className="step-number">0{index + 1}</span><h3>{item.title}</h3><p>{item.description}</p></li>)}
        </ol>
      </section>

      <section className="location-section" aria-labelledby="location-title">
        <div className="content-shell location-layout">
          <div><p className="section-kicker">Find your local standouts</p><h2 id="location-title" className="section-title">Great talent.<br />Closer than you think.</h2></div>
          <form onSubmit={onLocation} className="location-form">
            <label><span>Country</span><Select value={country} onChange={(e) => { setCountry(e.target.value); setState(""); setCity(""); }}><option value="">All countries</option>{COUNTRIES.filter((c) => c.code !== "OTHER").map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select></label>
            <label><span>{homeCountry?.regionLabel ?? "Region"}</span>{regionOptions.length > 0 ? (
              <Select value={state} onChange={(e) => { setState(e.target.value); setCity(""); }}><option value="">All {homeCountry?.regionLabel.toLowerCase()}s</option>{regionOptions.map((value) => <option key={value}>{value}</option>)}</Select>
            ) : (
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder={country ? "Optional" : "Any"} disabled={!country} />
            )}</label>
            <label><span>City</span>{cityOptions.length > 0 ? (
              <Select value={city} onChange={(e) => setCity(e.target.value)}><option value="">Any city</option>{cityOptions.map((value) => <option key={value}>{value}</option>)}</Select>
            ) : (
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={country ? "Optional" : "Any"} disabled={!country} />
            )}</label>
            <Button type="submit" aria-label="Search talent by location"><Search className="h-5 w-5" /><span className="sm:hidden">Find talent</span></Button>
          </form>
        </div>
      </section>

      <section className="content-shell section-space" aria-labelledby="recent-title">
        <div className="editorial-section-head"><div><h2 id="recent-title" className="section-title">{t("recentlyAdded")}</h2><p className="section-description">New faces. Fresh perspectives. Your next discovery.</p></div><Link to="/search" className="text-link">Meet everyone <ArrowUpRight className="h-4 w-4" /></Link></div>
        {talents === null ? <Spinner /> : <div className="grid gap-4 md:grid-cols-2">{recent.map((talent) => <TalentCard key={talent.id} talent={talent} category={byId(talent.categoryId)} />)}</div>}
      </section>

      <section className="creator-section" aria-labelledby="creator-title">
        <div className="content-shell creator-layout">
          <div><p className="section-kicker">For the ones who create</p><h2 id="creator-title">Your talent deserves<br />an <span className="text-neon">audience.</span></h2><p>{t("joinAsTalentSub")}</p></div>
          <div className="creator-action"><Link to="/register" className="button-primary inline-flex min-h-14 items-center justify-center gap-7 rounded-md px-7 text-sm font-bold">Take the spotlight <ArrowRight className="h-5 w-5" /></Link><p>One simple annual membership, priced in your local currency. No booking commission.</p></div>
        </div>
      </section>
    </div>
  );
}

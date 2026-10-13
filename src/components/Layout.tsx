import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, Search, UserRound, LayoutDashboard, ShieldCheck, LogOut, ArrowUpRight, Info, Building2, Mail } from "lucide-react";
import { cn } from "@/utils/cn";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { isDemoMode } from "@/services";
import { APP_ICON_URL, APP_TAGLINE, LEGAL_ENTITY } from "@/lib/constants";
import { StageLights } from "./StageLights";

export function Logo({ className, size = "header", withTagline = false }: { className?: string; size?: "header" | "footer"; withTagline?: boolean }) {
  return (
    <Link to="/" className={cn("flex min-w-0 shrink items-center gap-3", className)} aria-label="Talent Tube home">
      <img
        src={APP_ICON_URL}
        alt="Talent Tube"
        width={size === "header" ? 64 : 56}
        height={size === "header" ? 64 : 56}
        className={cn("shrink-0 rounded-xl object-contain", size === "header" ? "h-14 w-14 sm:h-16 sm:w-16" : "h-14 w-14")}
        decoding="async"
        referrerPolicy="no-referrer"
      />
      {withTagline && (
        <span className="header-tagline" aria-hidden="true">
          <span>Showcase your talent.</span>
          <span className="text-neon">Get endless opportunities.</span>
        </span>
      )}
    </Link>
  );
}

export function Layout() {
  const { t } = useLang();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");
  const isHome = location.pathname === "/";
  const isTalentProfile = location.pathname.startsWith("/talent/");

  const navItems = [
    { to: "/", label: t("home"), icon: Home, end: true },
    { to: "/categories", label: t("categories"), icon: LayoutGrid },
    { to: "/search", label: t("search"), icon: Search },
    isAdmin
      ? { to: "/admin", label: "Admin", icon: ShieldCheck }
      : user
        ? { to: "/dashboard", label: "Studio", icon: LayoutDashboard }
        : { to: "/register", label: "For Artists", icon: UserRound },
  ];

  return (
    <div className="app-stage flex min-h-screen flex-col">
      <StageLights />
      <a href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById("main-content")?.focus(); }} className="skip-link">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-line/60 bg-canvas/98">
        <div className="content-shell flex h-[76px] items-center justify-between gap-3 sm:h-[84px]">
          <Logo withTagline />
          <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
            <NavLink to="/" end className="desktop-nav-link px-2 py-7 text-[13px] font-medium">Discover talent</NavLink>
            <NavLink to="/categories" className="desktop-nav-link px-2 py-7 text-[13px] font-medium">Categories</NavLink>
            <Link to="/?section=how-it-works" className="desktop-nav-link px-2 py-7 text-[13px] font-medium">How it works</Link>
            <NavLink to="/contact" className="desktop-nav-link px-2 py-7 text-[13px] font-medium">Contact</NavLink>
            {isAdmin && (
              <NavLink to="/admin" className="desktop-nav-link px-3 py-6 text-sm font-medium">
                {t("admin")}
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-3 sm:gap-6">
            {isAdmin && (
              <Link to="/admin" className="hidden text-xs font-semibold text-neon hover:underline sm:inline-flex">
                Admin Panel
              </Link>
            )}
            {user ? (
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
                className="flex h-11 items-center gap-2 text-xs font-semibold text-muted hover:text-heading"
                aria-label={t("logout")}
                title={t("logout")}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("logout")}</span>
              </button>
            ) : (
              <Link to="/login" className="hidden h-11 items-center text-[13px] font-semibold text-silver hover:text-heading sm:flex">
                Artist Login
              </Link>
            )}
            <Link to={user ? "/dashboard" : "/register"} className="button-primary inline-flex h-11 items-center justify-center gap-2 rounded-md px-3 text-[11px] font-bold sm:px-5 sm:text-[13px]">
              <span className="sm:hidden">{user ? "Studio" : "Join as talent"}</span>
              <span className="hidden sm:inline">{user ? "My Creator Profile" : "Join as talent"}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className={cn("w-full flex-1 outline-none", !isHome && "content-shell py-8 sm:py-12")}>
        <Outlet />
      </main>

      <footer className="border-t border-line/70 bg-canvas pb-24 pt-10 text-xs text-muted lg:pb-8">
        <div className="content-shell">
          {/* Top Footer Section: Brand and Navigation */}
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
            <div className="max-w-sm">
              <Logo size="footer" />
              <p className="mt-3 leading-relaxed text-silver">{APP_TAGLINE}</p>
              <p className="mt-2 text-[11px] text-muted">
                Direct connections between performers and clients with 0% booking commission.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-6 sm:gap-x-14">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-heading">Explore</p>
                <nav aria-label="Footer explore navigation" className="mt-3 flex flex-col space-y-2">
                  <Link to="/search" className="hover:text-neon">Find talent</Link>
                  <Link to="/categories" className="hover:text-neon">Categories</Link>
                  <Link to="/register" className="hover:text-neon">Join as talent</Link>
                  <Link to="/prototype" className="hover:text-neon">App prototype</Link>
                </nav>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-heading">Legal &amp; Policy</p>
                <nav aria-label="Footer legal navigation" className="mt-3 flex flex-col space-y-2">
                  <Link to="/privacy" className="font-medium text-silver hover:text-neon">Privacy Policy</Link>
                  <Link to="/terms" className="font-medium text-silver hover:text-neon">Terms of Service</Link>
                  <Link to="/contact" className="font-medium text-silver hover:text-neon">Contact Us</Link>
                  <Link to="/admin/login" className="inline-flex items-center gap-1 text-muted hover:text-neon">
                    <ShieldCheck className="h-3.5 w-3.5" /> Admin
                  </Link>
                </nav>
              </div>
            </div>
          </div>

          {/* Official Business Entity & Corporate Registration (Matches Aadhaar Udyam Certificate) */}
          <div className="mt-8 rounded-xl border border-line/80 bg-panel/60 p-4 sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-neon/40 bg-neon/10 px-2 py-0.5 text-[11px] font-bold text-neon">
                    <Building2 className="h-3 w-3" />
                    <span>Business Entity: {LEGAL_ENTITY.businessName}</span>
                  </span>
                  <span className="text-[11px] text-muted">({LEGAL_ENTITY.certificateType})</span>
                </div>
                <p className="text-xs font-medium text-silver">
                  <strong className="text-heading">Corporate Address:</strong> {LEGAL_ENTITY.registeredAddress}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-4 text-xs">
                <a
                  href={`mailto:${LEGAL_ENTITY.email}`}
                  className="inline-flex items-center gap-1.5 font-bold text-neon hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{LEGAL_ENTITY.email}</span>
                </a>
                <Link
                  to="/contact"
                  className="rounded-lg border border-line bg-panel-raised px-3 py-1.5 text-xs font-semibold text-silver hover:border-silver hover:text-heading"
                >
                  Contact Office
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="mt-6 flex flex-col justify-between gap-3 border-t border-line/60 pt-5 text-[11px] sm:flex-row sm:items-center">
            <p>&copy; {new Date().getFullYear()} {LEGAL_ENTITY.businessName} ({LEGAL_ENTITY.brandName}). All rights reserved.</p>
            <div className="flex flex-wrap gap-4 text-muted">
              <Link to="/privacy" className="hover:text-silver">Privacy Policy</Link>
              <span>&middot;</span>
              <Link to="/terms" className="hover:text-silver">Terms of Service</Link>
              <span>&middot;</span>
              <Link to="/contact" className="hover:text-silver">Contact Us</Link>
            </div>
          </div>

          {isDemoMode && <p className="mt-5 flex items-start gap-2 text-[10px] leading-relaxed text-muted/80"><Info className="mt-0.5 h-3 w-3 shrink-0" />{t("demoBanner")}</p>}
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      {!isAdminArea && !isTalentProfile && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/98 lg:hidden" aria-label="Mobile navigation" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="grid grid-cols-4">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn("flex h-16 flex-col items-center justify-center gap-1 border-t-2 text-[11px] font-semibold transition-colors", isActive ? "border-neon bg-neon/5 text-neon" : "border-transparent text-muted")
                }
              >
                <n.icon className="h-5 w-5" />
                {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

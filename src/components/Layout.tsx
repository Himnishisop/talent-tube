import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, Search, UserRound, LayoutDashboard, ShieldCheck, LogOut, ArrowUpRight, Info } from "lucide-react";
import { cn } from "@/utils/cn";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { isDemoMode } from "@/services";
import { APP_ICON_URL, APP_TAGLINE } from "@/lib/constants";
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
      : user?.role === "talent"
        ? { to: "/dashboard", label: t("dashboard"), icon: LayoutDashboard }
        : { to: user ? "/register" : "/login", label: user ? "Your profile" : "Sign in", icon: UserRound },
  ];

  return (
    <div className="app-stage flex min-h-screen flex-col">
      <StageLights />
      <a href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById("main-content")?.focus(); }} className="skip-link">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-line/60 bg-canvas/95 backdrop-blur-xl">
        <div className="content-shell flex h-[76px] items-center justify-between gap-3 sm:h-[84px]">
          <Logo withTagline />
          <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
            <NavLink to="/" end className="desktop-nav-link px-2 py-7 text-[13px] font-medium">Discover talent</NavLink>
            <NavLink to="/categories" className="desktop-nav-link px-2 py-7 text-[13px] font-medium">Categories</NavLink>
            <Link to="/?section=how-it-works" className="desktop-nav-link px-2 py-7 text-[13px] font-medium">How it works</Link>
            {isAdmin && (
              <NavLink to="/admin" className="desktop-nav-link px-3 py-6 text-sm font-medium">
                {t("admin")}
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-3 sm:gap-6">
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
                {t("login")}
              </Link>
            )}
            <Link to={isAdmin ? "/admin" : user?.role === "talent" ? "/dashboard" : "/register"} className="button-primary inline-flex h-11 items-center justify-center gap-2 rounded-md px-3 text-[11px] font-bold sm:px-5 sm:text-[13px]">
              <span className="sm:hidden">{isAdmin ? "Admin" : user?.role === "talent" ? "Dashboard" : "Join as talent"}</span>
              <span className="hidden sm:inline">{isAdmin ? "Admin panel" : user?.role === "talent" ? "Your dashboard" : "Join as talent"}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className={cn("w-full flex-1 outline-none", !isHome && "content-shell py-8 sm:py-12")}>
        <Outlet />
      </main>

      <footer className="border-t border-line/70 bg-canvas pb-24 pt-10 text-xs text-muted lg:pb-6">
        <div className="content-shell">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-start">
            <div><Logo size="footer" /><p className="mt-4 max-w-xs leading-relaxed">{APP_TAGLINE}</p></div>
            <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-7 gap-y-2">
              <Link to="/search" className="inline-flex min-h-11 items-center hover:text-neon">Find talent</Link>
              <Link to="/categories" className="inline-flex min-h-11 items-center hover:text-neon">Categories</Link>
              <Link to="/register" className="inline-flex min-h-11 items-center hover:text-neon">For creatives</Link>
              <Link to="/prototype" className="inline-flex min-h-11 items-center hover:text-neon">App + Web prototype</Link>
              <Link to="/admin/login" className="inline-flex min-h-11 items-center gap-1.5 hover:text-neon"><ShieldCheck className="h-3.5 w-3.5" /> Admin</Link>
            </nav>
          </div>
          <div className="mt-8 flex flex-col justify-between gap-3 border-t border-line/60 pt-5 text-[11px] sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Talent Tube. All rights reserved.</p>
            <p>Independent talent. Direct connections. No booking commission.</p>
          </div>
          {isDemoMode && <p className="mt-5 flex items-start gap-2 text-[10px] leading-relaxed text-muted/80"><Info className="mt-0.5 h-3 w-3 shrink-0" />{t("demoBanner")}</p>}
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      {!isAdminArea && !isTalentProfile && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
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

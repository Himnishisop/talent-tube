import { Link } from "react-router-dom";
import { ArrowUpRight, Database, Globe2, Radio, Smartphone } from "lucide-react";
import { isDemoMode } from "@/services";
import { APP_ICON_URL } from "@/lib/constants";

/**
 * /#/prototype – entry point for multi-device testing.
 * Two big buttons: the artist App interface and the recruiter Web interface.
 */
export function PrototypeHub() {
  const origin = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "";
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3">
        <img src={APP_ICON_URL} alt="Talent Tube" className="h-12 w-12 rounded-xl object-contain" referrerPolicy="no-referrer" />
        <div>
          <p className="section-kicker mb-0">Prototype</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Two interfaces. One live database.</h1>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link to="/app" className="mapp-card block transition hover:border-neon/50">
          <Smartphone className="h-7 w-7 text-neon" />
          <h2 className="mt-3 font-display text-lg font-semibold">Mobile App</h2>
          <p className="mt-1 text-sm text-muted">For artists. Register with name, category, photo & video. Price auto-detects from your IP (₹500 / $10).</p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neon">Open /#/app <ArrowUpRight className="h-3.5 w-3.5" /></p>
        </Link>
        <Link to="/web" className="mapp-card block transition hover:border-neon/50">
          <Globe2 className="h-7 w-7 text-neon" />
          <h2 className="mt-3 font-display text-lg font-semibold">Web Search</h2>
          <p className="mt-1 text-sm text-muted">For recruiters. Search bar + category filters over the same database. New artists appear instantly.</p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neon">Open /#/web <ArrowUpRight className="h-3.5 w-3.5" /></p>
        </Link>
      </div>

      <div className="mapp-card mt-6 text-sm text-silver">
        <p className="flex items-center gap-2 font-semibold text-heading"><Database className="h-4 w-4 text-neon" /> How the sync works</p>
        {isDemoMode ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li><span className="text-silver">Preview mode (no Firebase keys yet):</span> data lives in this browser and syncs <span className="text-silver">instantly between tabs/windows on the same device</span> via BroadcastChannel.</li>
            <li>Test it: open <span className="text-silver">/#/app</span> and <span className="text-silver">/#/web</span> side by side, register an artist, watch the web list update.</li>
            <li>For phone ↔ laptop sync, add your Firebase keys (see README) – the same code then uses Firestore real-time listeners across every device.</li>
          </ul>
        ) : (
          <p className="mt-2 flex items-center gap-2 text-muted"><Radio className="h-4 w-4 text-neon" /> Connected to Firestore. Changes sync across all devices in real time.</p>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-line bg-panel p-4 text-xs text-muted">
        <p className="font-semibold text-silver">Links to open on your phone</p>
        <p className="mt-2 break-all"><span className="text-heading">App:</span> {origin}#/app</p>
        <p className="mt-1 break-all"><span className="text-heading">Web:</span> {origin}#/web</p>
      </div>
    </main>
  );
}

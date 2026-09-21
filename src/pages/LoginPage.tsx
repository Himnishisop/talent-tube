import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import type { UserRole } from "@/lib/types";
import { Button, Field, Input } from "@/components/ui";
import { isDemoMode } from "@/services";

export function LoginPage() {
  const { t } = useLang();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as { from?: string; role?: UserRole; mode?: "login" | "signup" } | null) ?? {};
  const from = navState.from;

  const [mode, setMode] = useState<"login" | "signup">(navState.mode ?? "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const go = (r: UserRole) => navigate(from ?? (r === "talent" ? "/dashboard" : r === "admin" ? "/admin" : "/"), { replace: true });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = mode === "login" ? await signInWithEmail(email, password) : await signUpWithEmail(email, password, name, "talent");
      go(u.role);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const u = await signInWithGoogle("talent");
      go(u.role);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md animate-fade-up">
      {/* Searchers reassurance banner */}
      <div className="mb-6 rounded-2xl border border-neon/30 bg-panel p-5 text-xs shadow-sm">
        <div className="flex items-center gap-2 font-bold text-heading text-sm mb-1.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          Looking to find or hire talent?
        </div>
        <p className="text-muted leading-relaxed mb-3.5">
          No sign-in or account is required for searchers and recruiters. You can freely explore artists, watch showreels, and directly call or WhatsApp them for free.
        </p>
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 rounded-xl bg-neon px-4 py-2 font-bold text-canvas hover:bg-neon/90 transition text-xs shadow"
        >
          <Search className="h-3.5 w-3.5" />
          Browse & Search Talent (No Sign-in)
        </Link>
      </div>

      <div className="rounded-xl border border-line bg-panel p-6 sm:p-8">
        <p className="section-kicker">For creators & artists</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {mode === "login" ? "Artist & Creator Sign In" : "Create Artist Profile"}
        </h1>
        <p className="mt-2 text-xs text-muted">
          {mode === "login"
            ? "Sign in to manage your creator profile, showreels, and membership."
            : "Join Talent Tube to showcase your talent, publish videos, and receive direct enquiries."}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <Field label={t("fullName")} required>
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </Field>
          )}
          <Field label={t("email")} required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" />
          </Field>
          <Field label={t("password")} required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </Field>
          {error && <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}
          <Button type="submit" full size="lg" loading={busy}>
            {mode === "login" ? t("login") : t("createAccount")}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> {t("or")} <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Button variant="outline" full size="lg" onClick={google} disabled={busy} icon={<GoogleIcon />}>
          {t("continueWithGoogle")}
        </Button>

        <p className="mt-5 text-center text-sm text-slate-600">
          {mode === "login" ? t("newHere") : t("alreadyHaveAccount")}{" "}
          <button className="font-bold text-brand-700" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? t("createAccount") : t("login")}
          </button>
        </p>

        {isDemoMode && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-bold text-slate-800">Preview sign-in</p>
            <p className="mt-1 leading-relaxed">Use any email and a password with 6+ characters to explore a demo account.</p>
            <p className="mt-2">Admin: <code>admin@talenttube.in</code> / <code>admin123</code></p>
          </div>
        )}
        <p className="mt-3 text-center text-xs text-slate-400">
          <Link to="/admin/login">Admin login →</Link>
        </p>
      </div>
    </div>
  );
}

function friendly(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password") || msg.includes("auth/user-not-found")) return "Incorrect email or password.";
  if (msg.includes("auth/email-already-in-use")) return "This email is already registered. Please log in.";
  if (msg.includes("auth/weak-password")) return "Password must be at least 6 characters.";
  if (msg.includes("auth/popup-closed-by-user")) return "Google sign-in was cancelled.";
  return msg.replace("Firebase: ", "");
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

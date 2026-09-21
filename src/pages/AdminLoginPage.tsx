import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { Button, Field, Input } from "@/components/ui";
import { isDemoMode } from "@/services";

export function AdminLoginPage() {
  const { t } = useLang();
  const { signInWithEmail, signOut, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user && isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = await signInWithEmail(email, password);
      if (u.role !== "admin") {
        // Never allow non-admins into the admin area.
        await signOut();
        setError("This account does not have admin access.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message.replace("Firebase: ", "") : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm animate-fade-up">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-neon/20 bg-neon/10 text-neon">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-extrabold">{t("adminLogin")}</h1>
        <p className="text-sm text-slate-500">Restricted area. All actions are logged.</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <Field label={t("email")} required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </Field>
          <Field label={t("password")} required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </Field>
          {error && <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}
          <Button type="submit" full size="lg" variant="secondary" loading={busy}>{t("login")}</Button>
        </form>
        {isDemoMode && (
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            Admin account: <code>rajeev.raj66@gmail.com</code>
          </p>
        )}
      </div>
    </div>
  );
}

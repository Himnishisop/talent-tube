import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, setToken, getToken } from "@/lib/api";
import { dataService } from "@/services";
import type { AppUser } from "@/lib/types";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function processAuth() {
      try {
        // 1. Extract token from hash or query string
        let token: string | null = null;
        
        const hashMatch = /#\/auth\/callback\?(?:.*&)?token=([^&]+)/.exec(window.location.hash);
        if (hashMatch) {
          token = decodeURIComponent(hashMatch[1]);
        } else {
          const params = new URLSearchParams(window.location.search || window.location.hash.split("?")[1] || "");
          token = params.get("token");
        }

        if (!token) {
          token = getToken();
        }

        if (!token) {
          throw new Error("No authentication token received from Google sign-in.");
        }

        setToken(token);

        // 2. Fetch authenticated user profile
        const me = await api<AppUser>("/api/auth/me");
        if (!active) return;

        setSession(token, me);

        // 3. Smart routing based on role and onboarding status
        if (me.role === "talent") {
          // Check if talent profile already exists
          const existing = await dataService.getTalent(me.uid);
          if (existing) {
            navigate("/dashboard", { replace: true });
          } else {
            // New talent: direct to artist onboarding/registration page
            navigate("/register", { replace: true });
          }
        } else if (me.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (err) {
        if (!active) return;
        console.error("Auth callback processing failed:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    }

    processAuth();

    return () => {
      active = false;
    };
  }, [navigate, setSession]);

  if (error) {
    return (
      <div className="mx-auto max-w-md p-6 text-center animate-fade-up">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-3" />
          <h2 className="text-lg font-bold">Sign-in Verification Issue</h2>
          <p className="mt-2 text-sm text-rose-800">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-700 transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center p-6 text-center animate-fade-up">
      <div className="relative mb-6">
        <div className="h-16 w-16 rounded-2xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
          <Sparkles className="h-8 w-8 text-brand-500 animate-pulse" />
        </div>
        <Loader2 className="absolute -bottom-2 -right-2 h-6 w-6 animate-spin text-brand-600" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-heading">Signing you in...</h2>
      <p className="mt-2 text-sm text-muted">Securing your session and opening your talent stage.</p>
    </div>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppUser, UserRole } from "@/lib/types";
import { API_URL, api, getToken, isApiConfigured, setToken } from "@/lib/api";
import { dataService } from "@/services";

// ---------------------------------------------------------------------------
// AuthContext
//  • Production: MongoDB API Authentication (JWT sessions, email/password + Google OAuth).
//    Role is managed in MongoDB User collection.
//  • Demo mode: a mock session stored in localStorage when API is unreachable.
//    Demo admin login → admin@talenttube.in / admin123
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AppUser>;
  signUpWithEmail: (email: string, password: string, name: string, role: UserRole) => Promise<AppUser>;
  signInWithGoogle: (role?: UserRole) => Promise<AppUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_SESSION_KEY = "tt_demo_session";
export const DEMO_ADMIN_EMAIL = "admin@talenttube.in";
export const DEMO_ADMIN_PASSWORD = "admin123";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------------ boot
  useEffect(() => {
    // ---- Google sign-in return handler ----
    const m = /#\/auth\/callback\?(?:.*&)?token=([^&]+)/.exec(window.location.hash);
    if (m) {
      setToken(decodeURIComponent(m[1]));
      window.history.replaceState(null, "", `${window.location.pathname}#/`);
    }

    if (isApiConfigured && getToken()) {
      api<AppUser>("/api/auth/me")
        .then(setUser)
        .catch(() => setToken(null))
        .finally(() => setLoading(false));
      return;
    }

    // Demo / offline mode session fallback
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem(DEMO_SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  // ----------------------------------------------------------- demo helpers
  const demoLogin = useCallback(async (email: string, name: string, role: UserRole, password?: string): Promise<AppUser> => {
    const isAdminEmail = email.toLowerCase() === DEMO_ADMIN_EMAIL;
    if (isAdminEmail && password !== undefined && password !== DEMO_ADMIN_PASSWORD) {
      throw new Error("Invalid admin credentials");
    }
    const uid = `u_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const existing = await dataService.getUser(uid);
    const profile: AppUser = existing ?? {
      uid,
      role: isAdminEmail ? "admin" : role,
      displayName: name || email.split("@")[0],
      email,
      createdAt: new Date().toISOString(),
    };
    if (isAdminEmail) profile.role = "admin";
    await dataService.saveUser(profile);
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile));
    setUser(profile);
    return profile;
  }, []);

  // --------------------------------------------------------------- actions
  const apiSession = useCallback((r: { token: string; user: AppUser }) => {
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (isApiConfigured) {
        try {
          return apiSession(await api<{ token: string; user: AppUser }>("/api/auth/login", { method: "POST", json: { email, password } }));
        } catch (err) {
          // If server is in offline/mock mode and DB is not connected, fallback to demoLogin
          if (email.toLowerCase() === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD) {
            return demoLogin(email, "Admin", "admin", password);
          }
          throw err;
        }
      }
      return demoLogin(email, "", "customer", password);
    },
    [demoLogin, apiSession]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string, role: UserRole) => {
      const safeRole: UserRole = role === "admin" ? "customer" : role;
      if (isApiConfigured) {
        try {
          return apiSession(await api<{ token: string; user: AppUser }>("/api/auth/register", { method: "POST", json: { email, password, name, role: safeRole } }));
        } catch (err) {
          throw err;
        }
      }
      return demoLogin(email, name, safeRole, password);
    },
    [demoLogin, apiSession]
  );

  const signInWithGoogle = useCallback(
    async (role: UserRole = "customer") => {
      if (isApiConfigured) {
        // Full-page redirect to the server's Google OAuth flow; returns to #/auth/callback?token=...
        const redirect = `${window.location.origin}${window.location.pathname}`;
        window.location.href = `${API_URL}/api/auth/google?role=${role}&redirect=${encodeURIComponent(redirect)}`;
        return new Promise<AppUser>(() => { /* page navigates away */ });
      }
      return demoLogin("demo.google.user@gmail.com", "Demo User", role);
    },
    [demoLogin]
  );

  const signOut = useCallback(async () => {
    if (isApiConfigured) setToken(null);
    localStorage.removeItem(DEMO_SESSION_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    if (isApiConfigured) {
      const me = await api<AppUser>("/api/auth/me").catch(() => null);
      if (me) setUser(me);
      return;
    }
    const fresh = await dataService.getUser(user.uid);
    if (fresh) {
      setUser(fresh);
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(fresh));
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "admin",
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      refreshUser,
    }),
    [user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

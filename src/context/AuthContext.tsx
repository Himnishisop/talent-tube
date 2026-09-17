import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppUser, UserRole } from "@/lib/types";
import { auth as firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { API_URL, api, getToken, isApiConfigured, setToken } from "@/lib/api";
import { dataService } from "@/services";

// ---------------------------------------------------------------------------
// AuthContext
//  • Production: Firebase Authentication (email/password + Google).
//    Role is read from users/{uid}.role. Admins are created by setting
//    role = "admin" manually in the Firestore console (never from the client).
//  • Demo mode: a mock session stored in localStorage.
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
    // ---- API / MongoDB mode (JWT) ----
    if (isApiConfigured) {
      // Google sign-in lands on  #/auth/callback?token=...  → store token, clean URL
      const m = /#\/auth\/callback\?(?:.*&)?token=([^&]+)/.exec(window.location.hash);
      if (m) {
        setToken(decodeURIComponent(m[1]));
        window.history.replaceState(null, "", `${window.location.pathname}#/`);
      }
      if (!getToken()) { setLoading(false); return; }
      api<AppUser>("/api/auth/me")
        .then(setUser)
        .catch(() => setToken(null))
        .finally(() => setLoading(false));
      return;
    }
    if (isFirebaseConfigured && firebaseAuth) {
      const fbAuth = firebaseAuth;
      let cancelled = false;
      import("firebase/auth").then(({ onAuthStateChanged }) => {
        onAuthStateChanged(fbAuth, async (fbUser) => {
          if (cancelled) return;
          if (!fbUser) {
            setUser(null);
            setLoading(false);
            return;
          }
          let profile = await dataService.getUser(fbUser.uid);
          if (!profile) {
            profile = {
              uid: fbUser.uid,
              role: "customer",
              displayName: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "User",
              email: fbUser.email ?? undefined,
              phone: fbUser.phoneNumber ?? undefined,
              photoURL: fbUser.photoURL ?? undefined,
              createdAt: new Date().toISOString(),
            };
            await dataService.saveUser(profile);
          }
          setUser(profile);
          setLoading(false);
        });
      });
      return () => {
        cancelled = true;
      };
    }
    // Demo mode
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
  const apiSession = useCallback((r: { token: string; user: AppUser }) => { setToken(r.token); setUser(r.user); return r.user; }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (isApiConfigured) return apiSession(await api<{ token: string; user: AppUser }>("/api/auth/login", { method: "POST", json: { email, password } }));
      if (!isFirebaseConfigured || !firebaseAuth) return demoLogin(email, "", "customer", password);
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const profile = await dataService.getUser(cred.user.uid);
      if (!profile) throw new Error("Profile not found");
      setUser(profile);
      return profile;
    },
    [demoLogin, apiSession]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string, role: UserRole) => {
      // Admin role can never be self-assigned.
      const safeRole: UserRole = role === "admin" ? "customer" : role;
      if (isApiConfigured) return apiSession(await api<{ token: string; user: AppUser }>("/api/auth/register", { method: "POST", json: { email, password, name, role: safeRole } }));
      if (!isFirebaseConfigured || !firebaseAuth) return demoLogin(email, name, safeRole, password);
      const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(cred.user, { displayName: name });
      const profile: AppUser = {
        uid: cred.user.uid,
        role: safeRole,
        displayName: name,
        email,
        createdAt: new Date().toISOString(),
      };
      await dataService.saveUser(profile);
      setUser(profile);
      return profile;
    },
    [demoLogin, apiSession]
  );

  const signInWithGoogle = useCallback(
    async (role: UserRole = "customer") => {
      if (isApiConfigured) {
        // Full-page redirect to the server's OAuth flow; it returns to #/auth/callback?token=…
        const redirect = `${window.location.origin}${window.location.pathname}`;
        window.location.href = `${API_URL}/api/auth/google?role=${role}&redirect=${encodeURIComponent(redirect)}`;
        return new Promise<AppUser>(() => { /* page navigates away */ });
      }
      if (!isFirebaseConfigured || !firebaseAuth) return demoLogin("demo.google.user@gmail.com", "Demo User", role);
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      const cred = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      let profile = await dataService.getUser(cred.user.uid);
      if (!profile) {
        profile = {
          uid: cred.user.uid,
          role: role === "admin" ? "customer" : role,
          displayName: cred.user.displayName ?? "User",
          email: cred.user.email ?? undefined,
          photoURL: cred.user.photoURL ?? undefined,
          createdAt: new Date().toISOString(),
        };
        await dataService.saveUser(profile);
      }
      setUser(profile);
      return profile;
    },
    [demoLogin]
  );

  const signOut = useCallback(async () => {
    if (isApiConfigured) setToken(null);
    if (isFirebaseConfigured && firebaseAuth) {
      const { signOut: fbSignOut } = await import("firebase/auth");
      await fbSignOut(firebaseAuth);
    }
    localStorage.removeItem(DEMO_SESSION_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    if (isApiConfigured) { const me = await api<AppUser>("/api/auth/me").catch(() => null); if (me) setUser(me); return; }
    const fresh = await dataService.getUser(user.uid);
    if (fresh) {
      setUser(fresh);
      if (!isFirebaseConfigured) localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(fresh));
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

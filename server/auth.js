// Authentication: JWT sessions, email/password, and "Sign in with Google" via
// the OAuth 2.0 authorization-code flow (server-side; client secret never
// reaches the browser).
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { User, connectDb } from "./db.js";

const env = process.env;
const JWT_SECRET = env.JWT_SECRET || "talent-tube-jwt-secret-fallback-token-key-2026";
export const ONLY_ADMIN_EMAIL = "rajeev.raj66@gmail.com";
const TOKEN_TTL = "30d";

export const uidFrom = (seed) => `u_${String(seed || "").toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

export const isAdminEmail = (email) => !!email && String(email).trim().toLowerCase() === ONLY_ADMIN_EMAIL;

export const publicUser = (u) => {
  if (!u) return null;
  const email = u.email ? String(u.email).toLowerCase() : "";
  const uid = u.uid || (email ? uidFrom(email) : String(u._id || `u_${Date.now()}`));
  const role = isAdminEmail(email) ? "admin" : "talent";
  return {
    uid,
    role,
    displayName: u.displayName || u.name || u.profileName || (email ? email.split("@")[0] : "Creator"),
    email: u.email,
    phone: u.phone || u.whatsapp,
    photoURL: u.photoURL || u.picture || u.profilePicture,
    createdAt: u.createdAt || new Date().toISOString()
  };
};

export const signToken = (user) => {
  const email = user.email ? String(user.email).toLowerCase() : "";
  const uid = user.uid || (email ? uidFrom(email) : String(user._id || `u_${Date.now()}`));
  const role = isAdminEmail(email) ? "admin" : "talent";
  return jwt.sign({ uid, role, email }, JWT_SECRET, { expiresIn: TOKEN_TTL });
};

/** Attaches req.user (may be null). */
export async function attachUser(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  req.user = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && (decoded.uid || decoded.email)) {
        let u = null;
        if (decoded.uid) {
          u = await User.findOne({
            $or: [
              { uid: decoded.uid },
              { email: decoded.uid.replace(/^u_/, "").replace(/_/g, ".") }
            ]
          }).lean();
        }
        if (!u && decoded.email) {
          u = await User.findOne({ email: String(decoded.email).toLowerCase() }).lean();
        }
        if (u) {
          const email = u.email ? String(u.email).toLowerCase() : "";
          const uid = u.uid || decoded.uid || (email ? uidFrom(email) : String(u._id));
          const role = isAdminEmail(email) ? "admin" : "talent";
          u.uid = uid;
          u.role = role;
          req.user = u;
          // Synchronize missing uid or demote non-admin in Mongo
          if (!u.uid || u.role !== role) {
            await User.updateOne({ _id: u._id }, { $set: { uid, role } });
          }
        }
      }
    } catch { /* invalid/expired token → anonymous */ }
  }
  next();
}
export const requireAuth = (req, res, next) => (req.user ? next() : res.status(401).json({ error: "Sign in required" }));
export const requireAdmin = (req, res, next) => (req.user?.role === "admin" ? next() : res.status(403).json({ error: "Admin only" }));

export const getBaseUrl = (req) => {
  if (req) {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    if (host) return `${proto}://${host}`.replace(/\/$/, "");
  }
  return (env.SERVER_URL || "http://localhost:3000").replace(/\/$/, "");
};

export const oauth = (redirectPath, req) => {
  const base = getBaseUrl(req);
  return new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, `${base}/api/${redirectPath}`);
};

export const authRouter = Router();

// ---- Email / password ------------------------------------------------------
authRouter.post("/register", async (req, res) => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: "Please enter a valid email and password with at least 6 characters." });
  }
  const lower = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: lower }).select("+passwordHash");
  if (existing) {
    // If the account existed without passwordHash (e.g. earlier Google sign-in), let them set password directly
    if (!existing.passwordHash) {
      existing.passwordHash = await bcrypt.hash(password, 10);
      if (name && (!existing.displayName || existing.displayName === lower.split("@")[0])) {
        existing.displayName = name;
      }
      await existing.save();
      return res.json({ token: signToken(existing), user: publicUser(existing) });
    }
    return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
  }

  const role = isAdminEmail(lower) ? "admin" : "talent";
  const user = await User.create({
    uid: uidFrom(lower),
    email: lower,
    displayName: name?.trim() || lower.split("@")[0],
    role,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  });
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Please enter your email and password." });
  }
  const lower = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: lower }).select("+passwordHash");
  if (!user) {
    return res.status(401).json({ error: "No account found with this email. Please create an account first." });
  }
  if (!user.passwordHash) {
    return res.status(401).json({ error: "This account doesn't have a direct password yet. Switch to 'Create account' with this email to set a password, or use Google Sign-in." });
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: "Incorrect password. Please verify and try again." });
  }

  const expectedRole = isAdminEmail(user.email) ? "admin" : "talent";
  if (user.role !== expectedRole) {
    user.role = expectedRole;
    await user.save();
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body ?? {};
  if (!email || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Valid email and new password (6+ characters) are required." });
  }
  const lower = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: lower });
  if (!user) {
    return res.status(404).json({ error: "No account found with this email." });
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ success: true, message: "Password updated successfully! You can now log in with your new password." });
});

authRouter.get("/me", attachUser, requireAuth, (req, res) => res.json(publicUser(req.user)));

// ---- Google Sign-In (openid email profile) ---------------------------------
authRouter.get("/google", (req, res) => {
  if (!env.GOOGLE_CLIENT_ID) return res.status(500).send("GOOGLE_CLIENT_ID is not configured in environment variables.");
  const base = getBaseUrl(req);
  const state = Buffer.from(JSON.stringify({ redirect: req.query.redirect ?? base, role: req.query.role ?? "talent" })).toString("base64url");
  const url = oauth("auth/google/callback", req).generateAuthUrl({ scope: ["openid", "email", "profile"], prompt: "select_account", state });
  res.redirect(url);
});

authRouter.get("/google/callback", async (req, res) => {
  try {
    const { redirect } = JSON.parse(Buffer.from(String(req.query.state ?? ""), "base64url").toString() || "{}");
    const client = oauth("auth/google/callback", req);
    const { tokens } = await client.getToken(String(req.query.code));
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: env.GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    const email = p.email.toLowerCase();
    
    if (env.MONGODB_URI) {
      await connectDb(env.MONGODB_URI);
    }

    const expectedRole = isAdminEmail(email) ? "admin" : "talent";
    let user = await User.findOne({ $or: [{ googleId: p.sub }, { email }] });
    if (!user) {
      user = await User.create({
        uid: uidFrom(email), email, googleId: p.sub, displayName: p.name ?? email.split("@")[0], photoURL: p.picture,
        role: expectedRole, createdAt: new Date().toISOString(),
      });
    } else {
      let changed = false;
      if (!user.googleId) { user.googleId = p.sub; changed = true; }
      if (!user.uid) { user.uid = uidFrom(email); changed = true; }
      if (user.role !== expectedRole) { user.role = expectedRole; changed = true; }
      if (!user.photoURL && p.picture) { user.photoURL = p.picture; changed = true; }
      if (changed) await user.save();
    }
    const fallbackBase = getBaseUrl(req);
    const base = String(redirect || env.CLIENT_ORIGIN || fallbackBase).split("#")[0];
    res.redirect(`${base}#/auth/callback?token=${encodeURIComponent(signToken(user))}`);
  } catch (e) {
    console.error("[Google Auth Error]", e);
    const detail = e.response?.data?.error_description || e.message || String(e);
    res.status(400).send(`Google sign-in failed: ${detail}. Please verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MONGODB_URI and redirect URIs in Google Cloud.`);
  }
});

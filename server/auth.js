// Authentication: JWT sessions, email/password, and "Sign in with Google" via
// the OAuth 2.0 authorization-code flow (server-side; client secret never
// reaches the browser).
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { User } from "./db.js";

const env = process.env;
const ADMIN_EMAILS = (env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const TOKEN_TTL = "30d";

export const isAdminEmail = (email) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());
export const signToken = (user) => jwt.sign({ uid: user.uid, role: user.role }, env.JWT_SECRET, { expiresIn: TOKEN_TTL });
export const publicUser = (u) => ({ uid: u.uid, role: u.role, displayName: u.displayName, email: u.email, phone: u.phone, photoURL: u.photoURL, createdAt: u.createdAt });

/** Attaches req.user (may be null). */
export async function attachUser(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  req.user = null;
  if (token) {
    try {
      const { uid } = jwt.verify(token, env.JWT_SECRET);
      req.user = await User.findOne({ uid }).lean();
    } catch { /* invalid/expired token → anonymous */ }
  }
  next();
}
export const requireAuth = (req, res, next) => (req.user ? next() : res.status(401).json({ error: "Sign in required" }));
export const requireAdmin = (req, res, next) => (req.user?.role === "admin" ? next() : res.status(403).json({ error: "Admin only" }));

const oauth = (redirectPath) => new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, `${env.SERVER_URL}/api/${redirectPath}`);
const uidFrom = (seed) => `u_${seed.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

export const authRouter = Router();

// ---- Email / password ------------------------------------------------------
authRouter.post("/register", async (req, res) => {
  const { email, password, name, role } = req.body ?? {};
  if (!email || !password || password.length < 6) return res.status(400).json({ error: "Email and a 6+ character password are required" });
  const lower = String(email).toLowerCase();
  if (await User.findOne({ email: lower })) return res.status(409).json({ error: "This email is already registered. Please sign in." });
  const user = await User.create({
    uid: uidFrom(lower),
    email: lower,
    displayName: name || lower.split("@")[0],
    role: isAdminEmail(lower) ? "admin" : role === "talent" ? "talent" : "customer",
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  });
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = await User.findOne({ email: String(email ?? "").toLowerCase() }).select("+passwordHash");
  if (!user?.passwordHash || !(await bcrypt.compare(password ?? "", user.passwordHash))) return res.status(401).json({ error: "Incorrect email or password." });
  if (isAdminEmail(user.email) && user.role !== "admin") { user.role = "admin"; await user.save(); }
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.get("/me", attachUser, requireAuth, (req, res) => res.json(publicUser(req.user)));

// ---- Google Sign-In (openid email profile) ---------------------------------
authRouter.get("/google", (req, res) => {
  if (!env.GOOGLE_CLIENT_ID) return res.status(500).send("GOOGLE_CLIENT_ID is not configured");
  const state = Buffer.from(JSON.stringify({ redirect: req.query.redirect ?? env.CLIENT_ORIGIN, role: req.query.role ?? "customer" })).toString("base64url");
  const url = oauth("auth/google/callback").generateAuthUrl({ scope: ["openid", "email", "profile"], prompt: "select_account", state });
  res.redirect(url);
});

authRouter.get("/google/callback", async (req, res) => {
  try {
    const { redirect, role } = JSON.parse(Buffer.from(String(req.query.state ?? ""), "base64url").toString() || "{}");
    const client = oauth("auth/google/callback");
    const { tokens } = await client.getToken(String(req.query.code));
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: env.GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    const email = p.email.toLowerCase();
    let user = await User.findOne({ $or: [{ googleId: p.sub }, { email }] });
    if (!user) {
      user = await User.create({
        uid: uidFrom(email), email, googleId: p.sub, displayName: p.name ?? email.split("@")[0], photoURL: p.picture,
        role: isAdminEmail(email) ? "admin" : role === "talent" ? "talent" : "customer", createdAt: new Date().toISOString(),
      });
    } else if (!user.googleId) { user.googleId = p.sub; await user.save(); }
    const base = String(redirect || env.CLIENT_ORIGIN).split("#")[0];
    res.redirect(`${base}#/auth/callback?token=${encodeURIComponent(signToken(user))}`);
  } catch (e) {
    console.error(e);
    res.status(400).send("Google sign-in failed. Check GOOGLE_CLIENT_ID/SECRET and the redirect URI.");
  }
});

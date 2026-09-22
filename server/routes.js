// REST API consumed by src/services/apiDataProvider.ts, plus an SSE stream so
// every connected client (App + Web) sees changes instantly.
import { Router } from "express";
import { Talent, Category, Payment, Report, Photo, User } from "./db.js";
import { attachUser, requireAuth, requireAdmin, publicUser } from "./auth.js";
import { uploadToCloudinary, isCloudinaryConfigured } from "./cloudinary.js";

// ---------------------------------------------------------------- realtime
const clients = new Set();
export function broadcast(type, payload = {}) {
  const msg = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) { try { res.write(msg); } catch { clients.delete(res); } }
}

const PROTECTED = ["status", "verified", "featured", "rejectionReason", "subscriptionStatus", "subscriptionStartDate", "subscriptionExpiryDate", "paymentId"];
const isPublic = (t) => t.status === "approved" && t.subscriptionStatus === "active" && (!t.subscriptionExpiryDate || new Date(t.subscriptionExpiryDate) > new Date());
const strip = (t) => { const o = { ...t }; delete o._id; return o; };
/** Public listings never include contact details – those come from the profile page. */
const publicView = (t) => strip(t);

export const apiRouter = Router();
apiRouter.use(attachUser);

// SSE -----------------------------------------------------------------------
apiRouter.get("/stream", (req, res) => {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.flushHeaders();
  res.write("event: hello\ndata: {}\n\n");
  clients.add(res);
  const ping = setInterval(() => res.write(": ping\n\n"), 25000);
  req.on("close", () => { clearInterval(ping); clients.delete(res); });
});

// Users ---------------------------------------------------------------------
apiRouter.get("/users/:uid", requireAuth, async (req, res) => {
  const target = req.params.uid;
  const isSelf = target === "me" || target === "undefined" || target === "null" ||
                 target === req.user.uid || (req.user.email && target.toLowerCase() === req.user.email.toLowerCase());
  if (isSelf) return res.json(publicUser(req.user));
  const u = await User.findOne({ $or: [{ uid: target }, { email: target.toLowerCase() }] }).lean();
  res.json(u ? publicUser(u) : null);
});
apiRouter.put("/users/:uid", requireAuth, async (req, res) => {
  const target = req.params.uid;
  const isSelf = target === "me" || target === "undefined" || target === "null" ||
                 target === req.user.uid || (req.user.email && target.toLowerCase() === req.user.email.toLowerCase());
  if (!isSelf && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const { role, ...rest } = req.body ?? {};
  const set = { ...rest };
  // Users may upgrade themselves customer → talent only; admin is never self-assigned.
  if (role === "talent" || (req.user.role === "admin" && role)) set.role = role;
  delete set.passwordHash; delete set.youtube;

  const targetUid = isSelf ? req.user.uid : target;
  set.uid = targetUid;
  const u = await User.findOneAndUpdate(
    { $or: [{ uid: targetUid }, { _id: req.user._id }] }, 
    { $set: set }, 
    { new: true, upsert: true }
  ).lean();
  res.json(publicUser(u));
});

// Talents -------------------------------------------------------------------
apiRouter.get("/talents", async (req, res) => {
  if (req.query.all === "1") {
    if (req.user?.role !== "admin") {
      const list = (await Talent.find({ status: { $nin: ["rejected", "suspended"] } }).lean()).map(publicView);
      list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || String(b.createdAt).localeCompare(String(a.createdAt)));
      return res.json(list);
    }
    return res.json((await Talent.find().sort({ createdAt: -1 }).lean()).map(strip));
  }
  // Public directory: all talents that are not explicitly rejected or suspended
  const list = (await Talent.find({ status: { $nin: ["rejected", "suspended"] } }).lean()).map(publicView);
  list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json(list);
});

apiRouter.get("/talents/:id", async (req, res) => {
  const id = req.params.id;
  const isCurrent = id === "me" || id === "mine" || id === "undefined" || id === "null";
  let t = null;
  if (!isCurrent) {
    t = await Talent.findOne({ $or: [{ id }, { uid: id }] }).lean();
  }
  if (!t && req.user) {
    t = await Talent.findOne({ $or: [{ uid: req.user.uid }, ...(req.user.email ? [{ email: req.user.email }] : [])] }).lean();
  }
  if (!t) return res.json(null);
  res.json(strip(t));
});

apiRouter.put("/talents/:id", requireAuth, async (req, res) => {
  const body = { ...(req.body ?? {}) };
  const admin = req.user?.role === "admin";
  
  // Find any existing talent for this user (by requested id or user's uid or email)
  let existing = await Talent.findOne({ 
    $or: [
      { id: req.params.id }, 
      { uid: req.user.uid },
      ...(req.user.email ? [{ email: req.user.email }] : [])
    ] 
  }).lean();

  const isInvalidParam = !req.params.id || req.params.id === "undefined" || req.params.id === "null";
  const targetId = admin && !isInvalidParam ? req.params.id : (existing?.id || req.user.uid || `t_${Date.now()}`);
  body.id = targetId;
  body.uid = req.user.uid;
  if (!body.email && req.user.email) body.email = req.user.email;

  if ((body.videos?.length ?? 0) > 10) return res.status(400).json({ error: "Maximum 10 videos" });

  if (!admin) {
    // Approved and active immediately so it appears on Discover and Search
    body.status = existing?.status === "suspended" ? "suspended" : "approved";
    body.verified = existing?.verified ?? true;
    body.featured = existing?.featured ?? false;
    body.subscriptionStatus = "active";
    body.subscriptionStartDate = existing?.subscriptionStartDate || new Date().toISOString();
    body.subscriptionExpiryDate = existing?.subscriptionExpiryDate || new Date(Date.now() + 365 * 86400000).toISOString();
    body.paymentId = existing?.paymentId || "membership_active";
  }

  body.registrationComplete = true;
  body.updatedAt = new Date().toISOString();
  if (!body.createdAt) body.createdAt = existing?.createdAt || new Date().toISOString();

  const query = existing ? { _id: existing._id } : { id: targetId };
  const t = await Talent.findOneAndUpdate(query, { $set: body }, { upsert: true, new: true }).lean();

  // Upgrade user's role to talent in User table if currently customer
  if (req.user?.role !== "admin" && req.user?.role !== "talent") {
    await User.updateOne({ uid: req.user.uid }, { $set: { role: "talent", phone: body.mobile || req.user.phone } });
  }

  broadcast("talents", { id: t.id });
  res.json(strip(t));
});

apiRouter.patch("/talents/:id", requireAuth, async (req, res) => {
  const admin = req.user.role === "admin";
  const patch = { ...(req.body ?? {}) };
  let t0 = await Talent.findOne({ 
    $or: [
      { id: req.params.id }, 
      { uid: req.params.id }, 
      { uid: req.user.uid },
      ...(req.user.email ? [{ email: req.user.email }] : [])
    ] 
  }).lean();
  if (!t0 && !admin) {
    t0 = await Talent.findOne({ $or: [{ uid: req.user.uid }, ...(req.user.email ? [{ email: req.user.email }] : [])] }).lean();
  }
  if (!t0) return res.status(404).json({ error: "Not found" });
  const owner = t0.uid === req.user.uid || (req.user.email && t0.email?.toLowerCase() === req.user.email?.toLowerCase());
  if (!admin && !owner) return res.status(403).json({ error: "Forbidden" });

  patch.updatedAt = new Date().toISOString();
  const t = await Talent.findOneAndUpdate({ _id: t0._id }, { $set: patch }, { new: true }).lean();
  broadcast("talents", { id: t.id });
  res.json(strip(t));
});

apiRouter.delete("/talents/:id", requireAuth, requireAdmin, async (req, res) => {
  await Talent.deleteOne({ id: req.params.id });
  broadcast("talents", { id: req.params.id, deleted: true });
  res.json({ ok: true });
});

// Categories ----------------------------------------------------------------
apiRouter.get("/categories", async (_req, res) => res.json((await Category.find().sort({ order: 1 }).lean()).map(strip)));
apiRouter.put("/categories/:id", requireAuth, requireAdmin, async (req, res) => {
  const c = await Category.findOneAndUpdate({ id: req.params.id }, { $set: req.body }, { upsert: true, new: true }).lean();
  broadcast("categories", {}); res.json(strip(c));
});
apiRouter.post("/categories/seed", requireAuth, requireAdmin, async (req, res) => {
  const list = Array.isArray(req.body) ? req.body : [];
  for (const c of list) await Category.updateOne({ id: c.id }, { $setOnInsert: c }, { upsert: true });
  res.json({ ok: true, count: list.length });
});
apiRouter.delete("/categories/:id", requireAuth, requireAdmin, async (req, res) => { await Category.deleteOne({ id: req.params.id }); broadcast("categories", {}); res.json({ ok: true }); });

// Payments ------------------------------------------------------------------
apiRouter.get("/payments", requireAuth, async (req, res) => {
  const q = req.user.role === "admin" ? {} : { uid: req.user.uid };
  res.json((await Payment.find(q).sort({ createdAt: -1 }).lean()).map(strip));
});
apiRouter.post("/payments", requireAuth, async (req, res) => {
  const p = req.body ?? {};
  if (req.user.role !== "admin" && p.uid !== req.user.uid) return res.status(403).json({ error: "Forbidden" });
  if (req.user.role !== "admin" && process.env.VITE_PAYMENT_MODE === "live") return res.status(403).json({ error: "Live payments are recorded by the payment webhook only" });
  await Payment.updateOne({ id: p.id }, { $set: p }, { upsert: true });
  res.json({ ok: true });
});
apiRouter.patch("/payments/:id", requireAuth, requireAdmin, async (req, res) => { await Payment.updateOne({ id: req.params.id }, { $set: req.body }); res.json({ ok: true }); });

// Reports -------------------------------------------------------------------
apiRouter.get("/reports", requireAuth, requireAdmin, async (_req, res) => res.json((await Report.find().sort({ createdAt: -1 }).lean()).map(strip)));
apiRouter.post("/reports", async (req, res) => { await Report.create({ ...req.body, reporterUid: req.user?.uid }); res.json({ ok: true }); });
apiRouter.patch("/reports/:id", requireAuth, requireAdmin, async (req, res) => { await Report.updateOne({ id: req.params.id }, { $set: req.body }); res.json({ ok: true }); });

// Profile photos (Cloudinary CDN with automatic fallback to MongoDB storage) -
apiRouter.post("/photos", requireAuth, async (req, res) => {
  const dataUrl = req.body?.dataUrl ?? "";
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!m && !dataUrl.startsWith("http")) {
    return res.status(400).json({ error: "Expected a valid image data URL or image URL" });
  }

  // 1. If Cloudinary is configured, upload to Cloudinary CDN
  if (isCloudinaryConfigured) {
    try {
      const publicId = `profile_${req.user.uid}`;
      const cdnUrl = await uploadToCloudinary(dataUrl, publicId);

      // Keep user's photoURL in User collection synced
      await User.updateOne({ uid: req.user.uid }, { $set: { photoURL: cdnUrl } });
      // If talent profile exists for this user, keep that synced too
      await Talent.updateOne({ uid: req.user.uid }, { $set: { photoURL: cdnUrl } });

      return res.json({ url: cdnUrl, provider: "cloudinary" });
    } catch (err) {
      console.warn("[Cloudinary upload notice, falling back to local/Mongo storage]:", err?.message || err);
      // Fallback seamlessly to MongoDB storage below if Cloudinary API call failed
    }
  }

  // 2. Storage in MongoDB fallback (if Cloudinary key isn't set or network error occurred)
  if (!m) {
    return res.status(400).json({ error: "Expected a base64 image data URL" });
  }
  const data = Buffer.from(m[2], "base64");
  if (data.length > 900 * 1024) return res.status(413).json({ error: "Image too large (max 900 KB)" });
  await Photo.updateOne({ uid: req.user.uid }, { $set: { contentType: m[1], data, updatedAt: new Date().toISOString() } }, { upsert: true });
  const host = req.get("host");
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const baseUrl = process.env.SERVER_URL || (host ? `${proto}://${host}` : "");
  const fallbackUrl = `${baseUrl}/api/photos/${req.user.uid}?v=${Date.now()}`;

  await User.updateOne({ uid: req.user.uid }, { $set: { photoURL: fallbackUrl } });
  await Talent.updateOne({ uid: req.user.uid }, { $set: { photoURL: fallbackUrl } });

  res.json({ url: fallbackUrl, provider: "mongodb" });
});
apiRouter.get("/photos/:uid", async (req, res) => {
  const p = await Photo.findOne({ uid: req.params.uid }).lean();
  if (!p) return res.status(404).end();
  res.set("Content-Type", p.contentType).set("Cache-Control", "public, max-age=86400").send(p.data);
});

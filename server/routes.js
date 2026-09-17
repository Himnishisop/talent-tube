// REST API consumed by src/services/apiDataProvider.ts, plus an SSE stream so
// every connected client (App + Web) sees changes instantly.
import { Router } from "express";
import { Talent, Category, Payment, Report, Photo, User } from "./db.js";
import { attachUser, requireAuth, requireAdmin, publicUser } from "./auth.js";

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
  if (req.user.uid !== req.params.uid && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const u = await User.findOne({ uid: req.params.uid }).lean();
  res.json(u ? publicUser(u) : null);
});
apiRouter.put("/users/:uid", requireAuth, async (req, res) => {
  if (req.user.uid !== req.params.uid && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const { role, ...rest } = req.body ?? {};
  const set = { ...rest };
  // Users may upgrade themselves customer → talent only; admin is never self-assigned.
  if (role === "talent" || (req.user.role === "admin" && role)) set.role = role;
  delete set.passwordHash; delete set.youtube;
  const u = await User.findOneAndUpdate({ uid: req.params.uid }, { $set: set }, { new: true }).lean();
  res.json(publicUser(u));
});

// Talents -------------------------------------------------------------------
apiRouter.get("/talents", async (req, res) => {
  if (req.query.all === "1") {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
    return res.json((await Talent.find().sort({ createdAt: -1 }).lean()).map(strip));
  }
  const list = (await Talent.find({ status: "approved", subscriptionStatus: "active" }).lean()).filter(isPublic).map(publicView);
  list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json(list);
});

apiRouter.get("/talents/:id", async (req, res) => {
  const t = await Talent.findOne({ id: req.params.id }).lean();
  if (!t) return res.json(null);
  const owner = req.user?.uid === t.uid, admin = req.user?.role === "admin";
  if (!isPublic(t) && !owner && !admin) return res.status(404).json(null);
  res.json(strip(t));
});

apiRouter.put("/talents/:id", requireAuth, async (req, res) => {
  const body = { ...(req.body ?? {}) };
  const admin = req.user.role === "admin";
  if (!admin && (req.params.id !== req.user.uid || body.uid !== req.user.uid)) return res.status(403).json({ error: "You can only edit your own profile" });
  if ((body.videos?.length ?? 0) > 5) return res.status(400).json({ error: "Maximum 5 videos" });
  const existing = await Talent.findOne({ id: req.params.id }).lean();
  if (!admin) {
    // Owners cannot touch moderation/subscription fields – keep existing (or safe defaults)
    for (const k of PROTECTED) body[k] = existing ? existing[k] : undefined;
    if (!existing) { body.status = "pending"; body.verified = false; body.featured = false; body.subscriptionStatus = "pending"; }
    // Re-submitting a rejected profile puts it back in review
    if (existing?.status === "rejected") { body.status = "pending"; body.rejectionReason = undefined; }
  }
  body.updatedAt = new Date().toISOString();
  const t = await Talent.findOneAndUpdate({ id: req.params.id }, { $set: body }, { upsert: true, new: true }).lean();
  broadcast("talents", { id: t.id });
  res.json(strip(t));
});

apiRouter.patch("/talents/:id", requireAuth, async (req, res) => {
  const admin = req.user.role === "admin";
  const patch = { ...(req.body ?? {}) };
  const t0 = await Talent.findOne({ id: req.params.id }).lean();
  if (!t0) return res.status(404).json({ error: "Not found" });
  const owner = t0.uid === req.user.uid;
  if (!admin && !owner) return res.status(403).json({ error: "Forbidden" });
  // Test-mode payments activate from the client; in live mode this patch comes from the payment webhook.
  const testPayment = process.env.VITE_PAYMENT_MODE !== "live" && owner;
  if (!admin && !testPayment) for (const k of PROTECTED) delete patch[k];
  patch.updatedAt = new Date().toISOString();
  const t = await Talent.findOneAndUpdate({ id: req.params.id }, { $set: patch }, { new: true }).lean();
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

// Profile photos (small, client-compressed JPEG stored in Mongo) --------------
apiRouter.post("/photos", requireAuth, async (req, res) => {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(req.body?.dataUrl ?? "");
  if (!m) return res.status(400).json({ error: "Expected a base64 image data URL" });
  const data = Buffer.from(m[2], "base64");
  if (data.length > 600 * 1024) return res.status(413).json({ error: "Image too large (max 600 KB after compression)" });
  await Photo.updateOne({ uid: req.user.uid }, { $set: { contentType: m[1], data, updatedAt: new Date().toISOString() } }, { upsert: true });
  res.json({ url: `${process.env.SERVER_URL}/api/photos/${req.user.uid}?v=${Date.now()}` });
});
apiRouter.get("/photos/:uid", async (req, res) => {
  const p = await Photo.findOne({ uid: req.params.uid }).lean();
  if (!p) return res.status(404).end();
  res.set("Content-Type", p.contentType).set("Cache-Control", "public, max-age=86400").send(p.data);
});

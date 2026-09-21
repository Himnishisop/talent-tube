// YouTube Data API v3 – "YouTube as video storage".
//
// Flow:
//   1. GET  /api/youtube/connect        → Google consent (youtube.force-ssl) for the
//                                          signed-in talent; refresh token stored in Mongo.
//   2. GET  /api/youtube/status          → is a channel connected? (name, id)
//   3. GET  /api/youtube/token           → short-lived ACCESS token so the browser can
//                                          upload the file straight to Google (resumable),
//                                          without streaming gigabytes through our server.
//   4. POST /api/youtube/videos          → after upload, register {videoId}; we verify it
//                                          with videos.list, force the configured privacy
//                                          (unlisted by default) and save it to Mongo.
//   5. PATCH /api/youtube/videos/:id/privacy, DELETE /api/youtube/videos/:id
//   6. POST /api/youtube/disconnect
//
// Why UNLISTED and not PRIVATE: YouTube refuses to embed private videos for
// anyone but the owner, so they would show "Video unavailable" inside our app.
// Unlisted videos are hidden from YouTube search / channel page / suggestions
// and are only reachable through the embed – i.e. inside Talent Tube.
import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { User, Video } from "./db.js";
import { attachUser, requireAuth, getBaseUrl } from "./auth.js";

const env = process.env;
const SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl", "openid", "email"];
const YT = "https://www.googleapis.com/youtube/v3";
const DEFAULT_PRIVACY = ["unlisted", "private", "public"].includes(env.YOUTUBE_DEFAULT_PRIVACY) ? env.YOUTUBE_DEFAULT_PRIVACY : "unlisted";

const client = (req) => {
  const base = getBaseUrl(req);
  return new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, `${base}/api/youtube/callback`);
};

/** Fresh access token for a user's connected channel (auto-refreshed). */
async function accessTokenFor(uid) {
  const user = await User.findOne({ uid }).select("+youtube");
  const rt = user?.youtube?.refreshToken;
  if (!rt) return null;
  const c = client();
  c.setCredentials({ refresh_token: rt });
  const { token, res } = await c.getAccessToken();
  const expiry = res?.data?.expires_in ? Date.now() + res.data.expires_in * 1000 : Date.now() + 55 * 60 * 1000;
  return { token, expiry, channelId: user.youtube.channelId, channelTitle: user.youtube.channelTitle };
}

async function ytFetch(token, path, init = {}) {
  const r = await fetch(`${YT}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.error?.message ?? `YouTube API ${r.status}`);
  return body;
}

export const youtubeRouter = Router();
youtubeRouter.use(attachUser);

// 1. Start consent -----------------------------------------------------------
youtubeRouter.get("/connect", requireAuth, (req, res) => {
  const base = getBaseUrl(req);
  const state = Buffer.from(JSON.stringify({ uid: req.user.uid, redirect: req.query.redirect ?? base })).toString("base64url");
  res.json({ url: client(req).generateAuthUrl({ access_type: "offline", prompt: "consent", include_granted_scopes: true, scope: SCOPES, state }) });
});

youtubeRouter.get("/callback", async (req, res) => {
  try {
    const { uid, redirect } = JSON.parse(Buffer.from(String(req.query.state ?? ""), "base64url").toString());
    const c = client(req);
    const { tokens } = await c.getToken(String(req.query.code));
    if (!tokens.refresh_token) throw new Error("Google did not return a refresh token. Remove the app at myaccount.google.com/permissions and connect again.");
    const me = await ytFetch(tokens.access_token, "/channels?part=snippet&mine=true");
    const ch = me.items?.[0];
    await User.updateOne({ uid }, { $set: { youtube: { channelId: ch?.id, channelTitle: ch?.snippet?.title, refreshToken: tokens.refresh_token, scope: tokens.scope, connectedAt: new Date().toISOString() } } });
    const base = String(redirect || env.CLIENT_ORIGIN).split("#")[0];
    res.redirect(`${base}#/register?youtube=connected`);
  } catch (e) {
    console.error(e);
    res.status(400).send(`YouTube connection failed: ${e.message}`);
  }
});

// 2. Status -------------------------------------------------------------------
youtubeRouter.get("/status", requireAuth, async (req, res) => {
  const user = await User.findOne({ uid: req.user.uid }).select("+youtube").lean();
  const yt = user?.youtube;
  res.json({ connected: !!yt?.refreshToken, channelId: yt?.channelId ?? null, channelTitle: yt?.channelTitle ?? null, defaultPrivacy: DEFAULT_PRIVACY });
});

// 3. Access token for direct browser → Google resumable upload ---------------
youtubeRouter.get("/token", requireAuth, async (req, res) => {
  try {
    const t = await accessTokenFor(req.user.uid);
    if (!t) return res.status(409).json({ error: "YouTube channel not connected" });
    res.json({ accessToken: t.token, expiresAt: t.expiry, channelId: t.channelId, defaultPrivacy: DEFAULT_PRIVACY });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Register an uploaded video ----------------------------------------------
youtubeRouter.post("/videos", requireAuth, async (req, res) => {
  const { videoId, title, sizeBytes } = req.body ?? {};
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId ?? "")) return res.status(400).json({ error: "Invalid videoId" });
  try {
    const t = await accessTokenFor(req.user.uid);
    if (!t) return res.status(409).json({ error: "YouTube channel not connected" });
    // Verify the video exists on the user's channel and lock privacy + embeddable.
    const info = await ytFetch(t.token, `/videos?part=snippet,status&id=${videoId}`);
    const item = info.items?.[0];
    if (!item) return res.status(404).json({ error: "Video not found on YouTube yet. Try again in a moment." });
    if (item.snippet.channelId !== t.channelId) return res.status(403).json({ error: "Video belongs to a different channel" });
    const wanted = req.body.privacyStatus && ["unlisted", "private"].includes(req.body.privacyStatus) ? req.body.privacyStatus : DEFAULT_PRIVACY;
    if (item.status.privacyStatus !== wanted || item.status.embeddable === false) {
      await ytFetch(t.token, "/videos?part=status", { method: "PUT", body: JSON.stringify({ id: videoId, status: { privacyStatus: wanted, embeddable: true, selfDeclaredMadeForKids: false } }) });
    }
    const doc = await Video.findOneAndUpdate(
      { videoId },
      { $set: { uid: req.user.uid, channelId: t.channelId, title: title ?? item.snippet.title, privacyStatus: wanted, sizeBytes, createdAt: new Date().toISOString() } },
      { upsert: true, new: true }
    );
    res.json({ videoId, title: doc.title, privacyStatus: wanted, url: `https://www.youtube.com/watch?v=${videoId}`, processing: item.status.uploadStatus !== "processed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

youtubeRouter.get("/videos", requireAuth, async (req, res) => res.json(await Video.find({ uid: req.user.uid }).sort({ createdAt: -1 }).lean()));

// 5. Privacy / delete ---------------------------------------------------------
youtubeRouter.patch("/videos/:id/privacy", requireAuth, async (req, res) => {
  const { privacyStatus } = req.body ?? {};
  if (!["unlisted", "private"].includes(privacyStatus)) return res.status(400).json({ error: "privacyStatus must be unlisted or private" });
  const v = await Video.findOne({ videoId: req.params.id, uid: req.user.uid });
  if (!v) return res.status(404).json({ error: "Not found" });
  try {
    const t = await accessTokenFor(req.user.uid);
    await ytFetch(t.token, "/videos?part=status", { method: "PUT", body: JSON.stringify({ id: v.videoId, status: { privacyStatus, embeddable: true } }) });
    v.privacyStatus = privacyStatus; await v.save();
    res.json({ ok: true, privacyStatus });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

youtubeRouter.delete("/videos/:id", requireAuth, async (req, res) => {
  const v = await Video.findOne({ videoId: req.params.id, uid: req.user.uid });
  if (!v) return res.status(404).json({ error: "Not found" });
  try {
    const t = await accessTokenFor(req.user.uid);
    if (req.query.fromYouTube === "1") await ytFetch(t.token, `/videos?id=${v.videoId}`, { method: "DELETE" });
    await v.deleteOne();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. Disconnect ---------------------------------------------------------------
youtubeRouter.post("/disconnect", requireAuth, async (req, res) => {
  const user = await User.findOne({ uid: req.user.uid }).select("+youtube");
  const rt = user?.youtube?.refreshToken;
  if (rt) { try { await client().revokeToken(rt); } catch { /* already revoked */ } }
  await User.updateOne({ uid: req.user.uid }, { $unset: { youtube: 1 } });
  res.json({ ok: true });
});

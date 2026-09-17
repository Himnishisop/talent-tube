// Talent Tube API server – MongoDB + Google OAuth + YouTube Data API v3.
//   node server/index.js        (reads ./.env)
import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./db.js";
import { authRouter } from "./auth.js";
import { youtubeRouter } from "./youtube.js";
import { apiRouter } from "./routes.js";

const required = ["MONGODB_URI", "JWT_SECRET", "SERVER_URL", "CLIENT_ORIGIN"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✗ Missing in .env: ${missing.join(", ")}`);
  process.exit(1);
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("! GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set – Google sign-in and YouTube uploads are disabled until you add them.");
}

const app = express();
const origins = process.env.CLIENT_ORIGIN.split(",").map((s) => s.trim());
app.use(cors({ origin: origins, credentials: false }));
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => res.json({ ok: true, service: "talent-tube-api", youtube: !!process.env.GOOGLE_CLIENT_ID }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/youtube", youtubeRouter);
app.use("/api", apiRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Server error" });
});

const port = Number(process.env.PORT ?? 8787);
connectDb(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log(`✓ API listening on ${process.env.SERVER_URL} (port ${port})`)))
  .catch((e) => { console.error("✗ MongoDB connection failed:", e.message); process.exit(1); });

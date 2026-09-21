// Talent Tube API server – MongoDB + Google OAuth + YouTube Data API v3.
//   node server/index.js        (reads ./.env)
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { connectDb, Category, Talent, User } from "./db.js";
import { authRouter } from "./auth.js";
import { youtubeRouter } from "./youtube.js";
import { apiRouter } from "./routes.js";

// Port 3000 is hardcoded by infrastructure and reverse proxy
const PORT = 3000;
const app = express();

const origins = (process.env.CLIENT_ORIGIN ?? "*").split(",").map((s) => s.trim());
app.use(cors({ origin: origins.includes("*") ? "*" : origins, credentials: false }));
app.use(express.json({ limit: "5mb" }));

// Status & Health checks
app.get("/health", (_req, res) => res.json({ ok: true, status: "healthy" }));
app.get("/api/health", (_req, res) => res.json({
  ok: true,
  database: "mongodb",
  googleAuth: !!process.env.GOOGLE_CLIENT_ID,
  youtubeApi: !!process.env.GOOGLE_CLIENT_ID,
}));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/youtube", youtubeRouter);
app.use("/api", apiRouter);

// Frontend Vite Integration (Single port 3000 for both API and Frontend)
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true, host: "0.0.0.0" },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Error handling
app.use((err, req, res, _next) => {
  if (err.name === "MongooseError" || err.name === "MongoNetworkError" || err.message?.includes("buffering timed out")) {
    console.warn("[Talent Tube] MongoDB offline — serving request with empty/offline state");
    if (req.method === "GET") {
      return res.json(req.path.endsWith("s") || req.path.endsWith("s/") ? [] : {});
    }
    return res.status(503).json({ error: "Database offline. Please check MONGODB_URI." });
  }
  console.error("[Talent Tube Server Error]", err);
  res.status(500).json({ error: err.message ?? "Internal Server Error" });
});

export { app };

let dbConnected = false;
export async function ensureDbConnected() {
  if (dbConnected) return;
  if (process.env.MONGODB_URI) {
    try {
      await connectDb(process.env.MONGODB_URI);
      dbConnected = true;
    } catch (e) {
      console.warn("MongoDB connection warning:", e.message);
    }
  }
}

async function start() {
  await ensureDbConnected();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✓ Talent Tube running on http://0.0.0.0:${PORT}`);
  });
}

// Only launch standalone listener when not in Vercel serverless environment
if (!process.env.VERCEL) {
  start();
}



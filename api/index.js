import { app, ensureDbConnected } from "../server/index.js";

export default async function handler(req, res) {
  try {
    await ensureDbConnected();
  } catch (err) {
    console.error("[Vercel Startup Warning] DB connect error:", err.message);
  }
  return app(req, res);
}

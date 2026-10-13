import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Inject Google Search Console verification meta if defined via environment
const envGsc = (import.meta.env.VITE_GOOGLE_SITE_VERIFICATION as string | undefined)?.trim();
if (envGsc) {
  const gscMeta = document.getElementById("google-site-verification") as HTMLMetaElement | null;
  if (gscMeta && !gscMeta.content) {
    gscMeta.content = envGsc;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

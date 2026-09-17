import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CloudUpload, Link2, Loader2, Lock, ShieldCheck, Unlink, MonitorPlay as Youtube } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isApiConfigured } from "@/lib/api";
import { connectYouTube, disconnectYouTube, getYouTubeStatus, uploadToYouTube, type PrivacyChoice, type YouTubeStatus } from "@/lib/youtubeUpload";
import { Button } from "./ui";
import { cn } from "@/utils/cn";

/**
 * "Upload to my YouTube" – lets a talent push a video from their phone straight
 * to THEIR OWN YouTube channel (unlisted), then hands the resulting URL back
 * to the form. Requires the API server (VITE_API_URL) + Google credentials.
 */
export function YouTubeUploader({ onUploaded, disabled, compact }: { onUploaded: (url: string, title: string) => void; disabled?: boolean; compact?: boolean }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<YouTubeStatus | null | "loading">("loading");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState<PrivacyChoice>("unlisted");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = () => {
    if (!isApiConfigured || !user) return setStatus(null);
    getYouTubeStatus().then((s) => { setStatus(s); setPrivacy(s.defaultPrivacy === "private" ? "private" : "unlisted"); }).catch(() => setStatus(null));
  };
  useEffect(refresh, [user]);

  if (!isApiConfigured) {
    return (
      <div className="rounded-xl border border-dashed border-line p-4 text-xs text-muted">
        <p className="flex items-center gap-2 font-semibold text-silver"><Youtube className="h-4 w-4 text-neon" /> Upload to your YouTube</p>
        <p className="mt-1">Available once the API server is running (set <code className="text-silver">VITE_API_URL</code> and Google credentials in <code className="text-silver">.env</code>). Until then, paste YouTube links above.</p>
      </div>
    );
  }
  if (!user) return null;
  if (status === "loading") return <div className="flex items-center gap-2 text-xs text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Checking YouTube connection…</div>;

  const start = async () => {
    if (!file) return;
    setError(""); setDone(null); setProgress(0);
    abortRef.current = new AbortController();
    try {
      const v = await uploadToYouTube({ file, title: title.trim() || file.name.replace(/\.[^.]+$/, ""), privacy, onProgress: (f) => setProgress(f), signal: abortRef.current.signal });
      setDone(v.videoId);
      onUploaded(v.url, v.title);
      setFile(null); setTitle("");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className={cn("rounded-xl border border-neon/30 bg-neon/5 p-4", compact && "p-3")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold"><Youtube className="h-4 w-4 text-neon" /> Upload to your YouTube</p>
          <p className="mt-0.5 text-[11px] text-muted">Saved on <b className="text-silver">your own channel</b> as {privacy}. It won't appear in YouTube search or on your channel page — only here on Talent Tube.</p>
        </div>
        {status?.connected && (
          <button type="button" onClick={async () => { await disconnectYouTube(); refresh(); }} className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted hover:text-rose-300" title="Disconnect channel"><Unlink className="h-3.5 w-3.5" /> Disconnect</button>
        )}
      </div>

      {!status?.connected ? (
        <Button type="button" className="mt-3" size="sm" icon={<Link2 className="h-4 w-4" />} disabled={disabled} onClick={() => connectYouTube().catch((e) => setError(e.message))}>
          Connect my YouTube channel
        </Button>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Connected: {status.channelTitle ?? status.channelId}</p>
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { setFile(f); setTitle(f.name.replace(/\.[^.]+$/, "")); setDone(null); setError(""); } }} />
          {!file ? (
            <Button type="button" size="sm" variant="outline" icon={<CloudUpload className="h-4 w-4" />} disabled={disabled || progress !== null} onClick={() => inputRef.current?.click()}>Choose a video</Button>
          ) : (
            <div className="space-y-2 rounded-lg border border-line bg-field p-3">
              <p className="truncate text-xs text-silver">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title" className="h-10 w-full rounded-lg border border-line bg-panel px-3 text-sm text-heading outline-none focus:border-neon" disabled={progress !== null} />
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="text-muted">Visibility:</span>
                {(["unlisted", "private"] as PrivacyChoice[]).map((p) => (
                  <button key={p} type="button" onClick={() => setPrivacy(p)} disabled={progress !== null} className={cn("rounded-md border px-2 py-1 capitalize", privacy === p ? "border-neon bg-neon/15 text-neon" : "border-line text-muted")}>{p}</button>
                ))}
                {privacy === "private" && <span className="flex items-center gap-1 text-amber-200"><Lock className="h-3 w-3" /> Private videos can't be embedded — visitors will see "Video unavailable".</span>}
              </div>
              {progress === null ? (
                <div className="flex gap-2">
                  <Button type="button" size="sm" icon={<CloudUpload className="h-4 w-4" />} onClick={start}>Upload</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setFile(null)}>Cancel</Button>
                </div>
              ) : (
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-panel-raised"><div className="h-full bg-neon transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                    <span>{progress < 1 ? `Uploading… ${Math.round(progress * 100)}%` : "Finishing on YouTube…"}</span>
                    <button type="button" onClick={() => abortRef.current?.abort()} className="hover:text-rose-300">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {done && <p className="flex items-center gap-1.5 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Uploaded! Added to your videos. YouTube may take a minute to finish processing.</p>}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

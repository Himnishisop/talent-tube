// ---------------------------------------------------------------------------
// Browser → YouTube resumable upload (YouTube Data API v3, videos.insert).
//
// The file goes DIRECTLY from the user's device to Google using a short-lived
// access token issued by our server for the talent's connected channel. Our
// server never sees the video bytes. After Google returns the videoId we
// register it with the server, which verifies ownership, forces the privacy
// setting (unlisted by default) and stores it in MongoDB.
//
// Docs: https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
// ---------------------------------------------------------------------------
import { api } from "./api";

export interface YouTubeStatus { connected: boolean; channelId: string | null; channelTitle: string | null; defaultPrivacy: "unlisted" | "private" | "public" }
export interface UploadedVideo { videoId: string; title: string; privacyStatus: string; url: string; processing: boolean }
export type PrivacyChoice = "unlisted" | "private";

export const getYouTubeStatus = () => api<YouTubeStatus>("/api/youtube/status");
export const disconnectYouTube = () => api("/api/youtube/disconnect", { method: "POST" });

/** Redirects to Google consent. Comes back to #/register?youtube=connected */
export async function connectYouTube(returnTo = window.location.href) {
  const { url } = await api<{ url: string }>(`/api/youtube/connect?redirect=${encodeURIComponent(returnTo.split("#")[0])}`);
  window.location.href = url;
}

const UPLOAD_ENDPOINT = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
const CHUNK = 8 * 1024 * 1024; // 8 MB chunks (must be a multiple of 256 KB)

export interface UploadOptions {
  file: File;
  title: string;
  description?: string;
  privacy?: PrivacyChoice;
  onProgress?: (fraction: number, uploadedBytes: number) => void;
  signal?: AbortSignal;
}

export async function uploadToYouTube({ file, title, description, privacy, onProgress, signal }: UploadOptions): Promise<UploadedVideo> {
  if (!file.type.startsWith("video/")) throw new Error("Please choose a video file.");
  const { accessToken, defaultPrivacy } = await api<{ accessToken: string; expiresAt: number; defaultPrivacy: PrivacyChoice }>("/api/youtube/token");
  const privacyStatus = privacy ?? defaultPrivacy ?? "unlisted";

  // 1. Start a resumable session (metadata only)
  const start = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(file.size),
      "X-Upload-Content-Type": file.type,
    },
    body: JSON.stringify({
      snippet: { title: title.slice(0, 100) || file.name, description: (description ?? "Uploaded via Talent Tube").slice(0, 5000), categoryId: "24" /* Entertainment */ },
      status: { privacyStatus, embeddable: true, selfDeclaredMadeForKids: false },
    }),
  });
  if (!start.ok) {
    const err = await start.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `YouTube refused the upload (${start.status})`);
  }
  const sessionUrl = start.headers.get("Location");
  if (!sessionUrl) throw new Error("YouTube did not return an upload session URL.");

  // 2. Send the file in chunks with progress (XHR gives us upload progress events)
  let offset = 0;
  let result: { id?: string } | null = null;
  while (offset < file.size) {
    const end = Math.min(offset + CHUNK, file.size);
    const chunk = file.slice(offset, end);
    // eslint-disable-next-line no-await-in-loop
    const r = await putChunk(sessionUrl, chunk, offset, end - 1, file.size, (loaded) => onProgress?.((offset + loaded) / file.size, offset + loaded), signal);
    if (r.status === 308) {
      const range = r.headers["range"];
      offset = range ? Number(range.split("-")[1]) + 1 : end;
    } else if (r.status >= 200 && r.status < 300) {
      result = JSON.parse(r.body || "{}");
      offset = file.size;
    } else {
      throw new Error(`Upload failed at ${Math.round((offset / file.size) * 100)}% (HTTP ${r.status}). Please try again.`);
    }
  }
  onProgress?.(1, file.size);
  if (!result?.id) throw new Error("Upload finished but YouTube returned no video ID.");

  // 3. Register with our server (verifies channel, locks privacy, saves to MongoDB)
  return api<UploadedVideo>("/api/youtube/videos", { method: "POST", json: { videoId: result.id, title, privacyStatus, sizeBytes: file.size } });
}

function putChunk(url: string, chunk: Blob, start: number, end: number, total: number, onLoaded: (n: number) => void, signal?: AbortSignal) {
  return new Promise<{ status: number; body: string; headers: Record<string, string> }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Range", `bytes ${start}-${end}/${total}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onLoaded(e.loaded);
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText, headers: { range: xhr.getResponseHeader("Range") ?? "" } });
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(chunk);
  });
}

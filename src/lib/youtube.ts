// ---------------------------------------------------------------------------
// YouTube helpers.
// Talent Tube never stores or uploads video files. We only store the 11-char
// YouTube video ID and render it with the official YouTube embed player.
// ---------------------------------------------------------------------------

const YT_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts a YouTube video ID from any common YouTube URL format:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/shorts/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://m.youtube.com/watch?v=VIDEO_ID&feature=share
 *  - https://www.youtube.com/live/VIDEO_ID
 * Returns null if the URL is not a valid YouTube URL.
 */
export function extractYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // Bare video id
  if (YT_ID_REGEX.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  if (!["youtube.com", "youtu.be", "youtube-nocookie.com", "music.youtube.com"].includes(host)) {
    return null;
  }

  let id: string | null = null;

  if (host === "youtu.be") {
    id = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else {
    const v = url.searchParams.get("v");
    if (v) {
      id = v;
    } else {
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => ["shorts", "embed", "live", "v"].includes(p));
      if (idx !== -1 && parts[idx + 1]) id = parts[idx + 1];
    }
  }

  if (id && YT_ID_REGEX.test(id)) return id;
  return null;
}

export function isValidYouTubeUrl(input: string): boolean {
  return extractYouTubeId(input) !== null;
}

/** Privacy-enhanced player with English interface controls. */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1&hl=en`;
}

export function youtubeThumbnail(videoId: string, quality: "hq" | "mq" | "max" = "hq"): string {
  const map = { hq: "hqdefault", mq: "mqdefault", max: "maxresdefault" };
  return `https://i.ytimg.com/vi/${videoId}/${map[quality]}.jpg`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

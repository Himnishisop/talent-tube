import { useState } from "react";
import { Play } from "lucide-react";
import { youtubeEmbedUrl, youtubeThumbnail } from "@/lib/youtube";

/**
 * Lightweight YouTube embed ("facade" pattern):
 * shows the thumbnail first and only loads the iframe when tapped.
 * Saves data on mobile networks and keeps pages fast.
 */
export function YouTubeEmbed({ videoId, title }: { videoId: string; title?: string }) {
  const [active, setActive] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="relative aspect-video w-full">
        {active ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`${youtubeEmbedUrl(videoId)}&autoplay=1`}
            title={title ?? "YouTube video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            className="group absolute inset-0 flex h-full w-full items-center justify-center"
            aria-label={`Play ${title ?? "video"}`}
          >
            <img src={youtubeThumbnail(videoId)} alt={title ?? "Video thumbnail"} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-neon text-canvas shadow-lg transition group-hover:scale-110">
              <Play className="ml-1 h-7 w-7 fill-current" />
            </span>
          </button>
        )}
      </div>
      {title && <p className="truncate px-3 py-3 text-sm font-medium text-silver">{title}</p>}
    </div>
  );
}

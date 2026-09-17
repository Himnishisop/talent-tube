import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Volume2, VolumeX, X, Minimize2, Play } from "lucide-react";
import { loadYouTubeApi, type YTPlayer } from "@/lib/youtubeApi";
import { cn } from "@/utils/cn";

/**
 * Floating "Best Video" player built on the official YouTube IFrame Player API.
 *
 * Guest flow:
 *  1. API is loaded asynchronously; the player is created ONCE inside a fixed
 *     bottom-right mini-window with autoplay=1 & mute=1 (browser autoplay policy),
 *     controls=0, rel=0, modestbranding=1, playsinline=1.
 *  2. A "Tap to unmute" pill sits over the mini-player → player.unMute().
 *  3. Tapping the mini-window expands the SAME container (CSS transition) into a
 *     centred lightbox (desktop) / vertical shorts-style sheet (mobile), unmutes,
 *     and reveals controls. Because the iframe is never re-mounted, playback and
 *     position are preserved.
 *  4. Close (X) shrinks it back to the mini-window without stopping playback.
 *
 * Note on controls: YouTube's `controls` is a load-time parameter. To flip it at
 * runtime we keep a lightweight custom control bar in the expanded view
 * (play/pause, seek, mute) driven by the API – so the user can seek or pause
 * exactly as required, without reloading the video.
 */
export function FloatingShowcasePlayer({ videoId, title, talentName }: { videoId: string; title?: string; talentName: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const rafRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  // ---------------------------------------------------------- create player
  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        // The API replaces this element with the iframe.
        const mount = document.createElement("div");
        hostRef.current.appendChild(mount);
        playerRef.current = new YT.Player(mount, {
          videoId,
          width: "100%",
          height: "100%",
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            fs: 0,
            iv_load_policy: 3,
            disablekb: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              e.target.mute();
              e.target.playVideo();
              setDuration(e.target.getDuration());
              setReady(true);
            },
            onStateChange: (e) => {
              setPlaying(e.data === YT.PlayerState.PLAYING);
              if (e.data === YT.PlayerState.ENDED) {
                // Loop the showcase quietly
                e.target.seekTo(0, true);
                e.target.playVideo();
              }
            },
            onError: () => setFailed(true),
          },
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { playerRef.current?.destroy(); } catch { /* already gone */ }
      playerRef.current = null;
      if (host) host.innerHTML = "";
    };
  }, [videoId]);

  // ------------------------------------------------------- progress ticker
  useEffect(() => {
    if (!ready) return;
    const tick = () => {
      const p = playerRef.current;
      if (p) {
        const d = p.getDuration() || duration;
        if (d) setProgress(Math.min(1, p.getCurrentTime() / d));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [ready, duration]);

  // ------------------------------------------------------------- actions
  const unmute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.unMute();
    p.setVolume(100);
    setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted()) { p.unMute(); setMuted(false); } else { p.mute(); setMuted(true); }
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.getPlayerState() === 1) p.pauseVideo(); else p.playVideo();
  }, []);

  const seek = useCallback((ratio: number) => {
    const p = playerRef.current;
    if (!p) return;
    const d = p.getDuration();
    if (d) p.seekTo(ratio * d, true);
  }, []);

  const expand = useCallback(() => {
    setExpanded(true);
    unmute(); // spec: unmute automatically on maximize
  }, [unmute]);

  const shrink = useCallback(() => setExpanded(false), []); // playback continues

  // Esc closes the lightbox; lock body scroll while expanded
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && shrink();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [expanded, shrink]);

  if (dismissed || failed) return null;

  return (
    <>
      {/* Backdrop for the lightbox */}
      <div className={cn("fsp-backdrop", expanded && "fsp-backdrop--on")} onClick={shrink} aria-hidden="true" />

      <div
        className={cn("fsp", expanded ? "fsp--expanded" : "fsp--mini", ready && "fsp--ready")}
        role={expanded ? "dialog" : undefined}
        aria-modal={expanded || undefined}
        aria-label={`${talentName} showcase video`}
      >
        {/* The player iframe lives here permanently */}
        <div ref={hostRef} className="fsp-host" />

        {/* MINI overlay: whole surface expands; pills for unmute/close */}
        {!expanded && (
          <>
            <button type="button" className="fsp-hit" onClick={expand} aria-label="Expand showcase video" />
            <div className="fsp-mini-bar">
              <span className="fsp-label">{title || "Showcase"} · {talentName.split(" ")[0]}</span>
              <Maximize2 className="h-3.5 w-3.5 shrink-0" />
            </div>
            {muted ? (
              <button type="button" className="fsp-unmute" onClick={(e) => { e.stopPropagation(); unmute(); }}>
                <Volume2 className="h-4 w-4" /> Tap to unmute
              </button>
            ) : (
              <button type="button" className="fsp-icon fsp-icon--tl" onClick={(e) => { e.stopPropagation(); toggleMute(); }} aria-label="Mute">
                <VolumeX className="h-4 w-4" />
              </button>
            )}
            <button type="button" className="fsp-icon fsp-icon--tr" onClick={(e) => { e.stopPropagation(); setDismissed(true); }} aria-label="Hide showcase video">
              <X className="h-4 w-4" />
            </button>
            <div className="fsp-progress" style={{ transform: `scaleX(${progress})` }} />
          </>
        )}

        {/* EXPANDED: close + custom controls (play/pause · seek · mute) */}
        {expanded && (
          <>
            <button type="button" className="fsp-close" onClick={shrink} aria-label="Minimize player">
              <X className="h-5 w-5" />
            </button>
            <div className="fsp-controls">
              <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="fsp-ctrl">
                {playing ? <span className="fsp-pause" /> : <Play className="h-5 w-5 fill-current" />}
              </button>
              <input
                type="range" min={0} max={1000} value={Math.round(progress * 1000)}
                onChange={(e) => seek(Number(e.target.value) / 1000)}
                aria-label="Seek" className="fsp-seek"
                style={{ backgroundSize: `${progress * 100}% 100%` }}
              />
              <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="fsp-ctrl">
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <button type="button" onClick={shrink} aria-label="Shrink to mini player" className="fsp-ctrl">
                <Minimize2 className="h-5 w-5" />
              </button>
            </div>
            <p className="fsp-caption">{title || "Primary showcase"} · {talentName}</p>
          </>
        )}
      </div>
    </>
  );
}

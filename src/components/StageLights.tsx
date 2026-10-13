import { useEffect, useState } from "react";

/**
 * Ambient stage-lighting backdrop.
 *
 * Five soft "spotlights" plus two sweeping beams sit in a fixed layer behind
 * the app (z-index 0, pointer-events none). Each light drifts on its own
 * orbit, breathes in intensity and cycles through a curated stage palette
 * (neon green → electric blue → magenta → amber → cyan) on staggered timings,
 * so at any moment the colours are blending rather than switching.
 *
 * - Pure CSS animations (GPU-composited transform/opacity/filter) – no JS loop.
 * - Animations pause while the tab is hidden to save battery.
 * - Respects `prefers-reduced-motion`: lights stay static but still coloured.
 */
// ---------------------------------------------------------------------------
// Twinkling stars: lightweight, calm ambiance scattered over the backdrop.
// 32 stars on desktop, 14 on mobile - ultra-lightweight for low-end CPUs and GPUs.
// ---------------------------------------------------------------------------
interface Star { x: number; y: number; size: number; delay: number; duration: number; bright: boolean }

function makeStars(count: number, seed = 7): Star[] {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  return Array.from({ length: count }, () => ({
    x: Math.round(rnd() * 98 + 1),
    y: Math.round(rnd() * 96 + 2),
    size: Math.round((1.2 + rnd() * 1.6) * 10) / 10,  // 1.2 – 2.8px
    delay: -Math.round(rnd() * 8 * 10) / 10,
    duration: Math.round((3.5 + rnd() * 4) * 10) / 10, // 3.5 – 7.5s calm twinkle
    bright: rnd() > 0.8,                               // ~20% neon tint
  }));
}

const STARS_DESKTOP = makeStars(32);
const STARS_MOBILE = STARS_DESKTOP.slice(0, 14);

function StarField() {
  const [stars, setStars] = useState<Star[]>(() => (typeof window !== "undefined" && window.innerWidth < 640 ? STARS_MOBILE : STARS_DESKTOP));
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setStars(mq.matches ? STARS_MOBILE : STARS_DESKTOP);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="star-field">
      {stars.map((st, i) => (
        <span
          key={i}
          className={`star ${st.bright ? "star--bright" : ""}`}
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.size,
            height: st.size,
            animationDelay: `${st.delay}s`,
            animationDuration: `${st.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export function StageLights() {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div className={`stage-lights ${paused ? "stage-lights--paused" : ""}`} aria-hidden="true">
      <StarField />
      <div className="stage-light stage-light--1" />
      <div className="stage-light stage-light--2" />
      <div className="stage-light stage-light--3" />
      <div className="stage-light stage-light--4" />
      <div className="stage-light stage-light--5" />
      <div className="stage-beam stage-beam--left" />
      <div className="stage-beam stage-beam--right" />
      <div className="stage-haze" />
    </div>
  );
}

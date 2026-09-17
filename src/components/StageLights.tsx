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
// Twinkling stars: tiny glowing dots scattered over the backdrop that fade in
// and out on their own timings. Generated once with a seeded PRNG so the sky
// is identical on every render/visit. Fewer stars on small screens.
// ---------------------------------------------------------------------------
interface Star { x: number; y: number; size: number; delay: number; duration: number; bright: boolean; drift: number }

function makeStars(count: number, seed = 7): Star[] {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  return Array.from({ length: count }, () => ({
    x: rnd() * 100,
    y: rnd() * 100,
    size: 1 + rnd() * 2.2,          // 1 – 3.2px
    delay: -rnd() * 12,             // negative → already mid-cycle on load
    duration: 2.4 + rnd() * 5.5,    // 2.4 – 7.9s twinkle cycle
    bright: rnd() > 0.78,           // ~22% get a neon/blue glow, rest are silver
    drift: (rnd() - 0.5) * 14,      // slow vertical float in px
  }));
}

const STARS_DESKTOP = makeStars(140);
const STARS_MOBILE = STARS_DESKTOP.slice(0, 60);

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
            animationDelay: `${st.delay}s, ${st.delay}s`,
            animationDuration: `${st.duration}s, ${st.duration * 3}s`,
            ["--drift" as string]: `${st.drift}px`,
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

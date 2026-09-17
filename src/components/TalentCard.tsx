import { Link } from "react-router-dom";
import { MapPin, Briefcase, Play, ArrowUpRight } from "lucide-react";
import type { Category, Talent } from "@/lib/types";
import { Avatar, FeaturedBadge, VerifiedBadge } from "./ui";
import { getCountry } from "@/lib/geo";

/**
 * Search/list card. Intentionally does NOT show phone numbers –
 * contact buttons live on the profile page.
 */
export function TalentCard({ talent, category, compact }: { talent: Talent; category?: Category; compact?: boolean }) {
  const catName = category?.name ?? talent.categoryId;
  const cover = talent.videos[0]?.videoId;
  const place = `${talent.city}, ${getCountry(talent.country).name}`;

  if (compact) {
    return (
      <Link
        to={`/talent/${talent.id}`}
        className="spotlight-card group"
        aria-label={`View ${talent.fullName}, ${catName} in ${talent.city}`}
      >
        <div className="spotlight-photo">
          <span className="absolute inset-0 flex items-center justify-center font-display text-6xl text-silver/30" aria-hidden="true">{talent.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
          {talent.photoURL && <img src={talent.photoURL} alt={talent.fullName} className="talent-cover" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
        </div>
        <div className="spotlight-info">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neon">{catName}</p>
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-display text-[22px] font-semibold tracking-tight">{talent.fullName}</h3>{talent.verified && <VerifiedBadge small />}</div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><MapPin className="h-3.5 w-3.5" />{place}</p>
          <div className="mt-5 flex items-center justify-between border-t border-line/70 pt-4 text-xs"><span className="text-muted">{talent.experienceYears} years of experience</span><span className="inline-flex items-center gap-2 font-semibold text-heading group-hover:text-neon">View profile <ArrowUpRight className="h-4 w-4" /></span></div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/talent/${talent.id}`}
      className="talent-card flex gap-3 rounded-xl border border-line bg-panel p-4 active:scale-[0.99]"
    >
      <div className="relative shrink-0">
        <Avatar src={talent.photoURL} name={talent.fullName} size={72} className="rounded-2xl" />
        {cover && (
          <span className="absolute -bottom-1 -right-1 rounded-md border-2 border-panel bg-neon p-0.5 text-canvas">
            <Play className="h-3 w-3 fill-current" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{talent.fullName}</p>
            <p className="truncate text-sm text-neon">
              {catName} · {talent.subCategory}
            </p>
          </div>
          {talent.featured && <FeaturedBadge />}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {place}
          </span>
          <span className="inline-flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" /> {talent.experienceYears}+ yrs
          </span>
          {talent.verified && <VerifiedBadge small />}
        </div>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{talent.description}</p>
      </div>
    </Link>
  );
}

import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { groupSubCategories } from "@/components/SubCategoryOptions";

export function CategoriesPage() {
  const { categories } = useCategories();

  return (
    <div className="animate-fade-up">
      <p className="section-kicker">A world of creativity</p>
      <h1 className="page-title">Find your kind of talent.</h1>
      <p className="mb-9 mt-3 max-w-xl text-sm leading-relaxed text-muted">From the first note to the final frame. Explore creative professionals by category and specialty.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="rounded-xl border border-line bg-panel p-5">
            <Link to={`/search?category=${c.id}`} className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-neon/10 text-neon"><CategoryIcon id={c.id} iconKey={c.icon} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">{c.subCategories.length} specialties</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Link>
            <details className="mt-4 border-t border-line pt-2">
              <summary className="cursor-pointer py-3 text-xs font-semibold text-silver">Explore specialties</summary>
              <div className="grid grid-cols-1 pb-1">
                {groupSubCategories(c.subCategories).map((group) => (
                  <div key={group.label || "all"}>
                    {group.label && <p className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-neon first:mt-1">{group.label}</p>}
                    {group.items.map((s) => <Link key={s} to={`/search?category=${c.id}&sub=${encodeURIComponent(s)}`} className="flex min-h-10 items-center justify-between gap-2 text-xs text-muted transition-colors hover:text-neon">{s}<ChevronRight className="h-3.5 w-3.5 shrink-0" /></Link>)}
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

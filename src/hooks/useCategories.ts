import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { dataService } from "@/services";

let cache: Category[] | null = null;

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let alive = true;
    dataService
      .listCategories()
      .then((c) => {
        cache = c;
        if (alive) setCategories(c);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const byId = (id: string) => categories.find((c) => c.id === id);
  return { categories: categories.filter((c) => c.active), allCategories: categories, byId, loading, invalidate: () => (cache = null) };
}

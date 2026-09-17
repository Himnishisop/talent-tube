import { useEffect, useMemo, useState } from "react";
import type { Category, Talent, TalentFilters } from "@/lib/types";
import { applyTalentFilters, dataService } from "@/services";

/**
 * Subscribes to the shared talent database and re-renders the moment anything
 * changes (new registration from the App, admin approval, edits…).
 * Filters are applied client-side on the live list so search feels instant.
 */
export function useLiveTalents(filters?: TalentFilters, categories: Category[] = []) {
  const [all, setAll] = useState<Talent[] | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    const unsub = dataService.subscribePublicTalents((list) => {
      setAll(list);
      setLastUpdate(Date.now());
    });
    return unsub;
  }, []);

  const key = JSON.stringify(filters ?? {});
  const talents = useMemo(
    () => (all ? applyTalentFilters(all, filters, categories) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, key, categories]
  );

  return { talents, all, loading: all === null, lastUpdate };
}

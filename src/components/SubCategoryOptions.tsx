import { instrumentGroupOf } from "@/lib/constants";

/**
 * Renders <option>s for a category's specialties. When the specialties belong
 * to known groups (e.g. the Musician instrument list), they are shown inside
 * <optgroup>s so long lists stay scannable. Unknown/custom entries fall into
 * an "Other" group; categories with no grouping render a flat list.
 */
export function SubCategoryOptions({ subCategories }: { subCategories: string[] }) {
  const groups = new Map<string, string[]>();
  let grouped = 0;
  for (const s of subCategories) {
    const g = instrumentGroupOf(s);
    if (g) grouped++;
    const key = g ?? "Other";
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  // Flat list unless most items are grouped (keeps non-musician categories simple).
  if (grouped < subCategories.length / 2) {
    return <>{subCategories.map((s) => <option key={s} value={s}>{s}</option>)}</>;
  }

  return (
    <>
      {Array.from(groups.entries()).map(([label, items]) => (
        <optgroup key={label} label={label}>
          {items.map((s) => <option key={s} value={s}>{s}</option>)}
        </optgroup>
      ))}
    </>
  );
}

/** Same grouping, returned as data (for non-<select> UIs like the Categories page). */
export function groupSubCategories(subCategories: string[]): { label: string; items: string[] }[] {
  const groups = new Map<string, string[]>();
  let grouped = 0;
  for (const s of subCategories) {
    const g = instrumentGroupOf(s);
    if (g) grouped++;
    const key = g ?? "Other";
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  if (grouped < subCategories.length / 2) return [{ label: "", items: subCategories }];
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

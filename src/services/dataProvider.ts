import type { AppUser, Category, Payment, Report, Talent, TalentFilters } from "@/lib/types";
import { getCountry } from "@/lib/geo";

// ---------------------------------------------------------------------------
// DataProvider abstraction.
// The UI only talks to this interface. This makes it trivial to:
//  • run a demo/offline mode (LocalDataProvider)
//  • use Firebase in production (FirestoreDataProvider)
//  • reuse the exact same service layer in a React Native / Capacitor app.
// ---------------------------------------------------------------------------
export interface DataProvider {
  // Users
  getUser(uid: string): Promise<AppUser | null>;
  saveUser(user: AppUser): Promise<void>;

  // Talents
  getTalent(id: string): Promise<Talent | null>;
  listPublicTalents(filters?: TalentFilters): Promise<Talent[]>;
  listAllTalents(): Promise<Talent[]>; // admin only
  saveTalent(talent: Talent): Promise<void>;
  updateTalent(id: string, patch: Partial<Talent>): Promise<void>;
  deleteTalent(id: string): Promise<void>;

  // Categories
  listCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  // Payments
  listPayments(): Promise<Payment[]>;
  createPayment(payment: Payment): Promise<void>;
  updatePayment(id: string, patch: Partial<Payment>): Promise<void>;

  // Reports
  listReports(): Promise<Report[]>;
  createReport(report: Report): Promise<void>;
  updateReport(id: string, patch: Partial<Report>): Promise<void>;

  // Storage (profile photos only)
  uploadProfilePhoto(uid: string, file: File): Promise<string>;

  /**
   * Real-time stream of publicly visible talents. Fires immediately with the
   * current list and again on every change. Returns an unsubscribe function.
   *  • Firestore: onSnapshot listener (syncs across every device instantly).
   *  • Demo/local: BroadcastChannel + storage events (syncs across tabs/windows
   *    on the same device instantly).
   */
  subscribePublicTalents(cb: (talents: Talent[]) => void): () => void;
}

/** Client-side filtering shared by both providers. */
export function applyTalentFilters(talents: Talent[], f: TalentFilters = {}, categories: Category[] = []): Talent[] {
  const q = f.query?.trim().toLowerCase();
  return talents.filter((t) => {
    if (f.categoryId && t.categoryId !== f.categoryId) return false;
    if (f.subCategory && t.subCategory !== f.subCategory) return false;
    if (f.country && (t.country ?? "IN") !== f.country) return false;
    if (f.state && t.state.toLowerCase() !== f.state.toLowerCase()) return false;
    if (f.city && t.city.toLowerCase() !== f.city.toLowerCase()) return false;
    if (f.minExperience && t.experienceYears < f.minExperience) return false;
    if (f.language && !t.languages.includes(f.language)) return false;
    if (q) {
      const cat = categories.find((c) => c.id === t.categoryId);
      const country = getCountry(t.country);
      const hay = [t.fullName, t.city, t.state, country.name, country.code, t.categoryId, t.subCategory, t.description, cat?.name, ...(t.languages ?? [])]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** A talent is publicly visible only when approved AND subscription active. */
export function isPubliclyVisible(t: Talent): boolean {
  if (t.status !== "approved" || t.subscriptionStatus !== "active") return false;
  if (t.subscriptionExpiryDate && new Date(t.subscriptionExpiryDate).getTime() < Date.now()) return false;
  return true;
}

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

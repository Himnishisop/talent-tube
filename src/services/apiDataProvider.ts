import type { AppUser, Category, Payment, Report, Talent, TalentFilters } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { api, subscribeEvents } from "@/lib/api";
import { applyTalentFilters, isPubliclyVisible, type DataProvider } from "./dataProvider";

// ---------------------------------------------------------------------------
// PRODUCTION provider backed by the Node/MongoDB API in ./server.
// Real-time: one SSE connection; on any "talents" event every subscriber is
// refreshed, so the App and Web interfaces stay in sync across all devices.
// ---------------------------------------------------------------------------

/** Compress to ≤320px JPEG so the photo fits comfortably in MongoDB. */
function compressImage(file: File, size = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export class ApiDataProvider implements DataProvider {
  private listeners = new Set<(t: Talent[]) => void>();
  private stopStream: (() => void) | null = null;
  private categoriesCache: Category[] | null = null;

  async getUser(uid: string) { return api<AppUser | null>(`/api/users/${uid}`).catch(() => null); }
  async saveUser(user: AppUser) { await api(`/api/users/${user.uid}`, { method: "PUT", json: user }); }

  async getTalent(id: string) { return api<Talent | null>(`/api/talents/${id}`).catch(() => null); }
  async listPublicTalents(filters?: TalentFilters) {
    const [list, cats] = await Promise.all([api<Talent[]>("/api/talents"), this.listCategories()]);
    return applyTalentFilters(list.filter(isPubliclyVisible), filters, cats);
  }
  async listAllTalents() { return api<Talent[]>("/api/talents?all=1"); }
  async saveTalent(talent: Talent) { await api(`/api/talents/${talent.id}`, { method: "PUT", json: talent }); this.emit(); }
  async updateTalent(id: string, patch: Partial<Talent>) { await api(`/api/talents/${id}`, { method: "PATCH", json: patch }); this.emit(); }
  async deleteTalent(id: string) { await api(`/api/talents/${id}`, { method: "DELETE" }); this.emit(); }

  async listCategories() {
    if (this.categoriesCache) return this.categoriesCache;
    const list = await api<Category[]>("/api/categories");
    if (list.length === 0) {
      // First run: an admin seeds the defaults; everyone else uses them locally.
      try { await api("/api/categories/seed", { method: "POST", json: DEFAULT_CATEGORIES }); } catch { /* not admin */ }
      this.categoriesCache = DEFAULT_CATEGORIES;
      return DEFAULT_CATEGORIES;
    }
    this.categoriesCache = list;
    return list;
  }
  async saveCategory(c: Category) { await api(`/api/categories/${c.id}`, { method: "PUT", json: c }); }
  async deleteCategory(id: string) { await api(`/api/categories/${id}`, { method: "DELETE" }); }

  async listPayments() { return api<Payment[]>("/api/payments"); }
  async createPayment(p: Payment) { await api("/api/payments", { method: "POST", json: p }); }
  async updatePayment(id: string, patch: Partial<Payment>) { await api(`/api/payments/${id}`, { method: "PATCH", json: patch }); }

  async listReports() { return api<Report[]>("/api/reports"); }
  async createReport(r: Report) { await api("/api/reports", { method: "POST", json: r }); }
  async updateReport(id: string, patch: Partial<Report>) { await api(`/api/reports/${id}`, { method: "PATCH", json: patch }); }

  async uploadProfilePhoto(_uid: string, file: File) {
    const dataUrl = await compressImage(file);
    const { url } = await api<{ url: string }>("/api/photos", { method: "POST", json: { dataUrl } });
    return url;
  }

  // ---- realtime -------------------------------------------------------------
  private async emit() {
    if (this.listeners.size === 0) return;
    try {
      const list = await this.listPublicTalents();
      this.listeners.forEach((cb) => cb(list));
    } catch { /* offline – keep last list */ }
  }
  subscribePublicTalents(cb: (talents: Talent[]) => void) {
    this.listeners.add(cb);
    if (!this.stopStream) this.stopStream = subscribeEvents((type) => { if (type === "categories") this.categoriesCache = null; void this.emit(); });
    void this.listPublicTalents().then(cb).catch(() => cb([]));
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0) { this.stopStream?.(); this.stopStream = null; }
    };
  }
}

import type { AppUser, Category, Payment, Report, Talent, TalentFilters } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { SAMPLE_TALENTS } from "@/lib/sampleData";
import { api, subscribeEvents } from "@/lib/api";
import { applyTalentFilters, isPubliclyVisible, type DataProvider } from "./dataProvider";

// ---------------------------------------------------------------------------
// PRODUCTION provider backed by the Node/MongoDB API in ./server.
// Real-time: one SSE connection; on any "talents" event every subscriber is
// refreshed, so the App and Web interfaces stay in sync across all devices.
// Falls back gracefully to sample data if database is empty/offline.
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

  async getTalent(id: string) {
    const remote = await api<Talent | null>(`/api/talents/${id}`).catch(() => null);
    if (remote) return remote;
    return SAMPLE_TALENTS.find((t) => t.id === id) ?? null;
  }
  async listPublicTalents(filters?: TalentFilters) {
    let list: Talent[] = [];
    try {
      list = await api<Talent[]>("/api/talents");
    } catch {
      list = [];
    }
    const cats = await this.listCategories();
    const data = list && list.length > 0 ? list : SAMPLE_TALENTS;
    return applyTalentFilters(data.filter(isPubliclyVisible), filters, cats);
  }
  async listAllTalents() {
    const list = await api<Talent[]>("/api/talents?all=1").catch(() => []);
    return list && list.length > 0 ? list : SAMPLE_TALENTS;
  }
  async saveTalent(talent: Talent) { await api(`/api/talents/${talent.id}`, { method: "PUT", json: talent }); this.emit(); }
  async updateTalent(id: string, patch: Partial<Talent>) { await api(`/api/talents/${id}`, { method: "PATCH", json: patch }); this.emit(); }
  async deleteTalent(id: string) { await api(`/api/talents/${id}`, { method: "DELETE" }); this.emit(); }

  async listCategories() {
    if (this.categoriesCache) return this.categoriesCache;
    let list: Category[] = [];
    try {
      list = await api<Category[]>("/api/categories");
    } catch {
      list = [];
    }
    if (!list || list.length === 0) {
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

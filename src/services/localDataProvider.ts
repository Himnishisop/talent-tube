import type { AppUser, Category, Payment, Report, Talent, TalentFilters } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { SAMPLE_PAYMENTS, SAMPLE_REPORTS, SAMPLE_TALENTS } from "@/lib/sampleData";
import { applyTalentFilters, isPubliclyVisible, type DataProvider } from "./dataProvider";

// ---------------------------------------------------------------------------
// DEMO MODE provider – persists to localStorage so the app is fully usable
// without Firebase. NOT used when Firebase env vars are present.
// ---------------------------------------------------------------------------

const KEY = "talent_tube_demo_db_v1";

interface LocalDB {
  users: Record<string, AppUser>;
  talents: Record<string, Talent>;
  categories: Record<string, Category>;
  payments: Record<string, Payment>;
  reports: Record<string, Report>;
}

function seed(): LocalDB {
  const db: LocalDB = { users: {}, talents: {}, categories: {}, payments: {}, reports: {} };
  DEFAULT_CATEGORIES.forEach((c) => (db.categories[c.id] = c));
  SAMPLE_TALENTS.forEach((t) => (db.talents[t.id] = t));
  SAMPLE_PAYMENTS.forEach((p) => (db.payments[p.id] = p));
  SAMPLE_REPORTS.forEach((r) => (db.reports[r.id] = r));
  return db;
}

function load(): LocalDB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as LocalDB;
      let updated = false;
      // Refresh only untouched demo portraits; keep user-created profiles and edits.
      SAMPLE_TALENTS.forEach((sample) => {
        const profile = saved.talents[sample.id];
        if (profile?.photoURL?.startsWith("https://i.pravatar.cc/") && sample.photoURL?.includes("images.pexels.com")) {
          profile.photoURL = sample.photoURL;
          updated = true;
        }
      });
      // Add any newly shipped default categories (e.g. Karaoke Singer) to an
      // existing demo DB without touching admin-edited or custom ones.
      DEFAULT_CATEGORIES.forEach((cat) => {
        const existing = saved.categories[cat.id];
        if (!existing) {
          saved.categories[cat.id] = cat;
          updated = true;
        } else if (cat.subCategories.length > existing.subCategories.length) {
          // Default specialty list grew (e.g. the full instrument list): merge in
          // the new entries while keeping any admin-added custom ones.
          const merged = Array.from(new Set([...cat.subCategories, ...existing.subCategories]));
          saved.categories[cat.id] = { ...existing, subCategories: merged };
          updated = true;
        }
      });
      if (updated) persist(saved);
      return saved;
    }
  } catch {
    /* ignore */
  }
  const db = seed();
  persist(db);
  return db;
}

function persist(db: LocalDB) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Real-time sync for demo mode. Every write broadcasts a "changed" message;
// every open tab/window (App interface, Web interface, admin…) reloads from
// localStorage and re-notifies its subscribers – no refresh needed.
// `storage` events are the fallback for browsers without BroadcastChannel.
// ---------------------------------------------------------------------------
const CHANNEL = "talent_tube_realtime";
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL) : null;

export class LocalDataProvider implements DataProvider {
  private db: LocalDB = load();
  private listeners = new Set<(talents: Talent[]) => void>();

  constructor() {
    const onRemoteChange = () => {
      this.db = load(); // pick up writes made by other tabs
      this.emit();
    };
    channel?.addEventListener("message", (e) => e.data === "changed" && onRemoteChange());
    window.addEventListener("storage", (e) => e.key === KEY && onRemoteChange());
  }

  private publicTalents() {
    return Object.values(this.db.talents)
      .filter(isPubliclyVisible)
      .sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt));
  }

  private emit() {
    const list = this.publicTalents();
    this.listeners.forEach((cb) => cb(list));
  }

  private commit() {
    persist(this.db);
    this.emit(); // same tab
    channel?.postMessage("changed"); // other tabs
  }

  subscribePublicTalents(cb: (talents: Talent[]) => void) {
    this.listeners.add(cb);
    cb(this.publicTalents());
    return () => {
      this.listeners.delete(cb);
    };
  }

  async getUser(uid: string) {
    await delay(50);
    return this.db.users[uid] ?? null;
  }
  async saveUser(user: AppUser) {
    this.db.users[user.uid] = user;
    this.commit();
  }

  async getTalent(id: string) {
    await delay();
    return this.db.talents[id] ?? null;
  }
  async listPublicTalents(filters?: TalentFilters) {
    await delay();
    const cats = Object.values(this.db.categories);
    return applyTalentFilters(Object.values(this.db.talents).filter(isPubliclyVisible), filters, cats).sort(
      (a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt)
    );
  }
  async listAllTalents() {
    await delay();
    return Object.values(this.db.talents).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async saveTalent(talent: Talent) {
    this.db.talents[talent.id] = talent;
    this.commit();
  }
  async updateTalent(id: string, patch: Partial<Talent>) {
    const t = this.db.talents[id];
    if (!t) throw new Error("Talent not found");
    this.db.talents[id] = { ...t, ...patch, updatedAt: new Date().toISOString() };
    this.commit();
  }
  async deleteTalent(id: string) {
    delete this.db.talents[id];
    this.commit();
  }

  async listCategories() {
    await delay(40);
    return Object.values(this.db.categories).sort((a, b) => a.order - b.order);
  }
  async saveCategory(category: Category) {
    this.db.categories[category.id] = category;
    this.commit();
  }
  async deleteCategory(id: string) {
    delete this.db.categories[id];
    this.commit();
  }

  async listPayments() {
    await delay();
    return Object.values(this.db.payments).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async createPayment(payment: Payment) {
    this.db.payments[payment.id] = payment;
    this.commit();
  }
  async updatePayment(id: string, patch: Partial<Payment>) {
    const p = this.db.payments[id];
    if (p) this.db.payments[id] = { ...p, ...patch };
    this.commit();
  }

  async listReports() {
    await delay();
    return Object.values(this.db.reports).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async createReport(report: Report) {
    this.db.reports[report.id] = report;
    this.commit();
  }
  async updateReport(id: string, patch: Partial<Report>) {
    const r = this.db.reports[id];
    if (r) this.db.reports[id] = { ...r, ...patch };
    this.commit();
  }

  /** Demo: compress to a small data URL so it fits in localStorage. */
  async uploadProfilePhoto(_uid: string, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { AppUser, Category, Payment, Report, Talent, TalentFilters } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { requireFirebase } from "@/lib/firebase";
import { applyTalentFilters, isPubliclyVisible, type DataProvider } from "./dataProvider";

// ---------------------------------------------------------------------------
// PRODUCTION provider backed by Firebase Firestore + Storage.
//
// Firestore collections:
//   users/{uid}            – role + basic profile
//   talents/{uid}          – talent profile (doc id == owner uid)
//   categories/{slug}      – admin managed
//   payments/{paymentId}   – written by Cloud Function after verification
//   reports/{reportId}     – customer reports
// ---------------------------------------------------------------------------

const strip = <T extends object>(obj: T): T =>
  // Firestore rejects `undefined` values – remove them.
  JSON.parse(JSON.stringify(obj)) as T;

export class FirestoreDataProvider implements DataProvider {
  private get db() {
    return requireFirebase().db;
  }
  private get storage() {
    return requireFirebase().storage;
  }

  async getUser(uid: string) {
    const snap = await getDoc(doc(this.db, "users", uid));
    return snap.exists() ? (snap.data() as AppUser) : null;
  }
  async saveUser(user: AppUser) {
    await setDoc(doc(this.db, "users", user.uid), strip(user), { merge: true });
  }

  async getTalent(id: string) {
    const snap = await getDoc(doc(this.db, "talents", id));
    return snap.exists() ? (snap.data() as Talent) : null;
  }

  async listPublicTalents(filters?: TalentFilters) {
    // Server-side narrow to approved+active; remaining filters are applied
    // client-side (dataset per query stays small for an MVP). Add composite
    // indexes (firestore.indexes.json) if you add more `where` clauses.
    const constraints = [where("status", "==", "approved"), where("subscriptionStatus", "==", "active")];
    if (filters?.categoryId) constraints.push(where("categoryId", "==", filters.categoryId));
    if (filters?.country) constraints.push(where("country", "==", filters.country));
    const snap = await getDocs(query(collection(this.db, "talents"), ...constraints));
    const cats = await this.listCategories();
    const talents = snap.docs.map((d) => d.data() as Talent).filter(isPubliclyVisible);
    return applyTalentFilters(talents, filters, cats).sort(
      (a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt)
    );
  }

  async listAllTalents() {
    const snap = await getDocs(query(collection(this.db, "talents"), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => d.data() as Talent);
  }
  async saveTalent(talent: Talent) {
    await setDoc(doc(this.db, "talents", talent.id), strip(talent), { merge: true });
  }
  async updateTalent(id: string, patch: Partial<Talent>) {
    await updateDoc(doc(this.db, "talents", id), strip({ ...patch, updatedAt: new Date().toISOString() }));
  }
  async deleteTalent(id: string) {
    await deleteDoc(doc(this.db, "talents", id));
  }

  async listCategories() {
    const snap = await getDocs(collection(this.db, "categories"));
    if (snap.empty) {
      // First run: seed default categories (allowed only for admin by rules;
      // fall back to defaults in memory for everyone else).
      try {
        await Promise.all(DEFAULT_CATEGORIES.map((c) => this.saveCategory(c)));
      } catch {
        /* non-admin – use defaults locally */
      }
      return DEFAULT_CATEGORIES;
    }
    return snap.docs.map((d) => d.data() as Category).sort((a, b) => a.order - b.order);
  }
  async saveCategory(category: Category) {
    await setDoc(doc(this.db, "categories", category.id), strip(category), { merge: true });
  }
  async deleteCategory(id: string) {
    await deleteDoc(doc(this.db, "categories", id));
  }

  async listPayments() {
    const snap = await getDocs(query(collection(this.db, "payments"), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => d.data() as Payment);
  }
  async createPayment(payment: Payment) {
    await setDoc(doc(this.db, "payments", payment.id), strip(payment));
  }
  async updatePayment(id: string, patch: Partial<Payment>) {
    await updateDoc(doc(this.db, "payments", id), strip(patch));
  }

  async listReports() {
    const snap = await getDocs(query(collection(this.db, "reports"), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => d.data() as Report);
  }
  async createReport(report: Report) {
    await setDoc(doc(this.db, "reports", report.id), strip(report));
  }
  async updateReport(id: string, patch: Partial<Report>) {
    await updateDoc(doc(this.db, "reports", id), strip(patch));
  }

  async uploadProfilePhoto(uid: string, file: File) {
    // Storage path is locked down per-uid in storage.rules
    const r = ref(this.storage, `profilePhotos/${uid}/avatar.jpg`);
    await uploadBytes(r, file, { contentType: file.type || "image/jpeg" });
    return getDownloadURL(r);
  }

  subscribePublicTalents(cb: (talents: Talent[]) => void) {
    // Firestore pushes every change to every connected device in real time.
    const q = query(collection(this.db, "talents"), where("status", "==", "approved"), where("subscriptionStatus", "==", "active"));
    return onSnapshot(q, (snap) => {
      const talents = snap.docs.map((d) => d.data() as Talent).filter(isPubliclyVisible);
      cb(talents.sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt)));
    });
  }
}

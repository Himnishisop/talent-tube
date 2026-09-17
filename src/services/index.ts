import { isFirebaseConfigured } from "@/lib/firebase";
import { isApiConfigured } from "@/lib/api";
import type { DataProvider } from "./dataProvider";
import { LocalDataProvider } from "./localDataProvider";
import { FirestoreDataProvider } from "./firestoreDataProvider";
import { ApiDataProvider } from "./apiDataProvider";

/**
 * Single data access point used by the whole app. Backend is chosen by env:
 *   VITE_API_URL set        → MongoDB via the Node API (server/)   ← recommended
 *   VITE_FIREBASE_* set     → Firestore
 *   nothing                 → local demo mode (localStorage)
 */
export const backend: "api" | "firebase" | "demo" = isApiConfigured ? "api" : isFirebaseConfigured ? "firebase" : "demo";

export const dataService: DataProvider =
  backend === "api" ? new ApiDataProvider() : backend === "firebase" ? new FirestoreDataProvider() : new LocalDataProvider();

export const isDemoMode = backend === "demo";

export * from "./dataProvider";

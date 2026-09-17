// ---------------------------------------------------------------------------
// Firebase bootstrap.
//
// Configuration comes from Vite environment variables (see .env.example).
// If the variables are missing, the app runs in DEMO MODE with a local
// (localStorage) data provider and mock authentication so the UI can be
// evaluated without a Firebase project. Production always uses Firebase.
// ---------------------------------------------------------------------------
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };

/** Helper to assert Firebase services exist (used only inside Firestore provider). */
export function requireFirebase() {
  if (!auth || !db || !storage) {
    throw new Error("Firebase is not configured. Add VITE_FIREBASE_* variables to .env");
  }
  return { auth, db, storage };
}

// ---------------------------------------------------------------------------
// Shared domain types for Talent Tube.
// These mirror the Firestore document structure (see README.md).
// Keeping them framework-agnostic makes them reusable in a future
// React Native / Capacitor mobile app.
// ---------------------------------------------------------------------------

export type UserRole = "talent" | "customer" | "admin";

export type ProfileStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "expired";

export type SubscriptionStatus = "active" | "expired" | "pending" | "cancelled";

export type PaymentStatus = "created" | "success" | "failed" | "refunded";

export type PaymentMode = "live" | "test";

export type LanguageCode = "en";

export interface AppUser {
  uid: string;
  role: UserRole;
  displayName: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  createdAt: string; // ISO string
}

export interface TalentVideo {
  /** YouTube video ID (11 chars). We NEVER store video files. */
  videoId: string;
  /** Original URL entered by the talent (for reference only). */
  url: string;
  title?: string;
  /**
   * Talent's "Primary Showcase Video". Exactly one video per profile should
   * be flagged; it auto-plays in the floating mini-player on the profile page.
   */
  isBest?: boolean;
}

/** Resolves the primary showcase video (flagged one, else the first). */
export const bestVideoOf = (videos: TalentVideo[] | undefined): TalentVideo | undefined =>
  videos?.find((v) => v.isBest) ?? videos?.[0];

export interface Talent {
  /** Document id. Equals the owner's auth uid (one profile per user). */
  id: string;
  uid: string;

  // Basic info
  fullName: string;
  /** E.164 digits without "+", e.g. "919876543210", "14155550123". */
  mobile: string;
  whatsapp: string;
  email?: string;
  photoURL?: string;

  // Location
  /** ISO 3166-1 alpha-2 country code, e.g. "IN", "US". */
  country: string;
  /** State / province / region. */
  state: string;
  city: string;

  // Talent details
  categoryId: string;
  subCategory: string;
  experienceYears: number;
  description: string;
  languages: string[];
  videos: TalentVideo[]; // max 5

  // Moderation
  status: ProfileStatus;
  verified: boolean;
  featured: boolean;
  rejectionReason?: string;

  // Subscription
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate?: string; // ISO
  subscriptionExpiryDate?: string; // ISO
  paymentId?: string;

  // Meta
  registrationComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string; // slug e.g. "singer"
  name: string;
  icon: string; // Named icon key, resolved by CategoryIcon.
  subCategories: string[];
  active: boolean;
  order: number;
}

export interface Payment {
  id: string;
  talentId: string;
  uid: string;
  amount: number; // major units of `currency`
  currency: string; // ISO 4217, e.g. "INR", "USD"
  status: PaymentStatus;
  provider: "razorpay" | "stripe" | "mock";
  mode: PaymentMode;
  orderId?: string;
  paymentId?: string;
  signature?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  talentId: string;
  talentName: string;
  reporterUid?: string;
  reason: string;
  details?: string;
  status: "open" | "resolved";
  createdAt: string;
}

export interface TalentFilters {
  query?: string;
  categoryId?: string;
  subCategory?: string;
  country?: string;
  state?: string;
  city?: string;
  minExperience?: number;
  language?: string;
}

export const SUBSCRIPTION_DAYS = 365;
export const MAX_VIDEOS = 5;

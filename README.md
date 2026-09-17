# Talent Tube

**Showcase your talent. Get endless opportunities.**

An Indian talent-discovery marketplace. Talents create a profile with up to **5 YouTube videos**, pay **₹500/year**, get approved by an admin, and become searchable. Customers discover talents by category, location, experience and language, then contact them directly via **Call** or **WhatsApp**.

> Videos are **never uploaded** to our servers – only YouTube video IDs are stored and shown via the official YouTube embed player.

---

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS 4 (mobile-first) |
| Routing | `react-router-dom` (HashRouter → works in static hosting & WebViews) |
| Auth | Firebase Authentication (Email/Password + Google) |
| Database | Cloud Firestore |
| Storage | Firebase Storage (profile photos **only**) |
| Payments | Razorpay (Orders API + server-side verification via Cloud Functions) |
| Interface | English-only, with centralized copy in `src/lib/i18n.ts` |
| Visual design | Editorial photography, Space Grotesk and Manrope, navy / neon green / silver |

### Demo mode
If no `VITE_FIREBASE_*` variables are set, the app runs in **demo mode** with realistic sample data in `localStorage` and a mock payment gateway. This is what you see out-of-the-box.

* Demo admin: `admin@talenttube.in` / `admin123`
* Any other email + password (6+ chars) creates a demo customer/talent account.

---

## Project structure

```
src/
  lib/
    types.ts            # Domain types (mirror Firestore documents)
    constants.ts        # Categories, states/cities, languages
    youtube.ts          # URL validation + video-ID extraction + embed URLs
    firebase.ts         # Firebase init (reads .env) + demo-mode detection
    i18n.ts             # Centralized English interface copy
    sampleData.ts       # Realistic seed data for development
  services/
    dataProvider.ts     # DataProvider interface (UI depends only on this)
    firestoreDataProvider.ts   # Production implementation
    localDataProvider.ts       # Demo/offline implementation
    payments/
      types.ts          # PaymentGateway interface
      razorpayGateway.ts  # LIVE – Razorpay checkout + server verification
      mockGateway.ts      # TEST – dev-only simulated checkout
      index.ts          # Gateway selection + subscription activation
  context/              # AuthContext, LangContext
  components/           # Layout, TalentCard, YouTubeEmbed, ui primitives, guards
  pages/                # Home, Categories, Search, TalentProfile, Login,
                        # Register (4-step), TalentDashboard, Subscription,
                        # AdminLogin, AdminDashboard
functions/              # Firebase Cloud Functions (Razorpay createOrder / verify / webhook / expiry cron)
firestore.rules         # Firestore security rules
storage.rules           # Storage security rules
firestore.indexes.json  # Composite indexes
firebase.json           # Hosting / rules / functions config
.env.example            # Environment template
```

The service layer is framework-agnostic so the same code can be dropped into a **React Native / Expo** or **Capacitor** app later. Only the `pages/` and `components/` folders are web-specific.

---

## Firestore database structure

```
users/{uid}
  uid, role: "customer" | "talent" | "admin", displayName, email?, phone?, photoURL?, createdAt

talents/{uid}                      ← doc id == owner uid (one profile per user)
  id, uid, fullName, mobile, whatsapp, email?, photoURL?
  state, city, categoryId, subCategory, experienceYears, description, languages[]
  videos: [{ videoId, url, title? }]          (max 5 – YouTube IDs only)
  status: "pending" | "approved" | "rejected" | "suspended" | "expired"
  verified, featured, rejectionReason?
  subscriptionStatus: "active" | "expired" | "pending" | "cancelled"
  subscriptionStartDate?, subscriptionExpiryDate?, paymentId?
  registrationComplete, createdAt, updatedAt

categories/{slug}
  id, name, icon, subCategories[], active, order

payments/{paymentId}               ← written ONLY by Cloud Functions in live mode
  id, talentId, uid, amount, currency, status, provider, mode, orderId, paymentId, signature, createdAt

reports/{reportId}
  id, talentId, talentName, reporterUid?, reason, details?, status: "open" | "resolved", createdAt
```

**A talent is publicly visible only when** `status == "approved"` **AND** `subscriptionStatus == "active"` **AND** `subscriptionExpiryDate > now`. This is enforced in the query layer (`isPubliclyVisible`) and in `firestore.rules`.

---

## 0. MongoDB backend + YouTube uploads (recommended stack)

The `server/` folder is a Node/Express API that gives you **MongoDB storage**, **Google sign-in**, and **"YouTube as video storage"** – talents upload videos from their phone straight to *their own* YouTube channel (unlisted), and the videos are only surfaced inside Talent Tube.

### Setup

1. Copy `.env.example` → `.env` and fill in the SERVER and CLIENT sections.
2. **MongoDB:** create a free cluster at <https://cloud.mongodb.com>, add a database user, allow your IP, paste the connection string into `MONGODB_URI`.
3. **Google Cloud** (<https://console.cloud.google.com>):
   - APIs & Services → Library → enable **YouTube Data API v3**.
   - OAuth consent screen → External → add scopes `openid`, `email`, `profile`, `https://www.googleapis.com/auth/youtube.force-ssl`. Add yourself as a test user while in "Testing".
   - Credentials → Create → **OAuth client ID → Web application**. Authorised redirect URIs:
     - `http://localhost:8787/api/auth/google/callback`
     - `http://localhost:8787/api/youtube/callback`
     (add the production `SERVER_URL` equivalents later). Paste the ID/secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
4. `JWT_SECRET`: any long random string (`openssl rand -hex 32`).
5. Set `VITE_API_URL=http://localhost:8787`.
6. Run both processes:
   ```bash
   node server/index.js     # API on :8787
   npm run dev              # app on :5173
   ```
   The footer's "Preview environment" note disappears and the app reads/writes MongoDB in real time (SSE).

### How the YouTube upload works
1. Talent signs in → Register → step "Your showreel" → **Connect my YouTube channel** (Google consent, `youtube.force-ssl` scope). The refresh token is stored in MongoDB and never sent to the browser.
2. **Choose a video → Upload.** The browser asks the server for a short-lived access token and streams the file *directly to Google* using the resumable upload protocol (chunked, with progress, resumable). The video bytes never touch our server.
3. The server verifies the new `videoId` belongs to the connected channel, forces `privacyStatus` to the configured value and `embeddable: true`, and records it in the `videos` collection. The URL is dropped into the talent's video list.

**Unlisted vs Private.** YouTube does not allow *private* videos to be embedded – visitors would see "Video unavailable". `YOUTUBE_DEFAULT_PRIVACY=unlisted` keeps videos out of YouTube search, the channel page and recommendations while still playing inside Talent Tube. The uploader lets the talent pick Private anyway (with a warning) for videos they don't want shown yet.

**Google verification.** `youtube.force-ssl` is a sensitive scope; while your OAuth app is in "Testing" only listed test users can connect. Submit the app for verification before public launch.

### API summary
| Route | Purpose |
| --- | --- |
| `POST /api/auth/register`, `/login`, `GET /api/auth/me` | Email/password auth (JWT) |
| `GET /api/auth/google` → `/callback` | Google sign-in |
| `GET /api/youtube/connect` → `/callback`, `/status`, `/token`, `POST /videos`, `PATCH /videos/:id/privacy`, `DELETE /videos/:id`, `POST /disconnect` | YouTube channel + uploads |
| `GET/PUT/PATCH/DELETE /api/talents…`, `/categories`, `/payments`, `/reports`, `/photos` | Data (owner/admin rules enforced server-side) |
| `GET /api/stream` | Server-Sent Events → real-time sync for every client |

## 1. How to connect Firebase (alternative backend)

1. Go to <https://console.firebase.google.com> → **Add project** (e.g. `talent-tube`).
2. In the project: **Build → Authentication**, **Firestore Database**, **Storage** – click *Get started* on each.
3. **Project settings → General → Your apps → Web (</>)** → register the app → copy the `firebaseConfig` values.
4. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=talent-tube.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=talent-tube
   VITE_FIREBASE_STORAGE_BUCKET=talent-tube.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
5. `npm run dev`. The preview environment notice in the footer disappears once Firebase is detected.

## 2. How to configure Firestore

1. Install the CLI: `npm i -g firebase-tools && firebase login && firebase use --add`.
2. Deploy rules & indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
3. **Create the first admin** (never done from the client):
   * Sign up once in the app with your admin email (this creates `users/{uid}` with role `customer`).
   * In Firestore console open `users/{uid}` and change `role` → `"admin"`.
4. **Seed categories:** the first time an admin loads the app, `DEFAULT_CATEGORIES` are written automatically to `categories/`. Admins can then add/edit/delete categories from **Admin → Categories**.
5. (Optional) Import sample talents from `src/lib/sampleData.ts` using a small Admin-SDK script for staging.

### Security model (see `firestore.rules`)
* Customers/anonymous: read only approved+active talents and categories; can create reports.
* Talents: create/update **only their own** `talents/{uid}` doc; **cannot** touch `status`, `verified`, `featured` or any `subscription*` field. Max 5 videos, valid Indian mobile numbers enforced.
* Admin (`users/{uid}.role == "admin"`): full moderation access.
* `payments/*`: client write is **denied**; only Cloud Functions (Admin SDK) write there.
* Storage: `profilePhotos/{uid}/*` – owner-only writes, images < 5 MB.

## 3. How to configure Authentication

1. Firebase console → **Authentication → Sign-in method**.
2. Enable **Email/Password**.
3. Enable **Google** (set support email). Add your production domain under **Authorized domains**.
4. (Recommended for India, later) Enable **Phone** and add a `signInWithPhoneNumber` method in `AuthContext.tsx` – the context already isolates all auth calls in one file.
5. Roles: new sign-ups can only be `customer` or `talent` (enforced in rules). A customer who completes talent registration is upgraded to `talent`.

## 4. How to configure YouTube embeds

No API key is required.

* Talents paste any YouTube link (`watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, `/live/`). `src/lib/youtube.ts → extractYouTubeId()` validates it and extracts the 11-character ID. Invalid links are rejected inline; duplicates are blocked; max 5.
* Only `{ videoId, url }` is stored. The `YouTubeEmbed` component renders the thumbnail from `i.ytimg.com` and loads the `youtube-nocookie.com/embed/{id}` iframe only when tapped (fast + data-friendly on mobile). `hl=en` requests English player controls; videos retain their original spoken language.
* Videos must be **Public** or **Unlisted** on YouTube with embedding allowed (default). Private videos will show "Video unavailable".

## 5. How to configure the Indian payment gateway (Razorpay)

Architecture (`src/services/payments/`):

```
UI (SubscriptionPage) → purchaseAnnualMembership()
                          └─ paymentGateway.checkout()
                               ├─ MockGateway     (VITE_PAYMENT_MODE=test) – dev only
                               └─ RazorpayGateway (VITE_PAYMENT_MODE=live)
                                    1. POST /createOrder   → Cloud Function creates Razorpay order
                                    2. Razorpay Checkout   → user pays (UPI/cards/net-banking/wallets)
                                    3. POST /verifyPayment → Cloud Function verifies HMAC signature,
                                                             writes payments/{id}, activates subscription
```

Steps:
1. Create an account at <https://dashboard.razorpay.com> → complete KYC → **Settings → API Keys** → generate *Test* keys first, *Live* keys after go-live.
2. Deploy the Cloud Functions:
   ```bash
   cd functions && npm install && cd ..
   firebase functions:secrets:set RAZORPAY_KEY_ID
   firebase functions:secrets:set RAZORPAY_KEY_SECRET
   firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
   firebase deploy --only functions
   ```
   Note the URL, e.g. `https://asia-south1-talent-tube.cloudfunctions.net/payments`.
3. In Razorpay dashboard → **Webhooks** → add `https://…/payments/webhook`, event `payment.captured`, with the same webhook secret.
4. In `.env`:
   ```
   VITE_PAYMENT_MODE=live
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxx        # key_id only – the secret stays on the server
   VITE_PAYMENT_API_URL=https://asia-south1-talent-tube.cloudfunctions.net/payments
   ```
5. Rebuild & deploy. The "TEST MODE" banner disappears; the mock gateway is not reachable in live mode. If live mode is mis-configured, checkout **fails** – it never fakes success.
6. A scheduled function (`expireSubscriptions`, daily 02:00 IST) flips expired subscriptions to `expired` so profiles drop out of search automatically. Talents can renew from the dashboard.

To swap Razorpay for PhonePe / Cashfree / PayU later, implement the `PaymentGateway` interface in a new file and change one line in `payments/index.ts`.

## 6. How to deploy the application

### Firebase Hosting (recommended)
```bash
npm run build                       # outputs dist/
firebase deploy --only hosting      # uses firebase.json (SPA rewrite included)
```
Add a custom domain under **Hosting → Add custom domain**. Then add that domain to **Authentication → Authorized domains**.

### Other static hosts
`npm run build` inlines the JavaScript, CSS, and fonts into `dist/index.html` and copies the hero image into `dist/images/`. Upload the **entire `dist/` directory**, not just the HTML file, to Vercel, Netlify, Cloudflare Pages or any static server. HashRouter means no rewrite rules are required.

### Environment for CI
Set the `VITE_*` variables in your CI/host's environment settings before `npm run build` (they are baked in at build time).

### Mobile apps later
* **Capacitor:** `npm i @capacitor/core @capacitor/cli && npx cap init && npx cap add android` → wraps this exact build in a WebView; Call/WhatsApp deep-links already work.
* **React Native / Expo:** reuse `src/lib`, `src/services`, `src/context` as-is; rewrite `pages/` + `components/` with RN primitives.

---

## Scripts

```bash
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Roadmap ideas (not in MVP)
Phone OTP login · reviews & ratings · booking requests inbox · talent analytics (profile views, calls) · push notifications for expiry reminders.

## English-only interface

Navigation, forms, category management, metadata, status messages, and the brand tagline are in English. There is no language switcher. `LangProvider` clears the old locale preference for returning visitors. Spoken-language filters describe a professional's skills; they do not change the interface language or edit user-authored profiles.

## Design assets

The hero image is a generated editorial illustration saved at `public/images/talent-stage.jpg`. Featured sample profiles use stock photography from Pexels (Marcelo Verfe, Alena Darmel, and viresh studio). These are fictional development profiles, not endorsements or identities of the photographed people. Replace them with talent-owned profile photos before publishing a production directory. Both typefaces are self-hosted with Fontsource; no Google Fonts request is required.

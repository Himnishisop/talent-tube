/* eslint-disable */
// ============================================================================
// Talent Tube – Firebase Cloud Functions (Razorpay payments)
// ----------------------------------------------------------------------------
// Deploy:   cd functions && npm i && cd .. && firebase deploy --only functions
// Secrets:  firebase functions:secrets:set RAZORPAY_KEY_ID
//           firebase functions:secrets:set RAZORPAY_KEY_SECRET
//           firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
//
// Endpoints (mounted under the `payments` HTTPS function):
//   POST /createOrder     { talentId, plan }                → { orderId, amount, currency }
//   POST /verifyPayment   { razorpay_order_id, razorpay_payment_id, razorpay_signature, talentId }
//   POST /webhook         Razorpay webhook (payment.captured) – belt & braces
//
// The client NEVER activates a subscription itself in live mode. This file is
// the single source of truth for `payments/*` and the talent's subscription
// fields, so Firestore rules can keep them read-only for clients.
// ============================================================================
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const Razorpay = require("razorpay");

admin.initializeApp();
const db = admin.firestore();

const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");

const PLANS = { annual: { amountPaise: 500 * 100, days: 365 } };

const app = express();
app.use(cors({ origin: true }));

// Raw body needed for webhook signature; JSON for everything else
app.use("/webhook", express.raw({ type: "*/*" }));
app.use(express.json());

// --- auth middleware: verify Firebase ID token --------------------------------
async function requireUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthenticated" });
  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function razorpay() {
  return new Razorpay({ key_id: RAZORPAY_KEY_ID.value(), key_secret: RAZORPAY_KEY_SECRET.value() });
}

async function activateSubscription({ talentId, uid, orderId, paymentId, signature, amountPaise, days }) {
  const now = new Date();
  const talentRef = db.doc(`talents/${talentId}`);
  const snap = await talentRef.get();
  if (!snap.exists) throw new Error("Talent not found");
  const talent = snap.data();

  // Extend from current expiry if still active, else from today
  const currentExpiry = talent.subscriptionExpiryDate ? new Date(talent.subscriptionExpiryDate) : null;
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const expiry = new Date(base.getTime() + days * 86400000);

  const batch = db.batch();
  batch.set(db.doc(`payments/${paymentId}`), {
    id: paymentId,
    talentId,
    uid,
    amount: amountPaise / 100,
    currency: "INR",
    status: "success",
    provider: "razorpay",
    mode: "live",
    orderId,
    paymentId,
    signature: signature || null,
    createdAt: now.toISOString(),
  }, { merge: true });

  batch.update(talentRef, {
    subscriptionStatus: "active",
    subscriptionStartDate: now.toISOString(),
    subscriptionExpiryDate: expiry.toISOString(),
    paymentId,
    // Expired profiles go back to pending for a quick re-check by admin
    status: talent.status === "expired" ? "pending" : talent.status,
    updatedAt: now.toISOString(),
  });
  await batch.commit();
}

// --- POST /createOrder --------------------------------------------------------
app.post("/createOrder", requireUser, async (req, res) => {
  try {
    const { talentId, plan = "annual" } = req.body || {};
    if (!talentId || talentId !== req.user.uid) return res.status(403).json({ error: "Forbidden" });
    const p = PLANS[plan];
    if (!p) return res.status(400).json({ error: "Unknown plan" });

    const order = await razorpay().orders.create({
      amount: p.amountPaise,
      currency: "INR",
      receipt: `tt_${talentId}_${Date.now()}`.slice(0, 40),
      notes: { talentId, plan, uid: req.user.uid },
    });

    // Record a "created" payment intent (optional but useful for auditing)
    await db.doc(`payments/${order.id}`).set({
      id: order.id, talentId, uid: req.user.uid, amount: p.amountPaise / 100, currency: "INR",
      status: "created", provider: "razorpay", mode: "live", orderId: order.id,
      createdAt: new Date().toISOString(),
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not create order" });
  }
});

// --- POST /verifyPayment ------------------------------------------------------
app.post("/verifyPayment", requireUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, talentId } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ error: "Missing fields" });
    if (talentId !== req.user.uid) return res.status(403).json({ error: "Forbidden" });

    // HMAC-SHA256(order_id|payment_id, key_secret) must equal signature
    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET.value())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expected !== razorpay_signature) return res.status(400).json({ error: "Invalid signature" });

    // Double-check with Razorpay that the payment is captured for this order
    const payment = await razorpay().payments.fetch(razorpay_payment_id);
    if (payment.order_id !== razorpay_order_id || !["captured", "authorized"].includes(payment.status)) {
      return res.status(400).json({ error: "Payment not captured" });
    }

    await activateSubscription({
      talentId,
      uid: req.user.uid,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amountPaise: payment.amount,
      days: PLANS.annual.days,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Verification failed" });
  }
});

// --- POST /webhook (Razorpay → server) ---------------------------------------
app.post("/webhook", async (req, res) => {
  try {
    const sig = req.headers["x-razorpay-signature"];
    const expected = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET.value()).update(req.body).digest("hex");
    if (sig !== expected) return res.status(400).send("bad signature");

    const event = JSON.parse(req.body.toString());
    if (event.event === "payment.captured") {
      const p = event.payload.payment.entity;
      const talentId = p.notes?.talentId;
      const uid = p.notes?.uid;
      if (talentId && uid) {
        const existing = await db.doc(`payments/${p.id}`).get();
        if (!existing.exists || existing.data().status !== "success") {
          await activateSubscription({ talentId, uid, orderId: p.order_id, paymentId: p.id, amountPaise: p.amount, days: PLANS.annual.days });
        }
      }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send("error");
  }
});

exports.payments = onRequest(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET] },
  app
);

// --- Daily job: expire subscriptions -----------------------------------------
exports.expireSubscriptions = onSchedule({ schedule: "every day 02:00", region: "asia-south1", timeZone: "Asia/Kolkata" }, async () => {
  const nowIso = new Date().toISOString();
  const snap = await db.collection("talents")
    .where("subscriptionStatus", "==", "active")
    .where("subscriptionExpiryDate", "<", nowIso)
    .get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { subscriptionStatus: "expired", status: "expired", updatedAt: nowIso }));
  await batch.commit();
  console.log(`Expired ${snap.size} subscriptions`);
});

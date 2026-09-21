// MongoDB (Mongoose) models. Documents mirror the TypeScript types in src/lib/types.ts.
// `strict: false` lets the client's evolving shapes persist without schema churn;
// the fields declared here are the ones we index / validate on the server.
import mongoose from "mongoose";

const opts = { strict: false, versionKey: false, toJSON: { transform: (_d, r) => { delete r._id; return r; } } };

const UserSchema = new mongoose.Schema({
  uid: { type: String, unique: true, index: true },
  role: { type: String, enum: ["customer", "talent", "admin"], default: "customer" },
  displayName: String,
  email: { type: String, index: true, sparse: true },
  passwordHash: { type: String, select: false },
  googleId: { type: String, index: true, sparse: true },
  photoURL: String,
  phone: String,
  createdAt: String,
  // YouTube connection (refresh token never leaves the server)
  youtube: {
    select: false,
    type: {
      channelId: String,
      channelTitle: String,
      refreshToken: String,
      scope: String,
      connectedAt: String,
    },
  },
}, opts);

const TalentSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  uid: { type: String, index: true },
  status: { type: String, index: true },
  subscriptionStatus: { type: String, index: true },
  subscriptionExpiryDate: String,
  categoryId: { type: String, index: true },
  country: { type: String, index: true },
  featured: Boolean,
  createdAt: String,
  updatedAt: String,
}, opts);

const CategorySchema = new mongoose.Schema({ id: { type: String, unique: true }, order: Number, active: Boolean }, opts);
const PaymentSchema = new mongoose.Schema({ id: { type: String, unique: true }, talentId: { type: String, index: true }, uid: String, createdAt: String }, opts);
const ReportSchema = new mongoose.Schema({ id: { type: String, unique: true }, talentId: String, status: String, createdAt: String }, opts);
const PhotoSchema = new mongoose.Schema({ uid: { type: String, unique: true }, contentType: String, data: Buffer, updatedAt: String }, { versionKey: false });

// Videos uploaded through the app to the talent's own YouTube channel.
const VideoSchema = new mongoose.Schema({
  videoId: { type: String, unique: true },
  uid: { type: String, index: true },
  channelId: String,
  title: String,
  privacyStatus: String,
  sizeBytes: Number,
  createdAt: String,
}, opts);

export const User = mongoose.model("User", UserSchema);
export const Talent = mongoose.model("Talent", TalentSchema);
export const Category = mongoose.model("Category", CategorySchema);
export const Payment = mongoose.model("Payment", PaymentSchema);
export const Report = mongoose.model("Report", ReportSchema);
export const Photo = mongoose.model("Photo", PhotoSchema);
export const Video = mongoose.model("Video", VideoSchema);

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDb(uri) {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is missing");
  }
  let cleanUri = String(uri).trim();
  // Strip quotes if user wrapped the URI in quotes
  cleanUri = cleanUri.replace(/^["']|["']$/g, "").trim();

  // If user included <username> or <password> with literal angle brackets, strip them and encode
  const authMatch = cleanUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+?)@([^@]+)$/);
  if (authMatch) {
    const [, prefix, rawUser, rawPass, hostAndQuery] = authMatch;
    let cleanUser = rawUser.replace(/^<|>$/g, "").trim();
    let cleanPass = rawPass.replace(/^<|>$/g, "").trim();
    try {
      cleanUser = encodeURIComponent(decodeURIComponent(cleanUser));
      cleanPass = encodeURIComponent(decodeURIComponent(cleanPass));
    } catch {
      cleanUser = encodeURIComponent(cleanUser);
      cleanPass = encodeURIComponent(cleanPass);
    }
    cleanUri = `${prefix}${cleanUser}:${cleanPass}@${hostAndQuery}`;
  } else {
    cleanUri = cleanUri.replace(/:<([^>]+)>@/, ":$1@");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    mongoose.set("strictQuery", false);
    cached.promise = mongoose.connect(cleanUri, {
      serverSelectionTimeoutMS: 8000,
    }).then((m) => {
      console.log("✓ MongoDB connected successfully");
      return m;
    });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    console.error("[Talent Tube] MongoDB connection failed:", err.message);
    throw new Error(`MongoDB connection error: ${err.message}`);
  }
}

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

export async function connectDb(uri) {
  if (!uri) throw new Error("MONGODB_URI is not set in .env");
  mongoose.set("strictQuery", false);
  await mongoose.connect(uri);
  console.log("✓ MongoDB connected");
}

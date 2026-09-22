import { v2 as cloudinary } from "cloudinary";

const env = process.env;

// Initialize Cloudinary with environment variables (or provided defaults)
const cloud_name = env.CLOUDINARY_CLOUD_NAME || "rmh8n3v1";
const api_key = env.CLOUDINARY_API_KEY || "832616123751917";
const api_secret = env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(
  (cloud_name && api_key && api_secret) || env.CLOUDINARY_URL
);

if (isCloudinaryConfigured) {
  if (env.CLOUDINARY_URL) {
    cloudinary.config();
  } else {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });
  }
}

/**
 * Uploads a base64 or remote image to Cloudinary,
 * applying auto-format, auto-quality, face-aware gravity, and 500x500 crop.
 * 
 * @param {string} fileData - Base64 Data URL (e.g. "data:image/jpeg;base64,...") or HTTP(S) URL
 * @param {string} publicId - Unique identifier (e.g. `talent_profile_${uid}`)
 * @returns {Promise<string>} Secure optimized Cloudinary URL
 */
export async function uploadToCloudinary(fileData, publicId) {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary credentials are not configured. Set CLOUDINARY_API_SECRET in your .env");
  }

  // Upload to Cloudinary with folder organization and square auto-gravity face cropping
  const uploadResult = await cloudinary.uploader.upload(fileData, {
    public_id: publicId,
    folder: "talenttube/profiles",
    overwrite: true,
    resource_type: "image",
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "fill",
        gravity: "face", // centers on talent face if detected, falls back to auto
        fetch_format: "auto",
        quality: "auto",
      },
    ],
  });

  return uploadResult.secure_url || uploadResult.url;
}

export { cloudinary };

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const env = process.env;

// Cloudflare R2 Credentials & Configuration
const accountId = env.R2_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID || "";
const accessKeyId = env.R2_ACCESS_KEY_ID || env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const secretAccessKey = env.R2_SECRET_ACCESS_KEY || env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
const bucketName = env.R2_BUCKET_NAME || env.CLOUDFLARE_R2_BUCKET_NAME || "talenttube";
const publicUrl = env.R2_PUBLIC_URL || env.R2_CUSTOM_DOMAIN || "";

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && bucketName
);

let s3ClientInstance = null;

export function getR2Client() {
  if (!isR2Configured) return null;
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3ClientInstance;
}

/**
 * Uploads an image Buffer or data URL to Cloudflare R2.
 *
 * @param {Object} params
 * @param {Buffer} params.buffer - The binary image data
 * @param {string} params.contentType - MIME type (e.g. "image/jpeg", "image/webp", "image/png")
 * @param {string} params.key - R2 object key (e.g. "profiles/profile_123.webp")
 * @param {string} [params.baseUrl] - Base URL for server proxy fallback if publicUrl is not set
 * @returns {Promise<string>} The accessible URL of the uploaded image
 */
export async function uploadToR2({ buffer, contentType, key, baseUrl = "" }) {
  if (!isR2Configured) {
    throw new Error("Cloudflare R2 is not configured. Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY.");
  }

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  await client.send(command);

  // If a public domain or r2.dev subdomain is configured, use it directly
  if (publicUrl && publicUrl.trim() !== "") {
    const cleanPublicUrl = publicUrl.trim().replace(/\/+$/, "");
    return `${cleanPublicUrl}/${key}`;
  }

  // Otherwise, route through the server's R2 delivery endpoint
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  return `${cleanBaseUrl}/api/photos/r2/${encodeURIComponent(key)}`;
}

/**
 * Streams or downloads an object from Cloudflare R2
 *
 * @param {string} key
 * @returns {Promise<{ stream: any, contentType: string }>}
 */
export async function getObjectFromR2(key) {
  if (!isR2Configured) return null;
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  const response = await client.send(command);
  return {
    stream: response.Body,
    contentType: response.ContentType || "application/octet-stream",
  };
}

export { bucketName, publicUrl };

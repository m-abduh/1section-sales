import { createHash } from "node:crypto";
import querystring from "node:querystring";
import { v2 as cloudinary } from "cloudinary";
import { cloudinaryConfig, hasCloudinary, env } from "../config/env";
import { ApiError } from "../utils/api-error";

let configured = false;

function ensureConfigured() {
  if (!hasCloudinary) {
    throw new ApiError(
      503,
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      { code: "STORAGE_NOT_CONFIGURED" },
    );
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloudName,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
      secure: true,
    });
    configured = true;
  }
}

export interface UploadedPdf {
  provider: "CLOUDINARY";
  storageKey: string;
  resourceType: string;
  format: string;
  bytes: number;
  checksum: string;
}

export function checksumOf(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export interface UploadedImage {
  provider: "CLOUDINARY";
  storageKey: string;
  url: string;
  format: string;
  bytes: number;
  checksum: string;
}

function publicIdBase(originalName: string): string {
  return originalName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .slice(0, 80);
}

/** Uploads a public image (JPEG, PNG or WebP). */
export async function uploadImageBuffer(
  buffer: Buffer,
  originalName: string,
  folder = "covers",
): Promise<UploadedImage> {
  ensureConfigured();

  const result = await new Promise<{
    public_id: string;
    secure_url: string;
    format: string;
    bytes: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        type: "upload",
        folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
        public_id: `${publicIdBase(originalName)}-${Date.now()}`,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(
          uploadResult as unknown as {
            public_id: string;
            secure_url: string;
            format: string;
            bytes: number;
          },
        );
      },
    );
    stream.end(buffer);
  });

  return {
    provider: "CLOUDINARY",
    storageKey: result.public_id,
    url: result.secure_url,
    format: result.format,
    bytes: result.bytes,
    checksum: checksumOf(buffer),
  };
}

export async function uploadPdfBuffer(
  buffer: Buffer,
  originalName: string,
): Promise<UploadedPdf> {
  ensureConfigured();

  const publicIdBase = originalName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .slice(0, 80);

  const result = await new Promise<{
    public_id: string;
    resource_type: string;
    format: string;
    bytes: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        type: "authenticated",
        folder: env.CLOUDINARY_FOLDER,
        public_id: `${publicIdBase}-${Date.now()}`,
        format: "pdf",
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(
          uploadResult as unknown as {
            public_id: string;
            resource_type: string;
            format: string;
            bytes: number;
          },
        );
      },
    );
    stream.end(buffer);
  });

  return {
    provider: "CLOUDINARY",
    storageKey: result.public_id,
    resourceType: result.resource_type,
    format: result.format,
    bytes: result.bytes,
    checksum: checksumOf(buffer),
  };
}

export function buildSignedDownloadUrl(
  storageKey: string,
  resourceType = "image",
  format = "pdf",
  fileName?: string,
): string {
  ensureConfigured();
  const params = cloudinary.utils.sign_request({
    timestamp: Math.floor(Date.now() / 1000),
    public_id: storageKey,
    format,
    type: "authenticated",
    expires_at: Math.floor(
      Date.now() / 1000 + env.DOWNLOAD_SIGNED_URL_TTL_MINUTES * 60,
    ),
    // Force `Content-Disposition: attachment` so the browser downloads the
    // file instead of opening it inline (which would expose the signed URL).
    attachment: true,
    // Cloudinary only accepts a custom download name via `target_filename`;
    // it must be part of the signed payload.
    ...(fileName ? { target_filename: fileName } : {}),
  });
  const base = cloudinary.utils.api_url("download", {
    resource_type: resourceType,
  });
  return `${base}?${querystring.stringify(params)}`;
}

import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { recordAudit } from "@/lib/server/lib/audit";
import { uploadImageBuffer } from "@/lib/server/lib/cloudinary";
import {
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  looksLikeImage,
} from "@/lib/server/lib/image-file";
import { ApiError } from "@/lib/server/utils/api-error";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Uploads an inline image for the ebook rich text editor. */
export async function POST(req: NextRequest) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw ApiError.badRequest("No image uploaded");
    }
    if (!IMAGE_TYPES.has(file.type)) {
      throw new ApiError(400, "Only JPG, PNG or WebP images are allowed", {
        code: "BAD_FILE",
      });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new ApiError(400, "Image is too large (max 4 MB)", {
        code: "FILE_TOO_LARGE",
      });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    if (!looksLikeImage(buf)) {
      throw new ApiError(400, "File is not a valid image", {
        code: "INVALID_IMAGE",
      });
    }

    const uploaded = await uploadImageBuffer(buf, file.name, "builder");
    await recordAudit({
      adminId: admin.id,
      action: "upload.builder_image",
      entity: "EbookProject",
      entityId: uploaded.storageKey,
      metadata: { bytes: uploaded.bytes, checksum: uploaded.checksum },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return ok(uploaded, 201);
  } catch (e) {
    return fail(e);
  }
}

export const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Checks the magic bytes so a renamed file cannot slip through. */
export function looksLikeImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // PNG
  if (buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
    return true;
  }
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // WebP: "RIFF" .... "WEBP"
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return true;
  }
  return false;
}

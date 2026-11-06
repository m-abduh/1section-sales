export type EbookImageType = "png" | "jpg" | "webp";

export type EbookImageInfo = {
  width: number;
  height: number;
  type: EbookImageType;
};

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

/** Reads intrinsic dimensions from PNG/JPEG/WebP headers. */
export function imageInfoOf(buffer: Buffer): EbookImageInfo | null {
  if (buffer.length < 16) return null;

  if (buffer.subarray(0, 4).equals(PNG_MAGIC) && buffer.length >= 24) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
      type: "png",
    };
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    const size = jpegSize(buffer);
    return size ? { ...size, type: "jpg" } : null;
  }

  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    const size = webpSize(buffer);
    return size ? { ...size, type: "webp" } : null;
  }

  return null;
}

function jpegSize(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    if (offset + 4 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

function webpSize(buffer: Buffer): { width: number; height: number } | null {
  const chunk = buffer.subarray(12, 16).toString("ascii");
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  return null;
}

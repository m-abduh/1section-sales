import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { ApiError } from "@/lib/server/utils/api-error";
import { generateEbookPart } from "@/lib/ebook/groq";
import { generateEbookPartSchema } from "@/lib/server/modules/builder/builder.schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const input = generateEbookPartSchema.parse(await req.json());
    return ok(await generateEbookPart(input));
  } catch (e) {
    if (e instanceof Error && /rate_limit_exceeded|\(429\)/i.test(e.message)) {
      const wait = e.message.match(/try again in ([\d.]+)s/i)?.[1];
      return fail(
        new ApiError(
          429,
          `Kuota Groq untuk menit ini habis. Tunggu ${
            wait ? `sekitar ${Math.ceil(Number(wait))} detik` : "sekitar 1 menit"
          } lalu coba lagi.`,
          { code: "RATE_LIMITED" },
        ),
      );
    }
    return fail(e);
  }
}

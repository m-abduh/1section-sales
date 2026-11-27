import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { ApiError } from "@/lib/server/utils/api-error";
import { generateEbookVisual } from "@/lib/ebook/groq";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  text: z.string().trim().min(10).max(4000),
  brand: z.string().trim().min(1).max(80).default("1section"),
  niche: z.string().trim().max(120).optional(),
  bookTitle: z.string().trim().max(200).optional(),
  chapterTitle: z.string().trim().max(200).optional(),
  instruction: z.string().trim().max(400).optional(),
});

export async function POST(req: NextRequest) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const input = schema.parse(await req.json());
    return ok(await generateEbookVisual(input));
  } catch (e) {
    if (e instanceof Error && /rate_limit_exceeded|\(429\)/i.test(e.message)) {
      return fail(new ApiError(429, "Groq rate limit reached. Please try again shortly.", { code: "RATE_LIMITED" }));
    }
    return fail(e);
  }
}

import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { generateProductMetadata } from "@/lib/ebook/groq";
import {
  getEbookProject,
  parseProjectContent,
} from "@/lib/server/modules/builder/builder.service";
import { ApiError } from "@/lib/server/utils/api-error";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminSync(await getAdmin(req), ["admin"]);
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      brand?: string;
      niche?: string;
      bookTitle?: string;
      description?: string;
      chapters?: { title: string }[];
    };

    const project = await getEbookProject(id);
    const content = parseProjectContent(project.content);

    const metadata = await generateProductMetadata({
      brand: body.brand ?? content.brand,
      niche: body.niche ?? content.niche,
      bookTitle: body.bookTitle ?? content.title,
      description: body.description ?? content.description,
      chapters: body.chapters ?? content.chapters,
    });

    return ok(metadata, 200);
  } catch (e) {
    if (e instanceof Error && /GROQ_API_KEY/i.test(e.message)) {
      return fail(new ApiError(503, e.message, { code: "GROQ_NOT_CONFIGURED" }));
    }
    if (e instanceof Error && /rate_limit|429/i.test(e.message)) {
      return fail(new ApiError(429, e.message, { code: "RATE_LIMITED" }));
    }
    if (e instanceof ApiError) return fail(e);
    if (e instanceof Error) {
      return fail(new ApiError(502, e.message, { code: "AI_ERROR" }));
    }
    return fail(e);
  }
}

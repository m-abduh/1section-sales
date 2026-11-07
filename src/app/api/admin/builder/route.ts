import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { ApiError } from "@/lib/server/utils/api-error";
import { recordAudit } from "@/lib/server/lib/audit";
import { generateEbookWithGroq } from "@/lib/ebook/groq";
import { ebookSchema } from "@/lib/ebook/schema";
import type { EbookContent } from "@/lib/ebook/types";
import {
  createEbookProject,
  listEbookProjects,
} from "@/lib/server/modules/builder/builder.service";
import { generateEbookSchema } from "@/lib/server/modules/builder/builder.schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    return ok(await listEbookProjects());
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const body = (await req.json().catch(() => ({}))) as {
      content?: unknown;
      prompt?: string;
      brand?: string;
      niche?: string;
      title?: string;
    };

    let content: EbookContent;
    const prompt =
      body.prompt?.trim() || "Konten 1section yang dibuat dari editor.";

    if (body.content !== undefined) {
      content = ebookSchema.parse(body.content);
    } else {
      const input = generateEbookSchema.parse(body);
      content = await generateEbookWithGroq(input);
    }

    const project = await createEbookProject({
      title: content.title,
      prompt,
      content,
    });

    await recordAudit({
      adminId: admin.id,
      action: "ebook_project.create",
      entity: "EbookProject",
      entityId: project.id,
      metadata: { title: project.title, chapters: content.chapters.length },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return ok({ id: project.id, updatedAt: project.updatedAt }, 201);
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

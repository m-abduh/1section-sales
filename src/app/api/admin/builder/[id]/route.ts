import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { ApiError } from "@/lib/server/utils/api-error";
import { recordAudit } from "@/lib/server/lib/audit";
import { ebookSchema } from "@/lib/ebook/schema";
import type { EbookContent } from "@/lib/ebook/types";
import {
  deleteEbookProject,
  getEbookProject,
  updateEbookProject,
} from "@/lib/server/modules/builder/builder.service";
import { updateEbookProjectSchema } from "@/lib/server/modules/builder/builder.schema";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const { id } = await params;
    return ok(await getEbookProject(id));
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const { id } = await params;
    const input = updateEbookProjectSchema.parse(await req.json());

    let content: EbookContent | undefined;
    if (input.content !== undefined) {
      const parsed = ebookSchema.safeParse(input.content);
      if (!parsed.success) {
        throw new ApiError(
          400,
          parsed.error.issues[0]?.message ?? "Konten ebook tidak valid.",
          { code: "INVALID_CONTENT", details: parsed.error.issues },
        );
      }
      content = parsed.data;
    }

    const project = await updateEbookProject(id, {
      ...(input.title !== undefined || content
        ? { title: input.title ?? content?.title }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(content ? { content } : {}),
    });

    await recordAudit({
      adminId: admin.id,
      action: "ebook_project.update",
      entity: "EbookProject",
      entityId: project.id,
      metadata: { status: project.status },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return ok(project);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const { id } = await params;
    await deleteEbookProject(id);
    await recordAudit({
      adminId: admin.id,
      action: "ebook_project.delete",
      entity: "EbookProject",
      entityId: id,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}

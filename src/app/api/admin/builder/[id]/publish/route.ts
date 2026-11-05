import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { recordAudit } from "@/lib/server/lib/audit";
import { publishEbookProject } from "@/lib/server/modules/builder/builder.service";
import { publishEbookProjectSchema } from "@/lib/server/modules/builder/builder.schema";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const { id } = await params;
    const input = publishEbookProjectSchema.parse(await req.json());
    const product = await publishEbookProject(id, input);

    await recordAudit({
      adminId: admin.id,
      action: "ebook_project.publish",
      entity: "EbookProject",
      entityId: id,
      metadata: { productId: product.id, name: product.name },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return ok(product, 201);
  } catch (e) {
    return fail(e);
  }
}

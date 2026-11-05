import { NextRequest, NextResponse } from "next/server";
import { fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { generateEbookPdf } from "@/lib/ebook/pdf";
import {
  getEbookProject,
  parseProjectContent,
} from "@/lib/server/modules/builder/builder.service";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "ebook"
  );
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const { id } = await params;
    const project = await getEbookProject(id);
    const content = parseProjectContent(project.content);

    const buffer = await generateEbookPdf(content);
    const download = req.nextUrl.searchParams.get("download") === "1";
    const filename = `${slugify(project.title)}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return fail(e);
  }
}

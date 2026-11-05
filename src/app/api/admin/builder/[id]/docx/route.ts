import { NextRequest, NextResponse } from "next/server";
import { fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { generateEbookDocx } from "@/lib/ebook/docx";
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

    const generated = await generateEbookDocx(content);
    const search = req.nextUrl.searchParams;
    const download = search.get("download") === "1";
    const filename = `${slugify(project.title)}.docx`;

    return new NextResponse(new Uint8Array(generated), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return fail(e);
  }
}

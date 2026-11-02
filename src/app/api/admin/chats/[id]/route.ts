import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { chatSessionIdParamSchema } from "@/lib/server/modules/chat/chat.schema";
import { getChatSession } from "@/lib/server/modules/chat/chat.admin.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const { id } = await params;
    chatSessionIdParamSchema.parse({ id });
    const session = await getChatSession(id);
    return ok(session);
  } catch (e) {
    return fail(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  fail,
  getAdmin,
  parseQuery,
  requireAdminSync,
} from "@/lib/server/next-helpers";
import { adminChatListQuerySchema } from "@/lib/server/modules/chat/chat.schema";
import {
  getChatStats,
  listChatSessions,
} from "@/lib/server/modules/chat/chat.admin.service";

export async function GET(req: NextRequest) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const q = parseQuery(req, adminChatListQuerySchema);

    const [result, stats] = await Promise.all([
      listChatSessions({
        page: q.page ?? 1,
        pageSize: q.pageSize ?? 20,
        status: q.status,
        search: q.search,
      }),
      getChatStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      stats,
    });
  } catch (e) {
    return fail(e);
  }
}

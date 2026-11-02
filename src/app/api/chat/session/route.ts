import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ok,
  fail,
  parseJson,
  rateLimit,
  clientIp,
} from "@/lib/server/next-helpers";
import { chatSessionCloseSchema } from "@/lib/server/modules/chat/chat.schema";
import { markChatSessionClosed } from "@/lib/server/modules/chat/chat.session";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`chat-session:${clientIp(req)}`, 60, 60 * 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please wait a moment.",
          },
        },
        { status: 429 },
      );
    }

    const body = await parseJson(req, chatSessionCloseSchema);
    await markChatSessionClosed(body.sessionKey, body.reason);

    return ok({ closed: true });
  } catch (error) {
    return fail(error);
  }
}

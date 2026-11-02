import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ok,
  fail,
  parseJson,
  rateLimit,
  clientIp,
} from "@/lib/server/next-helpers";
import { chatRequestSchema } from "@/lib/server/modules/chat/chat.schema";
import {
  buildKnowledgeContext,
  generateCustomerServiceReply,
} from "@/lib/server/modules/chat/chat.service";
import {
  closeStaleChatSessions,
  recordChatExchange,
} from "@/lib/server/modules/chat/chat.session";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`chat:${clientIp(req)}`, 20, 60 * 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many messages. Please wait a moment.",
          },
        },
        { status: 429 },
      );
    }

    const body = await parseJson(req, chatRequestSchema);
    const hostname =
      req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";

    await closeStaleChatSessions().catch((error) => {
      console.error("[chat] failed to close stale sessions:", error);
    });

    const pageContext = await buildKnowledgeContext(
      body.path ?? "/",
      hostname,
      body.messages,
    );
    const reply = await generateCustomerServiceReply(body.messages, pageContext);

    const userMessage =
      [...body.messages].reverse().find((message) => message.role === "user")
        ?.content ?? "";

    if (body.sessionKey && userMessage) {
      await recordChatExchange({
        sessionKey: body.sessionKey,
        path: body.path ?? "/",
        hostname,
        openedAt: body.openedAt,
        userContent: userMessage,
        reply,
      }).catch((error) => {
        console.error("[chat] failed to record exchange:", error);
      });
    }

    return ok({ reply });
  } catch (error) {
    return fail(error);
  }
}

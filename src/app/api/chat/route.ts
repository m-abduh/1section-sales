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

    const pageContext = await buildKnowledgeContext(
      body.path ?? "/",
      hostname,
      body.messages,
    );
    const reply = await generateCustomerServiceReply(body.messages, pageContext);

    return ok({ reply });
  } catch (error) {
    return fail(error);
  }
}

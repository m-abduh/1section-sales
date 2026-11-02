import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

const MAX_TRANSCRIPT_MESSAGES = 20;
const SESSION_TTL_DAYS = 30;
const IDLE_TIMEOUT_MINUTES = 30;

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

function asJsonTranscript(messages: StoredMessage[]): Prisma.InputJsonValue {
  return messages as unknown as Prisma.InputJsonValue;
}

interface RecordChatExchangeInput {
  sessionKey: string;
  path: string;
  hostname: string;
  openedAt?: string;
  userContent: string;
  reply: string;
}

function getSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return null;

  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "1section.com")
    .split(":")[0]
    .toLowerCase();

  for (const suffix of new Set([rootDomain, "localhost", "lvh.me"])) {
    if (!host.endsWith(`.${suffix}`)) continue;
    const sub = host.slice(0, -(suffix.length + 1));
    if (sub && !sub.includes(".") && sub !== "www" && sub !== "admin") {
      return sub;
    }
  }

  return null;
}

function getPageSlugs(
  pathname: string,
  hostname: string,
): { productSlug: string | null; nicheSlug: string | null } {
  const path = pathname.split("?")[0].split("#")[0] || "/";

  const resourceMatch = path.match(/^\/resources\/([^/]+)\/?$/);
  if (resourceMatch) {
    return { productSlug: resourceMatch[1], nicheSlug: null };
  }

  const nicheMatch = path.match(/^\/niche\/([^/]+)\/?$/);
  if (nicheMatch) {
    return { productSlug: null, nicheSlug: nicheMatch[1] };
  }

  const subdomain = getSubdomain(hostname);
  if (subdomain && path === "/") {
    return { productSlug: null, nicheSlug: subdomain };
  }

  return { productSlug: null, nicheSlug: null };
}

function resolveOpenedAt(value?: string): Date {
  const now = Date.now();
  if (!value) return new Date(now);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date(now);
  if (parsed.getTime() > now) return new Date(now);
  if (parsed.getTime() < now - 6 * 60 * 60 * 1000) return new Date(now);

  return parsed;
}

function redactPersonalData(value: string): string {
  return value
    .slice(0, 1000)
    .replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      "[email]",
    )
    .replace(/\b(?:\d[ -]?){9,19}\b/g, "[number]")
    .replace(
      /\b(order|invoice|transaction|txn)[\s#:-]*[a-z0-9-]{4,}\b/gi,
      "$1 [redacted]",
    );
}

function readTranscript(value: unknown): StoredMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (message): message is StoredMessage =>
        typeof message === "object" &&
        message !== null &&
        "role" in message &&
        "content" in message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    )
    .slice(-MAX_TRANSCRIPT_MESSAGES);
}

function transcriptMessage(
  role: StoredMessage["role"],
  content: string,
  at: Date,
): StoredMessage {
  return {
    role,
    content: redactPersonalData(content),
    at: at.toISOString(),
  };
}

export async function recordChatExchange({
  sessionKey,
  path,
  hostname,
  openedAt,
  userContent,
  reply,
}: RecordChatExchangeInput): Promise<void> {
  const now = new Date();
  const { productSlug, nicheSlug } = getPageSlugs(path, hostname);
  const userMessage = transcriptMessage("user", userContent, now);
  const assistantMessage = transcriptMessage("assistant", reply, now);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.chatSession.findUnique({
      where: { sessionKey },
    });

    if (!existing) {
      await tx.chatSession.create({
        data: {
          sessionKey,
          pagePath: path.slice(0, 300),
          productSlug,
          nicheSlug,
          openedAt: resolveOpenedAt(openedAt),
          firstMessageAt: now,
          lastSeenAt: now,
          messageCount: 1,
          transcript: asJsonTranscript([userMessage, assistantMessage]),
          expiresAt: new Date(
            now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
          ),
        },
      });
      return;
    }

    const transcript = [
      ...readTranscript(existing.transcript),
      userMessage,
      assistantMessage,
    ].slice(-MAX_TRANSCRIPT_MESSAGES);

    await tx.chatSession.update({
      where: { sessionKey },
      data: {
        pagePath: path.slice(0, 300),
        productSlug,
        nicheSlug,
        lastSeenAt: now,
        closedAt: null,
        closeReason: null,
        messageCount: { increment: 1 },
        transcript: asJsonTranscript(transcript),
      },
    });
  });
}

export async function markChatSessionClosed(
  sessionKey: string,
  reason: "user_closed" | "page_exit",
): Promise<void> {
  await prisma.chatSession.updateMany({
    where: { sessionKey, closedAt: null },
    data: { closedAt: new Date(), closeReason: reason },
  });
}

/**
 * Sessions whose tab disappeared without a close event are finalized lazily.
 * closedAt is estimated from the last activity plus the idle window.
 * Expired transcripts are removed here too, so no extra cron is required.
 */
export async function closeStaleChatSessions(): Promise<void> {
  await prisma.chatSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  await prisma.$executeRawUnsafe(
    `UPDATE "chat_sessions"
     SET "closedAt" = "lastSeenAt" + interval '${IDLE_TIMEOUT_MINUTES} minutes',
         "closeReason" = 'idle_timeout'
     WHERE "closedAt" IS NULL
       AND "lastSeenAt" < now() - interval '${IDLE_TIMEOUT_MINUTES} minutes'`,
  );
}

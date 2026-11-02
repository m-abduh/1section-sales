import { Prisma } from "@prisma/client";
import type {
  AdminChatSessionDetail,
  AdminChatSessionSummary,
  AdminChatStats,
  ChatTranscriptMessage,
} from "@/lib/types";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";

const MAX_SEARCH_MATCHES = 500;
const PREVIEW_LENGTH = 160;

interface ListChatParams {
  page: number;
  pageSize: number;
  status?: "open" | "closed";
  search?: string;
}

function readTranscript(value: unknown): ChatTranscriptMessage[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (message): message is ChatTranscriptMessage =>
      typeof message === "object" &&
      message !== null &&
      "role" in message &&
      "content" in message &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      typeof (message as { at?: unknown }).at === "string",
  );
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

/**
 * Transcripts live in JSONB, so Prisma filters cannot reach inside them.
 * Only ids are read here; the caller still paginates through Prisma.
 */
async function findTranscriptMatches(search: string): Promise<string[]> {
  const pattern = `%${escapeLike(search)}%`;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "chat_sessions"
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_array_elements("transcript") AS message
      WHERE message->>'content' ILIKE ${pattern}
    )
    LIMIT ${MAX_SEARCH_MATCHES}
  `;

  return rows.map((row) => row.id);
}

async function loadPreviews(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();

  const rows = await prisma.$queryRaw<
    { id: string; preview: string | null }[]
  >`
    SELECT session."id",
      (
        SELECT message->>'content'
        FROM jsonb_array_elements(session."transcript")
          WITH ORDINALITY AS entry(message, position)
        WHERE message->>'role' = 'user'
        ORDER BY position DESC
        LIMIT 1
      ) AS preview
    FROM "chat_sessions" AS session
    WHERE session."id" IN (${Prisma.join(ids)})
  `;

  return new Map(
    rows
      .filter((row): row is { id: string; preview: string } => Boolean(row.preview))
      .map((row) => [row.id, truncate(row.preview, PREVIEW_LENGTH)]),
  );
}

export async function listChatSessions({
  page,
  pageSize,
  status,
  search,
}: ListChatParams): Promise<{
  items: AdminChatSessionSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> {
  const where: Prisma.ChatSessionWhereInput = {};

  if (status === "open") where.closedAt = null;
  if (status === "closed") where.closedAt = { not: null };

  if (search) {
    const matches = await findTranscriptMatches(search);
    where.OR = [
      { pagePath: { contains: search, mode: "insensitive" } },
      { productSlug: { contains: search, mode: "insensitive" } },
      { nicheSlug: { contains: search, mode: "insensitive" } },
    ];
    if (matches.length > 0) where.OR.push({ id: { in: matches } });
  }

  const [rows, total] = await Promise.all([
    prisma.chatSession.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        pagePath: true,
        productSlug: true,
        nicheSlug: true,
        openedAt: true,
        firstMessageAt: true,
        lastSeenAt: true,
        closedAt: true,
        closeReason: true,
        messageCount: true,
      },
    }),
    prisma.chatSession.count({ where }),
  ]);

  const previews = await loadPreviews(rows.map((row) => row.id));

  return {
    items: rows.map((row) => ({
      ...row,
      openedAt: row.openedAt.toISOString(),
      firstMessageAt: row.firstMessageAt.toISOString(),
      lastSeenAt: row.lastSeenAt.toISOString(),
      closedAt: row.closedAt?.toISOString() ?? null,
      preview: previews.get(row.id) ?? null,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

export async function getChatSession(
  id: string,
): Promise<AdminChatSessionDetail> {
  const session = await prisma.chatSession.findUnique({ where: { id } });

  if (!session) {
    throw ApiError.notFound("Chat session not found");
  }

  return {
    id: session.id,
    pagePath: session.pagePath,
    productSlug: session.productSlug,
    nicheSlug: session.nicheSlug,
    openedAt: session.openedAt.toISOString(),
    firstMessageAt: session.firstMessageAt.toISOString(),
    lastSeenAt: session.lastSeenAt.toISOString(),
    closedAt: session.closedAt?.toISOString() ?? null,
    closeReason: session.closeReason,
    messageCount: session.messageCount,
    transcript: readTranscript(session.transcript),
  };
}

export async function getChatStats(): Promise<AdminChatStats> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [total, open, today, messages, topPages] = await Promise.all([
    prisma.chatSession.count(),
    prisma.chatSession.count({ where: { closedAt: null } }),
    prisma.chatSession.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.chatSession.aggregate({ _sum: { messageCount: true } }),
    prisma.chatSession.groupBy({
      by: ["pagePath"],
      _count: { _all: true },
      orderBy: { _count: { pagePath: "desc" } },
      take: 5,
    }),
  ]);

  const messageTotal = messages._sum.messageCount ?? 0;

  return {
    total,
    open,
    closed: total - open,
    today,
    messages: messageTotal,
    averageMessages: total > 0 ? Math.round((messageTotal / total) * 10) / 10 : 0,
    topPages: topPages.map((row) => ({
      path: row.pagePath,
      sessions: row._count._all,
    })),
  };
}

"use client";

import { useState } from "react";
import type { AdminChatSessionSummary } from "@/lib/types";
import {
  useAdminChatSession,
  useAdminChats,
} from "@/hooks/use-admin-chats";
import { Modal } from "@/components/admin/modal";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatDate, formatRelative } from "@/lib/format";

const closeReasonLabels: Record<string, string> = {
  user_closed: "Visitor closed",
  page_exit: "Left page",
  idle_timeout: "Idle timeout",
};

function formatDuration(start: string, end: string | null): string {
  const ms = new Date(end ?? Date.now()).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";

  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(session: AdminChatSessionSummary): string {
  if (!session.closedAt) return "Open";
  return closeReasonLabels[session.closeReason ?? ""] ?? "Closed";
}

function pageLabel(session: AdminChatSessionSummary): string {
  const label = session.productSlug ?? session.nicheSlug;
  if (session.productSlug) return `Guide · ${label}`;
  if (session.nicheSlug) return `Niche · ${label}`;
  return session.pagePath;
}

export default function AdminChatsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"open" | "closed" | "">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<AdminChatSessionSummary | null>(null);

  const chats = useAdminChats({
    page,
    pageSize: 20,
    status: status || undefined,
    search: search || undefined,
  });
  const detail = useAdminChatSession(selected?.id ?? null);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Assistant"
        title="Conversations"
        description="What visitors ask the on-site assistant, captured for review."
      />

      {chats.data?.stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Conversations"
            value={chats.data.stats.total}
            hint="With at least one message"
          />
          <StatCard
            label="Open now"
            value={chats.data.stats.open}
            hint="Waiting for idle timeout"
          />
          <StatCard
            label="Today"
            value={chats.data.stats.today}
            hint="Started since midnight"
          />
          <StatCard
            label="Messages"
            value={chats.data.stats.messages}
            hint={`${chats.data.stats.averageMessages} per conversation`}
          />
        </div>
      ) : null}

      {chats.data?.stats?.topPages?.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-fg-muted">
          <span className="font-semibold uppercase tracking-wide">Top pages</span>
          {chats.data.stats.topPages.map((entry) => (
            <span
              key={entry.path}
              className="rounded-full bg-surface-muted px-2.5 py-1 text-fg"
            >
              {entry.path} · {entry.sessions}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <select
          className="rounded-lg border-0 bg-surface-muted px-3 py-2 text-sm text-fg ring-1 ring-inset ring-border focus:ring-2 focus:ring-accent"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as "open" | "closed" | "");
            setPage(1);
          }}
        >
          <option value="">All conversations</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>

        <form
          className="flex flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
        >
          <Input
            placeholder="Search message text, page, or product"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {chats.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading conversations...
        </div>
      ) : null}

      {chats.data && chats.data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface-muted text-2xl">
            💬
          </span>
          <p className="mt-4 text-sm font-medium text-fg">No conversations found</p>
          <p className="mt-1 text-xs text-fg-muted">
            {search || status
              ? "Try adjusting your filters."
              : "Conversations appear here once a visitor sends a message."}
          </p>
        </div>
      ) : null}

      {chats.data && chats.data.items.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface-muted/60 text-[11px] uppercase tracking-[0.12em] text-fg-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Conversation</th>
                  <th className="px-5 py-3 font-semibold">Messages</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Duration</th>
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chats.data.items.map((session) => (
                  <tr
                    key={session.id}
                    className="transition hover:bg-surface-muted/50"
                  >
                    <td className="max-w-md px-5 py-4">
                      <p className="font-medium text-fg">{pageLabel(session)}</p>
                      <p className="mt-0.5 truncate text-xs text-fg-muted">
                        {session.preview ?? session.pagePath}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-fg-muted">{session.messageCount}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          session.closedAt
                            ? "bg-surface-muted text-fg-muted"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {!session.closedAt ? (
                          <span className="size-1.5 rounded-full bg-current" />
                        ) : null}
                        {statusLabel(session)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-fg-muted">
                      {formatDuration(session.openedAt, session.closedAt)}
                    </td>
                    <td className="px-5 py-4 text-fg-muted">
                      <p>{formatRelative(session.lastSeenAt)}</p>
                      <p className="text-xs">{formatDate(session.firstMessageAt)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelected(session)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-fg-muted">
            <span>
              Page {chats.data.pagination.page} of{" "}
              {chats.data.pagination.totalPages} · {chats.data.pagination.total}{" "}
              conversations
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= chats.data.pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>

          <p className="text-xs text-fg-muted">
            Emails and order numbers are masked before storage. Only the last 20
            messages are kept, and conversations are deleted after 30 days.
          </p>
        </>
      ) : null}

      <Modal
        open={Boolean(selected)}
        title="Conversation"
        onClose={() => setSelected(null)}
        wide
      >
        {selected ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface-muted p-3">
                <p className="text-xs uppercase tracking-wide text-fg-muted">Page</p>
                <p className="mt-1 break-all font-medium text-fg">
                  {selected.pagePath}
                </p>
              </div>
              <div className="rounded-xl bg-surface-muted p-3">
                <p className="text-xs uppercase tracking-wide text-fg-muted">
                  Messages
                </p>
                <p className="mt-1 font-medium text-fg">{selected.messageCount}</p>
              </div>
              <div className="rounded-xl bg-surface-muted p-3">
                <p className="text-xs uppercase tracking-wide text-fg-muted">
                  Started
                </p>
                <p className="mt-1 text-fg">{formatDate(selected.openedAt)}</p>
              </div>
              <div className="rounded-xl bg-surface-muted p-3">
                <p className="text-xs uppercase tracking-wide text-fg-muted">
                  Ended
                </p>
                <p className="mt-1 text-fg">
                  {selected.closedAt
                    ? `${formatDate(selected.closedAt)} · ${statusLabel(selected)}`
                    : "Still open"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-fg-muted">
                Transcript
              </p>

              {detail.isLoading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
                  <Spinner /> Loading transcript...
                </div>
              ) : detail.data ? (
                <div className="mt-3 max-h-[26rem] space-y-3 overflow-y-auto rounded-xl bg-surface-muted p-4">
                  {detail.data.transcript.map((message, index) => (
                    <div
                      key={`${message.at}-${index}`}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                          message.role === "user"
                            ? "bg-fg text-surface"
                            : "bg-card text-fg ring-1 ring-border"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`mt-1 text-[10px] ${
                            message.role === "user"
                              ? "text-surface/60"
                              : "text-fg-muted"
                          }`}
                        >
                          {message.role === "user" ? "Visitor" : "Assistant"} ·{" "}
                          {formatTime(message.at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-fg-muted">
                  Transcript is no longer available.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

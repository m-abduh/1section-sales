"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: number;
  role: ChatRole;
  content: string;
  error?: boolean;
  /** Hardcoded UI text (e.g. the greeting) that must never be sent to Groq. */
  local?: boolean;
}

const GREETING = "Hey, need a hand with anything here? 👋";
const OPENER_KEY = "1section:customer-service-opened-v2";

function createSessionKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cs-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isNicheSubdomain(hostname: string): boolean {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return false;

  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "1section.com")
    .split(":")[0]
    .toLowerCase();

  for (const suffix of new Set([rootDomain, "localhost", "lvh.me"])) {
    if (!host.endsWith(`.${suffix}`)) continue;
    const sub = host.slice(0, -(suffix.length + 1));
    return Boolean(sub) && !sub.includes(".") && sub !== "www" && sub !== "admin";
  }

  return false;
}

function getQuickQuestions(pathname: string, hostname: string): string[] {
  if (hostname && isNicheSubdomain(hostname) && pathname === "/") {
    return [
      "Which guide should I start with?",
      "Are these free?",
      "What is this about?",
      "How do I access a guide?",
    ];
  }

  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/") {
    return [
      "What do you sell?",
      "Are the guides free?",
      "How do I get access?",
      "Which guide is best for me?",
    ];
  }

  if (path.startsWith("/resources/")) {
    return [
      "What will I learn?",
      "Who is it for?",
      "What do I get?",
      "How do I get it?",
    ];
  }

  if (path.startsWith("/niche/")) {
    return [
      "Which guide should I start with?",
      "Are these free?",
      "What is this about?",
      "How do I access a guide?",
    ];
  }

  if (path === "/faq") {
    return [
      "Refunds?",
      "How do I get my files?",
      "Is this a subscription?",
      "Do I need an account?",
    ];
  }

  if (path === "/support") {
    return [
      "I lost my link",
      "Payment issue",
      "Refund request",
      "Wrong email address",
    ];
  }

  if (path === "/checkout/success") {
    return [
      "Where are my files?",
      "I can't download",
      "Wrong email?",
      "How do I retrieve my order?",
    ];
  }

  return [
    "What is 1section?",
    "How do I get my files?",
    "Refunds?",
    "Do I need an account?",
  ];
}


function ChatIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H7l-4 3v-5.4A8.5 8.5 0 1 1 21 11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 10.5h7M8.5 14h4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CustomerServiceWidget() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: "assistant", content: GREETING, local: true },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const sessionKeyRef = useRef<string | null>(null);
  const openedAtRef = useRef<string | null>(null);
  const hasMessagesRef = useRef(false);

  const endSession = useCallback((reason: "user_closed" | "page_exit") => {
    const sessionKey = sessionKeyRef.current;
    if (!sessionKey || !hasMessagesRef.current) return;

    const payload = JSON.stringify({ sessionKey, reason });

    if (
      reason === "page_exit" &&
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const sent = navigator.sendBeacon(
        "/api/chat/session",
        new Blob([payload], { type: "application/json" }),
      );
      if (sent) return;
    }

    void fetch("/api/chat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Best effort: the server also closes idle sessions.
    });
  }, []);

  const isAdmin =
    pathname.startsWith("/admin") ||
    (typeof window !== "undefined" &&
      window.location.hostname.toLowerCase().startsWith("admin."));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a small "1 new message" teaser first; never auto-open the full chat.
  useEffect(() => {
    if (!mounted) return;
    let seen = "0";
    try {
      seen = window.localStorage.getItem(OPENER_KEY) ?? "0";
    } catch {
      // ignore private-mode failures
    }
    if (seen === "1") return;

    const timer = window.setTimeout(() => setTeaser(true), 900);
    return () => window.clearTimeout(timer);
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        endSession("user_closed");
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, endSession]);

  useEffect(() => {
    const onPageHide = () => endSession("page_exit");
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [endSession]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, open, sending]);

  if (!mounted || isAdmin) return null;

  const openChat = () => {
    if (!sessionKeyRef.current) sessionKeyRef.current = createSessionKey();
    if (!openedAtRef.current) openedAtRef.current = new Date().toISOString();
    setOpen(true);
    setTeaser(false);
    try {
      window.localStorage.setItem(OPENER_KEY, "1");
    } catch {
      // ignore
    }
    window.setTimeout(() => inputRef.current?.focus(), 150);
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;

    const userMessage: ChatMessage = {
      id: nextId.current++,
      role: "user",
      content,
    };
    const outgoing = [...messages, userMessage]
      .filter((message) => !message.error && !message.local)
      .slice(-8);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          sessionKey: sessionKeyRef.current ?? undefined,
          openedAt: openedAtRef.current ?? undefined,
          messages: outgoing.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; data?: { reply?: string }; error?: { message?: string } }
        | null;

      const reply = payload?.data?.reply;
      if (!response.ok || !reply) {
        throw new Error(
          payload?.error?.message ??
            "I could not reply just now. Please email support@1section.com.",
        );
      }

      setMessages((current) => [
        ...current,
        { id: nextId.current++, role: "assistant", content: reply },
      ]);
      hasMessagesRef.current = true;
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please email support@1section.com.",
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const showSuggestions = messages.length === 1;
  const quickQuestions = getQuickQuestions(
    pathname,
    typeof window !== "undefined" ? window.location.hostname : "",
  );

  return (
    <>
      {!open && teaser ? (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-5.5rem)] max-w-[290px] origin-bottom-right animate-fade-up sm:right-6">
          <div className="relative rounded-2xl rounded-br-md border border-border bg-card p-3.5 shadow-xl shadow-black/15">
            <button
              type="button"
              onClick={() => setTeaser(false)}
              aria-label="Dismiss message"
              className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full text-fg-muted transition hover:bg-surface-muted hover:text-fg"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={openChat}
              className="block w-full text-left"
            >
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                1 new message
              </span>
              <span className="mt-1.5 block pr-4 text-sm leading-5 text-fg">
                {GREETING}
              </span>
              <span className="mt-2 block text-[10px] font-medium text-fg-muted">
                Tap to chat
              </span>
            </button>
            <span
              aria-hidden
              className="absolute -bottom-1.5 right-5 size-3 rotate-45 border-b border-r border-border bg-card"
            />
          </div>
        </div>
      ) : null}

      <div
        className={`fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-[380px] origin-bottom-right animate-fade-up sm:right-6 ${
          open ? "" : "pointer-events-none hidden"
        }`}
      >
        <div
          role="dialog"
          aria-label="Customer service chat"
          className="flex h-[min(540px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/20"
        >
          <div className="flex items-center gap-3 border-b border-border bg-surface-muted/60 px-4 py-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg">
              <ChatIcon className="size-4" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">
                1section support
              </p>
              <p className="truncate text-[11px] text-fg-muted">
                AI assistant · here to help
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                endSession("user_closed");
                setOpen(false);
              }}
              aria-label="Close chat"
              className="inline-flex size-8 items-center justify-center rounded-full text-fg-muted transition hover:bg-card hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div
            ref={listRef}
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                    message.role === "user"
                      ? "rounded-br-md bg-accent text-accent-fg"
                      : message.error
                        ? "rounded-bl-md border border-border bg-surface-muted text-fg-muted"
                        : "rounded-bl-md bg-surface-muted text-fg"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}

            {sending ? (
              <div className="flex justify-start">
                <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface-muted px-3.5 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-fg-muted [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-fg-muted [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-fg-muted" />
                  <span className="sr-only">Assistant is typing</span>
                </span>
              </div>
            ) : null}

            {showSuggestions ? (
              <div className="pt-1">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-fg-muted">
                  Quick questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:border-fg/30 hover:text-fg"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="border-t border-border p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-border bg-surface p-1.5 focus-within:border-fg/30">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a quick question..."
                aria-label="Message"
                autoComplete="off"
                maxLength={500}
                className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-fg outline-none placeholder:text-fg-muted"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
                  <path
                    d="M4 12h15M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-fg-muted">
              Contact:{" "}
              <a
                href="mailto:support@1section.com"
                className="font-medium text-fg transition hover:underline"
              >
                support@1section.com
              </a>
            </p>
          </form>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (open) {
            endSession("user_closed");
            setOpen(false);
            return;
          }
          openChat();
        }}
        aria-label={open ? "Close customer service chat" : "Open customer service chat"}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-[60] inline-flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-black/25 transition hover:scale-105 hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:right-6"
      >
        {!open && teaser ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-surface">
            1
          </span>
        ) : null}
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-5">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <ChatIcon className="size-6" />
        )}
      </button>
    </>
  );
}

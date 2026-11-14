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

const GREETING = "Hi, how can I help? 👋😊";
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

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 3.5l1.6 4.4L18 9.5l-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
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
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-5.5rem)] max-w-[300px] origin-bottom-right sm:right-6 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif]">
          <div
            className="relative rounded-2xl border border-slate-200/80 bg-white/50 p-4 shadow-xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50"
            style={{ backdropFilter: "blur(24px) saturate(150%)", WebkitBackdropFilter: "blur(24px) saturate(150%)" }}
          >
            <button
              type="button"
              onClick={() => setTeaser(false)}
              aria-label="Dismiss message"
              className="absolute right-2.5 top-2.5 inline-flex size-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-[#958ea0] dark:hover:bg-[#292a2f] dark:hover:text-[#e3e1e9]"
            >
              <CloseIcon className="size-3" />
            </button>
            <button type="button" onClick={openChat} className="group block w-full text-left">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-[#958ea0]">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-[#4edea3]" />
                1 new message
              </span>
              <span className="mt-2 block pr-5 text-sm leading-6 text-slate-800 dark:text-[#e3e1e9]">
                {GREETING}
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition group-hover:text-indigo-700 dark:text-[#d0bcff] dark:group-hover:text-[#e9ddff]">
                Chat now
                <SendIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
            <span
              aria-hidden
              className="absolute -bottom-1.5 right-5 size-3 rotate-45 border-b border-r border-slate-200/80 bg-white/50 dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50"
              style={{ backdropFilter: "blur(24px) saturate(150%)", WebkitBackdropFilter: "blur(24px) saturate(150%)" }}
            />
          </div>
        </div>
      ) : null}

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close chat"
            onClick={() => {
              endSession("user_closed");
              setOpen(false);
            }}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm dark:bg-black/35"
          />
          <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-[390px] origin-bottom-right animate-fade-up sm:right-6 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif]">
            <div
              role="dialog"
              aria-label="Customer service chat"
              className="flex h-[min(580px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-2xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/70"
            >
              <div className="relative flex items-center gap-3 border-b border-slate-200/80 bg-white/50 px-4 py-3.5 backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#292a2f]/40">
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-[#0d0e13]">
                  <ChatIcon className="size-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#1e1f25] dark:bg-[#4edea3]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-[#e3e1e9]">Customer Service</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-[#958ea0]">AI assistant · online</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    endSession("user_closed");
                    setOpen(false);
                  }}
                  aria-label="Close chat"
                  className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/60 text-slate-500 backdrop-blur-md transition hover:bg-white hover:text-slate-900 dark:border-[#34343a]/40 dark:bg-[#292a2f]/60 dark:text-[#958ea0] dark:hover:bg-[#34343a] dark:hover:text-[#e3e1e9]"
                >
                  <CloseIcon className="size-4" />
                </button>
              </div>

              <div
                ref={listRef}
                aria-live="polite"
                className="flex-1 space-y-3.5 overflow-y-auto bg-slate-50/40 px-4 py-5 dark:bg-[#121318]/40"
              >
                {messages.map((message) =>
                  message.role === "user" ? (
                    <div key={message.id} className="flex justify-end">
                      <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-slate-900 px-3.5 py-2.5 text-sm leading-6 text-white shadow-sm dark:bg-white dark:text-[#0d0e13]">
                        {message.content}
                      </p>
                    </div>
                  ) : (
                    <div key={message.id} className="flex justify-start">
                      <p
                        className={`max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm leading-6 ${
                          message.error
                            ? "border border-red-300/60 bg-red-50/80 text-slate-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-[#e3e1e9]"
                            : "border border-slate-200/80 bg-white/70 text-slate-700 backdrop-blur-md dark:border-[#34343a]/40 dark:bg-[#292a2f]/60 dark:text-[#cbc3d7]"
                        }`}
                      >
                        {message.content}
                      </p>
                    </div>
                  ),
                )}

                {sending ? (
                  <div className="flex justify-start">
                    <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200/80 bg-white/70 px-3.5 py-3 backdrop-blur-md dark:border-[#34343a]/40 dark:bg-[#292a2f]/60">
                      <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s] dark:bg-[#958ea0]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s] dark:bg-[#958ea0]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-[#958ea0]" />
                      <span className="sr-only">Assistant is typing</span>
                    </span>
                  </div>
                ) : null}

                {showSuggestions ? (
                  <div className="pt-2">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-[#958ea0]">
                      <SparkIcon className="size-3" />
                      Try asking
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quickQuestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => void send(suggestion)}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 dark:border-[#34343a]/40 dark:bg-[#292a2f]/60 dark:text-[#cbc3d7] dark:hover:bg-[#34343a] dark:hover:text-[#e3e1e9]"
                        >
                          {suggestion}
                          <SendIcon className="size-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
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
                className="border-t border-slate-200/80 bg-white/50 p-3 backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#292a2f]/40"
              >
                <div className="flex items-end gap-2 rounded-2xl border border-slate-200/80 bg-white/70 p-1.5 pl-3.5 shadow-sm backdrop-blur-md transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-[#34343a]/40 dark:bg-[#1e1f25]/60 dark:focus-within:border-[#d0bcff]/40 dark:focus-within:ring-[#d0bcff]/15">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask a quick question..."
                    aria-label="Message"
                    autoComplete="off"
                    maxLength={500}
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-[#e3e1e9] dark:placeholder:text-[#958ea0]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    aria-label="Send message"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white dark:text-[#0d0e13] dark:hover:bg-neutral-100"
                  >
                    <SendIcon className="size-4" />
                  </button>
                </div>
                <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] text-slate-500 dark:text-[#958ea0]">
                  <span>AI assistant can make mistakes ·</span>
                  <a href="mailto:support@1section.com" className="font-medium text-slate-700 underline decoration-slate-400/50 underline-offset-2 transition hover:text-slate-900 dark:text-[#cbc3d7] dark:hover:text-[#e3e1e9]">
                    support@1section.com
                  </a>
                </p>
              </form>
            </div>
          </div>
        </>
      ) : null}

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
        className={`group fixed bottom-5 right-4 z-[60] inline-flex h-14 items-center justify-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-900 text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-[#34343a]/40 dark:bg-white dark:text-[#0d0e13] dark:hover:bg-neutral-100 sm:right-6 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif] ${
          open ? "w-14" : "w-14 sm:w-auto sm:pl-5 sm:pr-5"
        } ${
          !open && teaser
            ? "shadow-[0_0_0_5px_rgba(16,185,129,0.18),0_14px_44px_-10px_rgba(15,23,42,0.35)] dark:shadow-[0_0_0_5px_rgba(78,222,163,0.18),0_14px_44px_-10px_rgba(0,0,0,0.5)]"
            : "shadow-[0_12px_40px_-10px_rgba(15,23,42,0.3)] dark:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.5)]"
        }`}
      >
        {!open && teaser ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-[#f6f7fb] dark:bg-[#4edea3] dark:text-[#00311f] dark:ring-[#121318]">
            1
          </span>
        ) : null}
        <span className="relative flex size-6 items-center justify-center">
          <ChatIcon
            className={`absolute size-6 transition-all duration-300 ${
              open ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
            }`}
          />
          <CloseIcon
            className={`absolute size-5 transition-all duration-300 ${
              open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
            }`}
          />
        </span>
        {!open ? (
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">Chat with us</span>
        ) : null}
      </button>
    </>
  );
}

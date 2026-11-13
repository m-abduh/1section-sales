"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { apiUrl } from "@/lib/site";
import { formatCurrency, formatDate } from "@/lib/format";
import { LAST_ORDER_KEY, LAST_TXN_KEY } from "@/hooks/use-checkout";
import type { PublicOrder } from "@/lib/types";
import { StatusBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SitePageHero } from "@/components/site/site-page-hero";

function startDownload(url: string) {
  // Trigger the download from a hidden iframe so the file is saved instead of
  // being opened in a tab, and the underlying link is never exposed.
  const frame = document.createElement("iframe");
  frame.style.display = "none";
  frame.src = url;
  document.body.appendChild(frame);
  window.setTimeout(() => frame.remove(), 60_000);
}

function validRef(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return null;
  return trimmed;
}

type DownloadState = "idle" | "loading" | "done";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [email, setEmail] = useState("");
  const [proofEmail, setProofEmail] = useState("");
  const [downloadState, setDownloadState] = useState<Record<string, DownloadState>>({});

  useEffect(() => {
    const fromQuery = validRef(searchParams.get("order"));
    const txn = validRef(searchParams.get("_ptxn") ?? searchParams.get("txn"));
    const ref = fromQuery || txn;
    if (ref) {
      setOrderRef(ref);
      return;
    }
    try {
      const storedTxn = validRef(window.localStorage.getItem(LAST_TXN_KEY));
      const storedOrder = validRef(window.localStorage.getItem(LAST_ORDER_KEY));
      const stored = storedTxn || storedOrder;
      if (stored) setOrderRef(stored);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  const orderQuery = useQuery({
    queryKey: ["order-status", orderRef, proofEmail],
    enabled: Boolean(orderRef),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (proofEmail) params.email = proofEmail;
      const response = await api.get<{ data: PublicOrder }>(
        `/orders/${orderRef}/status`,
        { params },
      );
      return response.data.data;
    },
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 3000 : false,
  });

  const handleDownload = (token: string, url: string) => {
    setDownloadState((prev) => {
      const current = prev[token];
      if (current === "loading" || current === "done") return prev;
      return { ...prev, [token]: "loading" };
    });
    // Guard against double-invocation in same tick
    if (downloadState[token] === "loading" || downloadState[token] === "done") return;
    startDownload(url);
    window.setTimeout(() => {
      setDownloadState((prev) => ({ ...prev, [token]: "done" }));
    }, 1200);
  };

  return (
    <div className="flex flex-1 flex-col bg-surface">
      <SitePageHero
        maxWidth="max-w-4xl"
        eyebrow="Purchase"
        title="Your downloads"
        description="Enter your Paddle transaction ID or order number below to access your purchase."
      >
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted transition hover:text-fg"
          >
            ← Back to home
          </Link>
        </div>
      </SitePageHero>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          {!orderRef ? (
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <p className="text-sm font-medium text-fg">
                Enter your Paddle transaction ID or order number to retrieve a
                purchase.
              </p>
              <form
                className="mt-5 flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  const ref = manual.trim();
                  if (ref) setOrderRef(ref);
                }}
              >
                <Input
                  value={manual}
                  onChange={(event) => setManual(event.target.value)}
                  placeholder="txn_... or ORD-..."
                  className="flex-1"
                />
                <Button type="submit">Retrieve</Button>
              </form>
            </div>
          ) : null}

          {orderRef && orderQuery.isLoading ? (
            <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-8 text-sm text-fg-muted">
              <Spinner /> Loading your purchase...
            </div>
          ) : null}

          {orderRef && orderQuery.isError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {getApiErrorMessage(orderQuery.error)}
            </div>
          ) : null}

          {orderQuery.data ? (
            <div className="space-y-6">
              {/* Order summary card */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
                      {orderQuery.data.orderNumber.startsWith("txn_")
                        ? "Transaction"
                        : "Order"}
                    </p>
                    <p className="mt-1 text-xl font-bold tracking-tight text-fg">
                      {orderQuery.data.orderNumber}
                    </p>
                    {orderQuery.data.total > 0 || orderQuery.data.paidAt ? (
                      <p className="mt-1 text-xs text-fg-muted">
                        {formatCurrency(orderQuery.data.total, orderQuery.data.currency)}{" "}
                        · {formatDate(orderQuery.data.paidAt ?? new Date())}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={orderQuery.data.status} />
                </div>
              </div>

              {orderQuery.data.status === "PENDING" ? (
                <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface-muted p-6 text-sm text-fg">
                  <Spinner /> Waiting for payment confirmation from Paddle...
                </div>
              ) : null}

              {orderQuery.data.status === "PAID" && !orderQuery.data.authorized ? (
                <div className="rounded-3xl border border-border bg-card p-8 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-muted text-2xl">
                    ✉
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-fg">
                    Access your purchase
                  </h2>
                  <p className="mt-2 text-sm text-fg-muted">
                    Your payment is confirmed.{" "}
                    {orderQuery.data.hasEmail
                      ? "Enter the email address used at checkout to retrieve your downloads."
                      : "We could not verify an email address for this order. Contact support with your order number to restore access."}
                  </p>
                  {orderQuery.data.hasEmail ? (
                    <form
                      className="mx-auto mt-5 flex max-w-lg flex-col gap-3 sm:flex-row"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const submittedEmail = email.trim();
                        if (submittedEmail) setProofEmail(submittedEmail);
                      }}
                    >
                      <Input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Email used at checkout"
                        className="flex-1 text-left"
                      />
                      <Button type="submit" disabled={orderQuery.isFetching}>
                        {orderQuery.isFetching ? "Checking..." : "Get downloads"}
                      </Button>
                    </form>
                  ) : null}
                  {proofEmail && !orderQuery.isFetching ? (
                    <p
                      role="status"
                      className="mt-3 text-sm text-fg-muted"
                    >
                      This email didn&rsquo;t match the order. Check the email
                      address used at checkout and try again.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {orderQuery.data.status === "PAID" && orderQuery.data.authorized ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-2xl bg-fg text-surface">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="size-5"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-fg">
                        Your downloads
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {orderQuery.data.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-border bg-card p-6 transition hover:shadow-lg"
                      >
                        {item.downloads.length === 0 ? (
                          <div>
                            <div className="flex items-start gap-4">
                              {item.coverImage ? (
                                <img
                                  src={item.coverImage}
                                  alt={item.productName}
                                  className="h-20 w-14 shrink-0 rounded-lg border border-border object-cover bg-surface-muted sm:h-24 sm:w-16"
                                />
                              ) : (
                                <div className="grid h-20 w-14 shrink-0 place-items-center rounded-lg border border-border bg-surface-muted text-lg sm:h-24 sm:w-16">
                                  📄
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-base font-semibold text-fg break-words">
                                  {item.productName}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4">
                              {item.hasFiles ? (
                                <div className="flex items-center gap-2 rounded-2xl bg-surface-muted px-4 py-3 text-sm text-fg-muted">
                                  <Spinner /> Preparing your download link...
                                </div>
                              ) : (
                                <div className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-fg-muted">
                                  No file is attached to this item yet. Please
                                  contact support and we will sort it out.
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {item.downloads.map((download) => {
                              const state = downloadState[download.token] ?? "idle";
                              const isLoading = state === "loading";
                              const isDone = state === "done";
                              const disabled = isLoading || isDone;
                              const statusText = isLoading
                                ? "Preparing..."
                                : isDone
                                  ? "Downloaded"
                                  : "Click to download";
                              return (
                                <button
                                  key={download.token}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() =>
                                    handleDownload(
                                      download.token,
                                      `${apiUrl()}${download.url}`,
                                    )
                                  }
                                  className={`group w-full rounded-2xl border p-4 text-left transition ${
                                    disabled
                                      ? "cursor-not-allowed border-border bg-surface-muted/70"
                                      : "cursor-pointer border-border bg-surface-muted hover:border-fg/20 hover:bg-card"
                                  } ${isDone ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30" : ""}`}
                                >
                                  <div className="flex items-start gap-4">
                                    {item.coverImage ? (
                                      <img
                                        src={item.coverImage}
                                        alt={item.productName}
                                        className="h-20 w-14 shrink-0 rounded-lg border border-border object-cover bg-surface-muted sm:h-24 sm:w-16"
                                      />
                                    ) : (
                                      <div className="grid h-20 w-14 shrink-0 place-items-center rounded-lg border border-border bg-surface-muted text-lg sm:h-24 sm:w-16">
                                        📄
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-base font-semibold text-fg break-words">
                                        {item.productName}
                                      </p>
                                      <div
                                        className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                                          isDone
                                            ? "bg-emerald-600 text-white"
                                            : isLoading
                                              ? "bg-fg/10 text-fg"
                                              : "bg-fg text-surface"
                                        }`}
                                      >
                                        {isLoading ? (
                                          <Spinner className="size-3.5" />
                                        ) : isDone ? (
                                          <span aria-hidden>✓</span>
                                        ) : (
                                          <span aria-hidden>↓</span>
                                        )}
                                        <span>{statusText}</span>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface">
          <Spinner />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

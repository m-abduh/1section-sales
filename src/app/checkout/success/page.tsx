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
  const [downloadState, setDownloadState] = useState<Record<string, DownloadState>>(
    {},
  );

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
    <>
      <SitePageHero
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
        <section className="w-full border-b border-dashed border-fg/30">
          <div className="mx-auto w-full max-w-6xl border-x border-dashed border-fg/30 px-4 py-10 sm:px-6 sm:py-12">
            {!orderRef ? (
              <div className="rounded-2xl border border-fg/30 bg-card p-6 sm:p-8">
                <p className="text-sm font-medium text-fg sm:text-base">
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
              <div className="flex items-center gap-3 rounded-2xl border border-fg/30 bg-card p-6 text-sm text-fg-muted sm:p-8">
                <Spinner /> Loading your purchase...
              </div>
            ) : null}

            {orderRef && orderQuery.isError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {getApiErrorMessage(orderQuery.error)}
              </div>
            ) : null}

            {orderQuery.data ? (
              <div className="space-y-5">
                {/* Order summary card */}
                <div className="rounded-2xl border border-fg/30 bg-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                        {orderQuery.data.orderNumber.startsWith("txn_")
                          ? "Transaction"
                          : "Order"}
                      </p>
                      <p className="mt-1 text-xl font-bold tracking-tight text-fg break-all">
                        {orderQuery.data.orderNumber}
                      </p>
                      {orderQuery.data.total > 0 || orderQuery.data.paidAt ? (
                        <p className="mt-1 text-sm text-fg-muted">
                          {formatCurrency(
                            orderQuery.data.total,
                            orderQuery.data.currency,
                          )}{" "}
                          · {formatDate(orderQuery.data.paidAt ?? new Date())}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge status={orderQuery.data.status} />
                  </div>
                </div>

                {orderQuery.data.status === "PENDING" ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-fg/30 bg-surface-muted/40 p-5 text-sm text-fg sm:p-6">
                    <Spinner /> Waiting for payment confirmation from Paddle...
                  </div>
                ) : null}

                {orderQuery.data.status === "PAID" && !orderQuery.data.authorized ? (
                  <div className="rounded-2xl border border-fg/30 bg-card p-6 text-center sm:p-8">
                    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-muted text-2xl">
                      ✉
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-fg">
                      Access your purchase
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-fg-muted">
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
                      <p role="status" className="mt-3 text-sm text-fg-muted">
                        This email didn&rsquo;t match the order. Check the email
                        address used at checkout and try again.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {orderQuery.data.status === "PAID" && orderQuery.data.authorized ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                      <div className="grid size-9 place-items-center rounded-xl bg-fg text-surface">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="size-4"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-fg">
                        Your downloads
                      </h2>
                    </div>

                    <div className="grid gap-4">
                      {orderQuery.data.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-fg/30 bg-card p-5 sm:p-6"
                        >
                          {item.downloads.length === 0 ? (
                            <div>
                              <div className="flex items-start gap-4">
                                {item.coverImage ? (
                                  <img
                                    src={item.coverImage}
                                    alt={item.productName}
                                    className="h-24 w-16 shrink-0 rounded-lg border border-fg/20 object-cover bg-surface-muted sm:h-28 sm:w-20"
                                  />
                                ) : (
                                  <div className="grid h-24 w-16 shrink-0 place-items-center rounded-lg border border-fg/20 bg-surface-muted text-lg sm:h-28 sm:w-20">
                                    📄
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-base font-semibold text-fg break-words sm:text-lg">
                                    {item.productName}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4">
                                {item.hasFiles ? (
                                  <div className="flex items-center gap-2 rounded-xl border border-fg/20 bg-surface-muted/40 px-4 py-3 text-sm text-fg-muted">
                                    <Spinner /> Preparing your download link...
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-fg/20 bg-surface-muted/40 px-4 py-3 text-sm text-fg-muted">
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
                                    ? "Enjoy your reading!"
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
                                    className={`group w-full rounded-xl border p-4 text-left transition sm:p-5 ${
                                      disabled
                                        ? "cursor-not-allowed border-fg/20 bg-surface-muted/40"
                                        : "cursor-pointer border-fg/20 bg-surface hover:border-fg/40 hover:bg-surface-muted/30"
                                    } ${isDone ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30" : ""}`}
                                  >
                                    <div className="flex items-start gap-4">
                                      {isDone ? (
                                        <div className="grid h-24 w-16 shrink-0 place-items-center rounded-lg border border-emerald-200 bg-emerald-600 text-2xl text-white sm:h-28 sm:w-20">
                                          ✓
                                        </div>
                                      ) : item.coverImage ? (
                                        <img
                                          src={item.coverImage}
                                          alt={item.productName}
                                          className="h-24 w-16 shrink-0 rounded-lg border border-fg/20 object-cover bg-surface-muted sm:h-28 sm:w-20"
                                        />
                                      ) : (
                                        <div className="grid h-24 w-16 shrink-0 place-items-center rounded-lg border border-fg/20 bg-surface-muted text-lg sm:h-28 sm:w-20">
                                          📄
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-base font-semibold text-fg break-words sm:text-lg">
                                          {isDone ? "Enjoy your reading!" : item.productName}
                                        </p>
                                        {isDone ? (
                                          <p className="mt-1 text-sm text-fg-muted break-words">
                                            {item.productName}
                                          </p>
                                        ) : null}
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
        </section>
      </main>
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-20">
          <Spinner />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

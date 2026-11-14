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
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-4 py-2 text-sm font-medium text-slate-600 backdrop-blur-xl transition hover:bg-white/80 hover:text-slate-900 dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 dark:text-[#cbc3d7] dark:hover:bg-[#292a2f]/60 dark:hover:text-[#e3e1e9]"
          >
            ← Back to home
          </Link>
        </div>
      </SitePageHero>

      <main className="flex-1">
        <section className="px-3 pb-2 pt-6 sm:px-4 sm:pt-8">
          <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5">
            {!orderRef ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white/60 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 rounded-[2rem] p-6 sm:p-8">
                <p className="text-sm font-medium text-slate-900 dark:text-[#e3e1e9] sm:text-base">
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
              <div className="rounded-3xl border border-slate-200/80 bg-white/60 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 flex items-center gap-3 rounded-[2rem] p-6 text-sm text-slate-600 dark:text-[#cbc3d7] sm:p-8">
                <Spinner /> Loading your purchase...
              </div>
            ) : null}

            {orderRef && orderQuery.isError ? (
              <div className="rounded-[2rem] border border-red-200/70 bg-red-50/70 p-6 text-sm text-red-700 backdrop-blur-xl dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {getApiErrorMessage(orderQuery.error)}
              </div>
            ) : null}

            {orderQuery.data ? (
              <div className="space-y-4 sm:space-y-5">
                <div className="rounded-3xl border border-slate-200/80 bg-white/60 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 rounded-[2rem] p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-[#cbc3d7]">
                        {orderQuery.data.orderNumber.startsWith("txn_")
                          ? "Transaction"
                          : "Order"}
                      </p>
                      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-[#e3e1e9] break-all sm:text-2xl">
                        {orderQuery.data.orderNumber}
                      </p>
                      {orderQuery.data.total > 0 || orderQuery.data.paidAt ? (
                        <p className="mt-1 text-sm text-slate-600 dark:text-[#cbc3d7]">
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
                  <div className="rounded-2xl border border-slate-200/80 bg-white/50 backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 flex items-center gap-3 rounded-[2rem] p-5 text-sm text-slate-900 dark:text-[#e3e1e9] sm:p-6">
                    <Spinner /> Waiting for payment confirmation from Paddle...
                  </div>
                ) : null}

                {orderQuery.data.status === "PAID" && !orderQuery.data.authorized ? (
                  <div className="rounded-3xl border border-slate-200/80 bg-white/60 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 rounded-[2rem] p-6 text-center sm:p-8">
                    <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100/70 dark:bg-[#34343a] text-2xl shadow-inner">
                      ✉
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-[#e3e1e9] sm:text-xl">
                      Access your purchase
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-[#cbc3d7]">
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
                      <p role="status" className="mt-3 text-sm text-slate-600 dark:text-[#cbc3d7]">
                        This email didn&rsquo;t match the order. Check the email
                        address used at checkout and try again.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {orderQuery.data.status === "PAID" && orderQuery.data.authorized ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                      <div className="grid size-10 place-items-center rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-[#0d0e13] shadow-lg shadow-slate-900/20 dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]">
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
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-[#e3e1e9] sm:text-xl">
                        Your downloads
                      </h2>
                    </div>

                    <div className="grid gap-4">
                      {orderQuery.data.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-3xl border border-slate-200/80 bg-white/60 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 rounded-[2rem] p-5 sm:p-6"
                        >
                          {item.downloads.length === 0 ? (
                            <div>
                              <div className="flex items-start gap-4">
                                {item.coverImage ? (
                                  <img
                                    src={item.coverImage}
                                    alt={item.productName}
                                    className="h-24 w-16 shrink-0 rounded-xl border border-slate-200/70 dark:border-[#34343a]/40 object-cover bg-slate-100 dark:bg-[#34343a] shadow-sm sm:h-28 sm:w-20 dark:border-[#34343a]/40"
                                  />
                                ) : (
                                  <div className="grid h-24 w-16 shrink-0 place-items-center rounded-xl border border-slate-200/70 dark:border-[#34343a]/40 bg-slate-100 dark:bg-[#34343a] text-lg sm:h-28 sm:w-20 dark:border-[#34343a]/40">
                                    📄
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-base font-semibold text-slate-900 dark:text-[#e3e1e9] break-words sm:text-lg">
                                    {item.productName}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4">
                                {item.hasFiles ? (
                                  <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-[#34343a]/40 bg-slate-100/50 dark:bg-[#292a2f]/40 px-4 py-3 text-sm text-slate-600 dark:text-[#cbc3d7] dark:border-[#34343a]/40">
                                    <Spinner /> Preparing your download link...
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-slate-200/80 dark:border-[#34343a]/40 bg-slate-100/50 dark:bg-[#292a2f]/40 px-4 py-3 text-sm text-slate-600 dark:text-[#cbc3d7] dark:border-[#34343a]/40">
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
                                    className={`group w-full rounded-2xl border p-4 text-left transition sm:p-5 ${
                                      disabled
                                        ? "cursor-not-allowed border-slate-200/70 dark:border-[#34343a]/40 bg-slate-100/50 dark:bg-[#292a2f]/40 dark:border-[#34343a]/40"
                                        : "rounded-2xl border border-slate-200/80 bg-white/50 backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
                                    } ${isDone ? "border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/30" : ""}`}
                                  >
                                    <div className="flex items-start gap-4">
                                      {isDone ? (
                                        <div className="grid h-24 w-16 shrink-0 place-items-center rounded-xl border border-emerald-200 bg-emerald-500 text-2xl text-white shadow-sm sm:h-28 sm:w-20">
                                          ✓
                                        </div>
                                      ) : item.coverImage ? (
                                        <img
                                          src={item.coverImage}
                                          alt={item.productName}
                                          className="h-24 w-16 shrink-0 rounded-xl border border-slate-200/70 dark:border-[#34343a]/40 object-cover bg-slate-100 dark:bg-[#34343a] shadow-sm sm:h-28 sm:w-20 dark:border-[#34343a]/40"
                                        />
                                      ) : (
                                        <div className="grid h-24 w-16 shrink-0 place-items-center rounded-xl border border-slate-200/70 dark:border-[#34343a]/40 bg-slate-100 dark:bg-[#34343a] text-lg sm:h-28 sm:w-20 dark:border-[#34343a]/40">
                                          📄
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-base font-semibold text-slate-900 dark:text-[#e3e1e9] break-words sm:text-lg">
                                          {isDone ? "Enjoy your reading!" : item.productName}
                                        </p>
                                        {isDone ? (
                                          <p className="mt-1 text-sm text-slate-600 dark:text-[#cbc3d7] break-words">
                                            {item.productName}
                                          </p>
                                        ) : null}
                                        <div
                                          className={`mt-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium shadow-sm ${
                                            isDone
                                              ? "bg-emerald-500 text-white"
                                              : isLoading
                                                ? "bg-fg/10 text-slate-900 dark:text-[#e3e1e9]"
                                                : "bg-slate-900 dark:bg-white text-white dark:text-[#0d0e13]"
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

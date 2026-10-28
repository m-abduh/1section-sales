"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { apiUrl } from "@/lib/site";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  LAST_ACCESS_KEY,
  LAST_ORDER_KEY,
  type StoredCheckoutAccess,
} from "@/hooks/use-checkout";
import type { PublicOrder } from "@/lib/types";
import { StatusBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function startDownload(url: string) {
  // Trigger the download from a hidden iframe so the file is saved instead of
  // being opened in a tab, and the underlying link is never exposed.
  const frame = document.createElement("iframe");
  frame.style.display = "none";
  frame.src = url;
  document.body.appendChild(frame);
  window.setTimeout(() => frame.remove(), 60_000);
}

function getStoredCheckoutAccess(): StoredCheckoutAccess | null {
  try {
    const raw = window.localStorage.getItem(LAST_ACCESS_KEY);
    if (!raw) return null;

    const stored: unknown = JSON.parse(raw);
    if (
      typeof stored === "object" &&
      stored !== null &&
      "orderNumber" in stored &&
      typeof stored.orderNumber === "string" &&
      "transactionId" in stored &&
      typeof stored.transactionId === "string" &&
      "accessToken" in stored &&
      typeof stored.accessToken === "string"
    ) {
      return {
        orderNumber: stored.orderNumber,
        transactionId: stored.transactionId,
        accessToken: stored.accessToken,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    const fromQuery = searchParams.get("order");
    const txn = searchParams.get("_ptxn") ?? searchParams.get("txn");
    const access = searchParams.get("access");
    const storedAccess = getStoredCheckoutAccess();
    const ref = fromQuery || txn;
    if (ref) {
      setOrderNumber(ref);
      setAccessToken(
        access ||
          (storedAccess &&
          (storedAccess.orderNumber === ref ||
            storedAccess.transactionId === ref)
            ? storedAccess.accessToken
            : null),
      );
      return;
    }
    const stored = window.localStorage.getItem(LAST_ORDER_KEY);
    if (stored) {
      setOrderNumber(stored);
      setAccessToken(
        access ||
          (storedAccess?.orderNumber === stored
            ? storedAccess.accessToken
            : null),
      );
    }
  }, [searchParams]);

  const orderQuery = useQuery({
    queryKey: ["order-status", orderNumber, accessToken],
    enabled: Boolean(orderNumber),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (accessToken) params.access = accessToken;
      const response = await api.get<{ data: PublicOrder }>(
        `/orders/${orderNumber}/status`,
        { params },
      );
      return response.data.data;
    },
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 3000 : false,
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="relative overflow-hidden border-b border-border">
        <div className="cinema-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="cinema-spotlight pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted transition hover:text-fg"
          >
            ← Back to home
          </Link>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
              Purchase
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gradient sm:text-4xl">
              Your downloads
            </h1>
            <p className="mt-2 max-w-xl text-sm text-fg-muted">
              Enter your Paddle transaction ID or order number below to access
              your purchase.
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          {!orderNumber ? (
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
                  if (ref) {
                    const storedAccess = getStoredCheckoutAccess();
                    setOrderNumber(ref);
                    setAccessToken(
                      storedAccess &&
                        (storedAccess.orderNumber === ref ||
                          storedAccess.transactionId === ref)
                        ? storedAccess.accessToken
                        : null,
                    );
                  }
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

          {orderNumber && orderQuery.isLoading ? (
            <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-8 text-sm text-fg-muted">
              <Spinner /> Loading your purchase...
            </div>
          ) : null}

          {orderNumber && orderQuery.isError ? (
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
                      Order
                    </p>
                    <p className="mt-1 text-xl font-bold tracking-tight text-fg">
                      {orderQuery.data.orderNumber}
                    </p>
                    <p className="mt-1 text-xs text-fg-muted">
                      {formatCurrency(orderQuery.data.total, orderQuery.data.currency)}{" "}
                      · {formatDate(orderQuery.data.paidAt ?? new Date())}
                    </p>
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
                    Your payment is confirmed. Open the access link from your
                    checkout to view your downloads. If you need help, contact
                    support with your order number.
                  </p>
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
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-fg">
                              {item.productName}
                            </p>
                            <p className="mt-1 text-xs text-fg-muted">
                              {item.downloads.length === 0
                                ? item.hasFiles
                                  ? "Preparing your download link..."
                                  : "No file attached yet"
                                : `${item.downloads.length} file${item.downloads.length === 1 ? "" : "s"} available`}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {item.downloads.length === 0 ? (
                            item.hasFiles ? (
                              <div className="flex items-center gap-2 rounded-2xl bg-surface-muted px-4 py-3 text-sm text-fg-muted">
                                <Spinner /> Preparing your download link...
                              </div>
                            ) : (
                              <div className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-fg-muted">
                                No file is attached to this item yet. Please
                                contact support and we will sort it out.
                              </div>
                            )
                          ) : (
                            item.downloads.map((download) => (
                              <button
                                key={download.token}
                                type="button"
                                onClick={() =>
                                  startDownload(`${apiUrl()}${download.url}`)
                                }
                                className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-surface-muted px-4 py-3 text-left text-sm font-medium text-fg transition hover:border-fg/20 hover:bg-card"
                              >
                                <span className="flex min-w-0 items-center gap-3">
                                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fg text-xs font-bold text-surface">
                                    ↓
                                  </span>
                                  <span className="truncate">{download.label}</span>
                                </span>
                                <span className="shrink-0 text-xs text-fg-muted">
                                  {download.remaining} left
                                </span>
                              </button>
                            ))
                          )}
                        </div>
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

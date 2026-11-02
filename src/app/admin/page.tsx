"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAdminStats } from "@/hooks/use-admin-orders";
import { StatCard } from "@/components/admin/stat-card";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatRelative } from "@/lib/format";
import { Spinner } from "@/components/ui/spinner";

const icons = {
  revenue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 0 0 7H6" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  paid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  pending: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  failed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  ),
  aov: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
    </svg>
  ),
  conversion: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  niches: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  ),
  files: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  chats: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
};

function Panel({
  title,
  meta,
  action,
  children,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {meta ? <p className="mt-0.5 text-xs text-fg-muted">{meta}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="mt-1 text-xl font-semibold leading-none tracking-tight tabular-nums text-fg">
        {value}
      </dd>
      {hint ? <p className="mt-1.5 text-[11px] text-fg-muted">{hint}</p> : null}
    </div>
  );
}

export default function AdminDashboardPage() {
  const stats = useAdminStats();

  const data = stats.data;
  const totalOrders = data?.orders ?? 0;
  const paidPct = totalOrders ? (data!.paidOrders / totalOrders) * 100 : 0;
  const pendingPct = totalOrders ? (data!.pendingOrders / totalOrders) * 100 : 0;
  const failedPct = totalOrders ? (data!.failedOrders / totalOrders) * 100 : 0;
  const catalogHealth =
    data && data.products > 0
      ? Math.round(
          ((data.products - data.productsWithoutFiles) / data.products) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Live snapshot of your store, catalog, and revenue."
        actions={
          <>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
            >
              <span aria-hidden>+</span> New product
            </Link>
            <Link
              href="/admin/niches"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-fg transition hover:bg-surface-muted"
            >
              Manage niches
            </Link>
            <Link
              href="/admin/orders"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-fg transition hover:bg-surface-muted"
            >
              View orders
            </Link>
            <Link
              href="/admin/chats"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-fg transition hover:bg-surface-muted"
            >
              View chats
            </Link>
          </>
        }
      />

      {stats.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading stats...
        </div>
      ) : null}

      {data ? (
        <>
          {/* Headline metrics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total revenue"
              value={formatCurrency(data.revenue)}
              hint="All paid orders"
              icon={icons.revenue}
              tone="accent"
            />
            <StatCard
              label="Last 7 days"
              value={formatCurrency(data.revenueLast7Days)}
              hint="Paid orders"
              icon={icons.revenue}
            />
            <StatCard
              label="Avg. order value"
              value={formatCurrency(data.averageOrderValue)}
              hint="Per paid order"
              icon={icons.aov}
            />
            <StatCard
              label="Conversion"
              value={`${data.conversionRate}%`}
              hint="Paid / total orders"
              icon={icons.conversion}
            />
          </div>

          {/* Breakdown panels */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Orders" meta="All statuses">
              <div className="px-5 py-5">
                <dl className="grid grid-cols-2 gap-x-5 gap-y-5">
                  <Metric label="Total orders" value={data.orders} hint="All statuses" />
                  <Metric label="Paid" value={data.paidOrders} hint="Completed" />
                  <Metric label="Pending" value={data.pendingOrders} hint="Awaiting payment" />
                  <Metric label="Failed" value={data.failedOrders} hint="Payment failed" />
                </dl>

                <div
                  className="mt-5 flex h-2 overflow-hidden rounded-full bg-surface-muted"
                  role="img"
                  aria-label="Order status distribution"
                >
                  <div className="h-full bg-emerald-500" style={{ width: `${paidPct}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${pendingPct}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${failedPct}%` }} />
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" /> Paid
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-400" /> Pending
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-red-500" /> Failed
                  </span>
                </div>
              </div>
            </Panel>

            <Panel
              title="Catalog"
              meta={`${data.activeNiches} of ${data.niches} niches active`}
              action={
                <Link
                  href="/admin/products"
                  className="text-xs font-medium text-fg-muted transition hover:text-fg"
                >
                  Manage
                </Link>
              }
            >
              <div className="px-5 py-5">
                <dl className="grid grid-cols-2 gap-x-5 gap-y-5">
                  <Metric
                    label="Niches"
                    value={`${data.activeNiches} / ${data.niches}`}
                    hint="active / total"
                  />
                  <Metric label="Products" value={data.products} hint="Total guides" />
                  <Metric
                    label="Without files"
                    value={data.productsWithoutFiles}
                    hint="Need PDF upload"
                  />
                  <Metric
                    label="Catalog health"
                    value={data.products > 0 ? `${catalogHealth}%` : "—"}
                    hint="products with files"
                  />
                </dl>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${
                      catalogHealth >= 100 ? "bg-emerald-500" : "bg-fg"
                    }`}
                    style={{ width: `${catalogHealth}%` }}
                  />
                </div>
                <p className="mt-2.5 text-[11px] text-fg-muted">
                  {data.productsWithoutFiles > 0
                    ? `${data.productsWithoutFiles} guide${data.productsWithoutFiles === 1 ? "" : "s"} still need a PDF.`
                    : "Every guide has a downloadable file."}
                </p>
              </div>
            </Panel>

            <Panel
              title="Assistant"
              meta="On-site chat"
              action={
                <Link
                  href="/admin/chats"
                  className="text-xs font-medium text-fg-muted transition hover:text-fg"
                >
                  Open
                </Link>
              }
            >
              <div className="px-5 py-5">
                <dl className="grid grid-cols-2 gap-x-5 gap-y-5">
                  <Metric
                    label="Conversations"
                    value={data.chatSessions}
                    hint="With at least one message"
                  />
                  <Metric
                    label="Last 7 days"
                    value={data.chatSessionsLast7Days}
                    hint="New conversations"
                  />
                  <Metric label="Messages" value={data.chatMessages} hint="Visitor + assistant" />
                  <Metric
                    label="Avg. per chat"
                    value={data.chatAverageMessages}
                    hint="Messages per conversation"
                  />
                </dl>
              </div>
            </Panel>
          </div>

          {/* Top products + recent orders */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Top products"
              meta="By units sold"
              action={
                <Link
                  href="/admin/products"
                  className="text-xs font-medium text-fg-muted transition hover:text-fg"
                >
                  View catalog
                </Link>
              }
            >
              {data.topProducts.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-fg-muted">
                  No sales yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.topProducts.map((product, index) => {
                    const maxUnits = data.topProducts[0].units || 1;
                    const width = Math.max(6, (product.units / maxUnits) * 100);
                    return (
                      <li key={product.productId} className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-muted text-[11px] font-semibold text-fg-muted">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-fg">
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-fg-muted">
                              {product.niche ?? "—"} · {formatCurrency(product.revenue)}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-fg">
                            {product.units}
                          </span>
                        </div>
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                          <div
                            className="h-full rounded-full bg-fg/80"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel
              title="Recent orders"
              meta="Latest activity"
              action={
                <Link
                  href="/admin/orders"
                  className="text-xs font-medium text-fg-muted transition hover:text-fg"
                >
                  View all
                </Link>
              }
            >
              {data.recentOrders.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-fg-muted">
                  No orders yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentOrders.map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center gap-3 px-5 py-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">
                          {order.orderNumber}
                        </p>
                        <p className="truncate text-xs text-fg-muted">
                          {order.email ?? "no email"} · {formatRelative(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <span className="text-sm font-medium tabular-nums text-fg">
                          {formatCurrency(order.total, order.currency)}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
}

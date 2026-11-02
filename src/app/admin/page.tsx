"use client";

import Link from "next/link";
import { useAdminStats } from "@/hooks/use-admin-orders";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatRelative } from "@/lib/format";
import { Spinner } from "@/components/ui/spinner";

const icons = {
  revenue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 0 0 7H6" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  paid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  pending: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  failed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  ),
  aov: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
    </svg>
  ),
  conversion: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  niches: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  ),
  files: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  chats: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
};

export default function AdminDashboardPage() {
  const stats = useAdminStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="cinema-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="cinema-spotlight pointer-events-none absolute inset-0" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
              Overview
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-fg">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              Live snapshot of your store, catalog, and revenue.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/products"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition hover:opacity-90"
            >
              + New product
            </Link>
            <Link
              href="/admin/niches"
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-muted"
            >
              Manage niches
            </Link>
            <Link
              href="/admin/orders"
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-muted"
            >
              View orders
            </Link>
            <Link
              href="/admin/chats"
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-muted"
            >
              View chats
            </Link>
          </div>
        </div>
      </div>

      {stats.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading stats...
        </div>
      ) : null}

      {stats.data ? (
        <>
          {/* Revenue row */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
              Revenue
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total revenue"
                value={formatCurrency(stats.data.revenue)}
                hint="All paid orders"
                icon={icons.revenue}
                tone="accent"
              />
              <StatCard
                label="Last 7 days"
                value={formatCurrency(stats.data.revenueLast7Days)}
                hint="Paid orders"
                icon={icons.revenue}
              />
              <StatCard
                label="Avg. order value"
                value={formatCurrency(stats.data.averageOrderValue)}
                hint="Per paid order"
                icon={icons.aov}
              />
              <StatCard
                label="Conversion"
                value={`${stats.data.conversionRate}%`}
                hint="Paid / total orders"
                icon={icons.conversion}
              />
            </div>
          </div>

          {/* Orders row */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
              Orders
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total orders"
                value={stats.data.orders}
                hint="All statuses"
                icon={icons.orders}
              />
              <StatCard
                label="Paid"
                value={stats.data.paidOrders}
                hint="Completed"
                icon={icons.paid}
                tone="success"
              />
              <StatCard
                label="Pending"
                value={stats.data.pendingOrders}
                hint="Awaiting payment"
                icon={icons.pending}
                tone="warning"
              />
              <StatCard
                label="Failed"
                value={stats.data.failedOrders}
                hint="Payment failed"
                icon={icons.failed}
                tone="danger"
              />
            </div>
          </div>

          {/* Catalog row */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
              Catalog
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Niches"
                value={`${stats.data.activeNiches} / ${stats.data.niches}`}
                hint="active / total"
                icon={icons.niches}
              />
              <StatCard
                label="Products"
                value={stats.data.products}
                hint="Total guides"
                icon={icons.products}
              />
              <StatCard
                label="Without files"
                value={stats.data.productsWithoutFiles}
                hint="Need PDF upload"
                icon={icons.files}
                tone={stats.data.productsWithoutFiles > 0 ? "warning" : "default"}
              />
              <StatCard
                label="Catalog health"
                value={
                  stats.data.products > 0
                    ? `${Math.round(
                        ((stats.data.products - stats.data.productsWithoutFiles) /
                          stats.data.products) *
                          100,
                      )}%`
                    : "—"
                }
                hint="products with files"
                icon={icons.files}
              />
            </div>
          </div>

          {/* Assistant row */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
              Assistant
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Conversations"
                value={stats.data.chatSessions}
                hint="With at least one message"
                icon={icons.chats}
                tone="accent"
              />
              <StatCard
                label="Last 7 days"
                value={stats.data.chatSessionsLast7Days}
                hint="New conversations"
                icon={icons.chats}
              />
              <StatCard
                label="Messages"
                value={stats.data.chatMessages}
                hint="Visitor + assistant"
                icon={icons.chats}
              />
              <StatCard
                label="Avg. per chat"
                value={stats.data.chatAverageMessages}
                hint="Messages per conversation"
                icon={icons.chats}
              />
            </div>
          </div>

          {/* Top products + recent orders */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top products */}
            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-fg">Top products</h2>
                <span className="text-xs text-fg-muted">by units sold</span>
              </div>
              {stats.data.topProducts.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-fg-muted">
                  No sales yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {stats.data.topProducts.map((p, i) => {
                    const maxUnits = stats.data!.topProducts[0].units || 1;
                    const width = Math.max(8, (p.units / maxUnits) * 100);
                    return (
                      <li key={p.productId} className="px-5 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-fg">
                              {i + 1}. {p.name}
                            </p>
                            <p className="text-xs text-fg-muted">
                              {p.niche ?? "—"} · {formatCurrency(p.revenue)}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-fg">
                            {p.units}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                          <div
                            className="h-full rounded-full bg-fg"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Recent orders */}
            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-fg">Recent orders</h2>
                <Link
                  href="/admin/orders"
                  className="text-sm font-medium text-fg hover:opacity-70"
                >
                  View all
                </Link>
              </div>
              {stats.data.recentOrders.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-fg-muted">
                  No orders yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {stats.data.recentOrders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-fg">
                          {order.orderNumber}
                        </p>
                        <p className="truncate text-xs text-fg-muted">
                          {order.email ?? "no email"} · {formatRelative(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-medium text-fg">
                          {formatCurrency(order.total, order.currency)}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

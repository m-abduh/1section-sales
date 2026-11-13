"use client";

import { useState } from "react";
import type { AdminDownloadStats, AdminOrder, OrderStatus } from "@/lib/types";
import { useAdminOrders } from "@/hooks/use-admin-orders";
import { formatCurrency, formatDate } from "@/lib/format";
import { Modal } from "@/components/admin/modal";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const statusOptions: (OrderStatus | "")[] = [
  "",
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELED",
  "REFUNDED",
];

const statusLabels: Record<string, string> = {
  "": "All statuses",
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  CANCELED: "Canceled",
  REFUNDED: "Refunded",
};

function getDownloadLabel(order: AdminOrder): string {
  if (order.status !== "PAID") return "-";
  const stats: AdminDownloadStats | undefined = order.downloadStats;
  if (!stats || stats.tokenCount === 0) return "No files";
  return stats.downloaded ? "Downloaded" : "Not downloaded";
}

function getDownloadClass(order: AdminOrder): string {
  if (order.status !== "PAID") return "text-fg-muted";
  const stats = order.downloadStats;
  if (!stats || stats.tokenCount === 0) return "text-fg-muted";
  return stats.downloaded
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-amber-600 dark:text-amber-400";
}

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const orders = useAdminOrders({
    page,
    pageSize: 20,
    status: status || undefined,
    search: search || undefined,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Sales"
        title="Orders"
        description="One-time purchases made via Paddle."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <select
          className="rounded-lg border-0 bg-surface-muted px-3 py-2 text-sm text-fg ring-1 ring-inset ring-border focus:ring-2 focus:ring-accent"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as OrderStatus | "");
            setPage(1);
          }}
        >
          {statusOptions.map((option) => (
            <option key={option || "all"} value={option}>
              {statusLabels[option]}
            </option>
          ))}
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
            placeholder="Search order number or email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {orders.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading orders...
        </div>
      ) : null}

      {orders.data && orders.data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface-muted text-2xl">
            ▤
          </span>
          <p className="mt-4 text-sm font-medium text-fg">No orders found</p>
          <p className="mt-1 text-xs text-fg-muted">
            {search || status
              ? "Try adjusting your filters."
              : "Orders will appear here after the first purchase."}
          </p>
        </div>
      ) : null}

      {orders.data && orders.data.items.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface-muted/60 text-[11px] uppercase tracking-[0.12em] text-fg-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Download</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.data.items.map((order) => (
                  <tr key={order.id} className="transition hover:bg-surface-muted/50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-fg">{order.orderNumber}</p>
                      <p className="text-xs text-fg-muted">
                        {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-fg-muted">
                      {order.email ?? "-"}
                    </td>
                    <td className="px-5 py-4 font-medium text-fg">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className={`px-5 py-4 text-sm font-medium ${getDownloadClass(order)}`}>
                      {getDownloadLabel(order)}
                    </td>
                    <td className="px-5 py-4 text-fg-muted">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelected(order)}
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
              Page {orders.data.pagination.page} of{" "}
              {orders.data.pagination.totalPages} · {orders.data.pagination.total} orders
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
                disabled={page >= orders.data.pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <Modal
        open={Boolean(selected)}
        title={selected ? `Order ${selected.orderNumber}` : ""}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface-muted p-3">
                <p className="text-xs uppercase tracking-wide text-fg-muted">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <div className="rounded-xl bg-surface-muted p-3">
                <p className="text-xs uppercase tracking-wide text-fg-muted">Total</p>
                <p className="mt-1 font-medium text-fg">
                  {formatCurrency(selected.total, selected.currency)}
                </p>
              </div>
              <div className="rounded-xl bg-surface-muted p-3">
                <p className="text-xs uppercase tracking-wide text-fg-muted">Email</p>
                <p className="mt-1 break-all text-fg">{selected.email ?? "-"}</p>
              </div>
              <div className="rounded-xl bg-surface-muted p-3">
                <p className="text-xs uppercase tracking-wide text-fg-muted">Paid at</p>
                <p className="mt-1 text-fg">{formatDate(selected.paidAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-fg-muted">Download</p>
              <div className="mt-2 rounded-xl bg-surface-muted p-3 text-sm">
                {selected.status !== "PAID" ? (
                  <span className="text-fg-muted">-</span>
                ) : !selected.downloadStats || selected.downloadStats.tokenCount === 0 ? (
                  <span className="text-fg-muted">No files/tokens for this order</span>
                ) : selected.downloadStats.downloaded ? (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Downloaded
                  </span>
                ) : (
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    Not downloaded yet
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-fg-muted">Items</p>
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl ring-1 ring-border">
                {selected.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="text-fg">
                        {item.productName} × {item.quantity}
                      </p>
                      {selected.status === "PAID" && item.downloadStats ? (
                        <p className="text-xs text-fg-muted">
                          {item.downloadStats.tokenCount === 0
                            ? "No files"
                            : item.downloadStats.downloaded
                              ? "Downloaded"
                              : "Not downloaded"}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-fg-muted">
                      {formatCurrency(item.unitAmount * item.quantity, selected.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

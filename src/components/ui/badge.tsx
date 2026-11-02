import type { OrderStatus } from "@/lib/types";

const statusClasses: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400",
  PAID: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400",
  FAILED: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-400",
  CANCELED: "bg-surface-muted text-fg-muted ring-border",
  PARTIALLY_REFUNDED: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-400",
  REFUNDED: "bg-surface-muted text-fg ring-border",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusClasses[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "neutral" | "success";
}) {
  const tones = {
    brand: "bg-fg text-surface ring-fg",
    neutral: "bg-surface-muted text-fg-muted ring-border",
    success:
      "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

import type { ReactNode } from "react";

const tones = {
  default: {
    icon: "bg-surface-muted text-fg-muted",
    value: "text-fg",
  },
  accent: {
    icon: "bg-fg text-surface",
    value: "text-fg",
  },
  success: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    value: "text-fg",
  },
  warning: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    value: "text-fg",
  },
  danger: {
    icon: "bg-red-500/10 text-red-600 dark:text-red-400",
    value: "text-fg",
  },
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: keyof typeof tones;
  trend?: { value: string; positive?: boolean };
}) {
  const t = tones[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-fg-muted">{label}</p>
          <p
            className={`mt-2 text-[26px] font-semibold leading-none tracking-tight tabular-nums ${t.value}`}
          >
            {value}
          </p>
          {hint ? <p className="mt-2 text-xs text-fg-muted">{hint}</p> : null}
          {trend ? (
            <p
              className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                trend.positive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-fg-muted"
              }`}
            >
              <span aria-hidden>{trend.positive ? "▲" : "▼"}</span>
              {trend.value}
            </p>
          ) : null}
        </div>
        {icon ? (
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${t.icon}`}>
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

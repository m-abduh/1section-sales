import type { ReactNode } from "react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-fg sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

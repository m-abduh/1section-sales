import type { ReactNode } from "react";

export function SitePageHero({
  eyebrow,
  title,
  description,
  meta,
  accentColor,
  maxWidth = "max-w-3xl",
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  accentColor?: string;
  maxWidth?: "max-w-3xl" | "max-w-4xl" | "max-w-6xl";
  children?: ReactNode;
}) {
  return (
    <section
      className="relative isolate overflow-hidden border-b border-border bg-surface-muted/40"
      style={
        accentColor
          ? {
              backgroundImage: `radial-gradient(48% 70% at 100% 0%, color-mix(in srgb, ${accentColor} 9%, transparent), transparent 72%)`,
            }
          : undefined
      }
    >
      <div
        aria-hidden
        className="cinema-grid pointer-events-none absolute inset-0 opacity-40"
      />
      <div
        aria-hidden
        className="cinema-spotlight pointer-events-none absolute inset-0"
      />

      <div
        className={`relative mx-auto ${maxWidth} px-4 py-16 sm:px-6 sm:py-20`}
      >
        {children}
        {eyebrow ? (
          <div className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted backdrop-blur sm:text-xs">
            {accentColor ? (
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            ) : null}
            {eyebrow}
          </div>
        ) : null}
        <h1 className="mt-7 max-w-4xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-fg sm:text-5xl sm:leading-[1.06] lg:text-[3.5rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-6 max-w-2xl text-base leading-7 text-fg-muted sm:text-lg sm:leading-8">
            {description}
          </p>
        ) : null}
        {meta ? (
          <p className="mt-4 text-xs font-medium text-fg-muted">{meta}</p>
        ) : null}
      </div>
    </section>
  );
}

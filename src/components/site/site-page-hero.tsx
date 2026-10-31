import type { ReactNode } from "react";

export function SitePageHero({
  eyebrow,
  title,
  description,
  meta,
  accentColor,
  maxWidth = "max-w-3xl",
  children,
  media,
  above,
  framed = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  accentColor?: string;
  maxWidth?: "max-w-3xl" | "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl";
  children?: ReactNode;
  /** Optional cover/visual shown beside the hero copy on large screens. */
  media?: ReactNode;
  /** Content rendered above the hero wrap (for example a breadcrumb). */
  above?: ReactNode;
  /** Renders the hero as a contained card instead of a full-bleed band. */
  framed?: boolean;
}) {
  const content = (
    <div
      className={
        media
          ? "grid items-center gap-8 sm:grid-cols-[1.15fr_0.85fr] sm:gap-10"
          : undefined
      }
    >
      <div className="min-w-0">
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
        <h1
          className={`text-balance tracking-tight text-fg ${
            framed
              ? "mt-4 font-serif text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl"
              : "mt-7 max-w-4xl font-bold text-4xl leading-[1.08] sm:text-5xl sm:leading-[1.06] lg:text-[3.5rem]"
          }`}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={`max-w-2xl text-fg-muted ${
              framed
                ? "mt-3 text-sm leading-6 sm:text-base sm:leading-7"
                : "mt-6 text-base leading-7 sm:text-lg sm:leading-8"
            }`}
          >
            {description}
          </p>
        ) : null}
        {meta ? (
          <p className="mt-4 text-xs font-medium text-fg-muted">{meta}</p>
        ) : null}
      </div>
      {media ? (
        <div className="relative justify-self-center">
          {media}
        </div>
      ) : null}
    </div>
  );

  const accentStyle = accentColor
    ? {
        backgroundImage: `radial-gradient(48% 70% at 100% 0%, color-mix(in srgb, ${accentColor} 9%, transparent), transparent 72%)`,
      }
    : undefined;

  if (framed) {
    return (
      <section className={`relative mx-auto ${maxWidth} px-4 pt-8 sm:px-6`}>
        {above ? <div className="mb-4">{above}</div> : null}
        {content}
      </section>
    );
  }

  return (
    <section
      className="relative isolate overflow-hidden border-b border-border bg-surface-muted/40"
      style={accentStyle}
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
        {above ? <div className="mb-6">{above}</div> : null}
        {content}
      </div>
    </section>
  );
}

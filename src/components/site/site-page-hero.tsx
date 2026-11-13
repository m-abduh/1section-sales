import type { ReactNode } from "react";

export function SitePageHero({
  eyebrow,
  title,
  description,
  meta,
  accentColor,
  maxWidth = "max-w-6xl",
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
  media?: ReactNode;
  above?: ReactNode;
  framed?: boolean;
}) {
  const accent = accentColor ?? "var(--accent)";
  const content = (
    <div className={media ? "grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]" : undefined}>
      <div className="min-w-0">
        {children}
        {eyebrow ? (
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/50 bg-white/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted shadow-sm backdrop-blur-md sm:text-xs dark:border-white/10 dark:bg-white/5">
            {accentColor ? (
              <span aria-hidden className="size-2 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.4)]" style={{ backgroundColor: accentColor }} />
            ) : null}
            {eyebrow}
          </div>
        ) : null}
        <h1
          className={`text-balance tracking-tight text-fg ${
            framed
              ? "mt-4 text-3xl font-bold leading-[1.1] sm:text-4xl lg:text-5xl"
              : "mt-6 max-w-4xl text-4xl font-bold leading-[1.06] sm:text-5xl sm:leading-[1.04] lg:text-[3.4rem]"
          }`}
        >
          {title}
        </h1>
        {description ? (
          <p className={`max-w-2xl text-fg-muted ${framed ? "mt-3 text-sm leading-7 sm:text-base" : "mt-5 text-base leading-7 sm:text-lg sm:leading-8"}`}>
            {description}
          </p>
        ) : null}
        {meta ? <p className="mt-5 inline-flex rounded-full bg-surface-muted/60 px-3 py-1 text-xs font-medium text-fg-muted sm:text-sm">{meta}</p> : null}
      </div>
      {media ? <div className="relative justify-self-center lg:justify-self-end">{media}</div> : null}
    </div>
  );

  if (framed) {
    return (
      <section className={`relative mx-auto w-full ${maxWidth} px-3 pt-6 sm:px-4 sm:pt-8`}>
        {above ? <div className="mb-4">{above}</div> : null}
        <div className="glass relative overflow-hidden rounded-[2rem] p-6 sm:p-10">
          <div aria-hidden className="orb -right-10 -top-10 h-48 w-48 opacity-30" style={{ backgroundColor: accent }} />
          <div aria-hidden className="orb -bottom-12 -left-8 h-40 w-40 bg-sky-400/20" />
          <div className="relative">{content}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full px-3 pt-6 sm:px-4 sm:pt-8">
      <div className={`glass-strong relative mx-auto w-full ${maxWidth} overflow-hidden rounded-[2rem] px-5 py-12 sm:px-10 sm:py-16 lg:py-20`}>
        <div aria-hidden className="orb -left-16 -top-16 h-64 w-64 opacity-25" style={{ backgroundColor: accent }} />
        <div aria-hidden className="orb -bottom-20 right-0 h-72 w-72 bg-pink-400/20" />
        <div aria-hidden className="orb bottom-10 left-1/3 h-40 w-40 bg-sky-400/20" />
        <div className="relative">
          {above ? <div className="mb-6">{above}</div> : null}
          {content}
        </div>
      </div>
    </section>
  );
}

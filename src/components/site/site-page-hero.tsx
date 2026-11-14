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
  const accent = accentColor ?? "#6366f1";
  return (
    <section className={`relative mx-auto w-full ${maxWidth} px-5 pt-6 md:px-8 md:pt-8 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif]`}>
      {above ? <div className="mb-4">{above}</div> : null}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 p-6 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:p-10 lg:p-12">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-[90px]" style={{ backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)` }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-emerald-400/10 blur-[70px] dark:bg-[#4edea3]/10" />
        <div className={media ? "relative z-10 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]" : "relative z-10"}>
          <div className="min-w-0">
            {children}
            {eyebrow ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 shadow-sm backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#292a2f]/60 dark:text-[#cbc3d7] sm:text-[11px]">
                <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} />
                {eyebrow}
              </div>
            ) : null}
            <h1 className="mt-5 max-w-3xl text-balance text-[32px] font-bold leading-[1.08] tracking-[-0.025em] text-slate-900 dark:text-[#e3e1e9] sm:text-[40px] sm:leading-[1.06] lg:text-[44px]">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-[17px] sm:leading-8">
                {description}
              </p>
            ) : null}
            {meta ? <p className="mt-5 inline-flex rounded-full bg-slate-100/70 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-[#292a2f]/60 dark:text-[#958ea0]">{meta}</p> : null}
          </div>
          {media ? <div className="relative justify-self-center lg:justify-self-end">{media}</div> : null}
        </div>
      </div>
    </section>
  );
}

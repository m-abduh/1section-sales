import Link from "next/link";
import type { Niche } from "@/lib/types";
import { nicheUrl } from "@/lib/site";
import { SocialLinks } from "@/components/site/social-links";

export function NicheSection({
  niche,
  index,
  reversed = false,
}: {
  niche: Niche;
  index: number;
  reversed?: boolean;
}) {
  const count = niche._count?.products ?? 0;
  const problems = niche.problems ?? [];

  return (
    <section className="w-full border-b border-dashed border-fg/30">
      <div className="mx-auto w-full max-w-6xl border-x border-dashed border-fg/30 px-4 py-6 sm:px-6 sm:py-8">
        <article
          className="relative overflow-hidden rounded-3xl border border-border bg-card"
          style={{
            background: `linear-gradient(115deg, color-mix(in srgb, ${niche.accentColor} 5%, var(--card)), var(--card) 58%)`,
          }}
        >
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-1"
            style={{ backgroundColor: niche.accentColor }}
          />
          <div className="grid gap-8 p-6 pl-7 sm:gap-10 sm:p-9 sm:pl-10 lg:grid-cols-2 lg:gap-12 lg:p-12 lg:pl-14">
            <div className={`flex flex-col ${reversed ? "lg:order-2" : ""}`}>
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
                  <span
                    aria-hidden
                    className="size-2 rounded-full ring-4 ring-border/60"
                    style={{ backgroundColor: niche.accentColor }}
                  />
                  Area {String(index + 1).padStart(2, "0")}
                </span>
                <span className="rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs font-medium text-fg-muted">
                  {count} guide{count === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-8">
                <h3 className="font-serif text-4xl font-medium tracking-tight text-fg sm:text-5xl">
                  {niche.name}
                </h3>
                <p className="mt-4 max-w-xl text-lg leading-7 text-fg sm:text-xl sm:leading-8">
                  {niche.tagline ??
                    `Understand the real-life problems within ${niche.name}.`}
                </p>

                {niche.description ? (
                  <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-7 text-fg-muted">
                    {niche.description}
                  </p>
                ) : null}

                {niche.audience ? (
                  <div className="mt-6 max-w-xl rounded-xl border border-border/80 bg-surface/60 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                      A good place to start if
                    </p>
                    <p className="mt-2 text-sm leading-6 text-fg">
                      {niche.audience}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-8 border-t border-border/80 pt-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={nicheUrl(niche.slug)}
                    className="group inline-flex items-center gap-3 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition hover:opacity-90"
                  >
                    Explore {niche.name}
                    <span
                      aria-hidden
                      className="transition-transform group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                  <span className="text-xs text-fg-muted">
                    {count} focused guide{count === 1 ? "" : "s"} available
                  </span>
                </div>
                <div className="mt-5">
                  <SocialLinks slug={niche.slug} />
                </div>
              </div>
            </div>

            <div className={reversed ? "lg:order-1" : ""}>
              {problems.length > 0 ? (
                <div className="h-full rounded-2xl border border-border/80 bg-surface/75 p-5 sm:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted">
                      Does this feel familiar?
                    </h4>
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ backgroundColor: niche.accentColor }}
                    />
                  </div>
                  <ul className="mt-5 divide-y divide-border">
                    {problems.map((problem, problemIndex) => (
                      <li
                        key={problem}
                        className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 font-mono text-xs tabular-nums"
                          style={{ color: niche.accentColor }}
                        >
                          {String(problemIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm leading-6 text-fg">
                          {problem}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex h-full min-h-40 items-end rounded-2xl border border-border/80 bg-surface/75 p-6">
                  <p className="max-w-xs text-sm leading-6 text-fg-muted">
                    Focused guides explore the real situations people face in{" "}
                    {niche.name}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

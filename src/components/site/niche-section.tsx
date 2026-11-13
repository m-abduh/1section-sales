import Link from "next/link";
import type { Niche } from "@/lib/types";
import { nicheUrl } from "@/lib/site";
import { SocialLinks } from "@/components/site/social-links";

export function NicheSection({
  niche,
  index,
}: {
  niche: Niche;
  index: number;
}) {
  const count = niche._count?.products ?? 0;

  return (
    <article className="group glass relative flex h-full min-w-0 flex-col overflow-hidden rounded-[2rem] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-2xl transition group-hover:opacity-50"
        style={{ backgroundColor: niche.accentColor }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-2 border-b border-white/40 pb-4 dark:border-white/10">
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-muted/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted sm:text-xs">
          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: niche.accentColor }} />
          Area {String(index + 1).padStart(2, "0")}
        </span>
        <span className="rounded-full bg-surface-muted/60 px-2.5 py-1 text-[10px] font-medium text-fg-muted sm:text-xs">
          {count} guide{count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="relative mt-5 flex-1">
        <h3 className="text-2xl font-semibold tracking-tight text-fg break-words sm:text-3xl">
          {niche.name}
        </h3>
        {niche.tagline ? (
          <p className="mt-2 text-sm leading-7 text-fg sm:text-base">{niche.tagline}</p>
        ) : null}
        {niche.description ? (
          <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-6 text-fg-muted">
            {niche.description}
          </p>
        ) : null}
        <Link
          href={nicheUrl(niche.slug)}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg shadow-sm transition hover:opacity-90"
        >
          <span className="break-words">Explore {niche.name}</span>
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      <div className="relative mt-6 border-t border-white/40 pt-4 dark:border-white/10">
        <SocialLinks slug={niche.slug} />
      </div>
    </article>
  );
}

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
    <article className="flex h-full min-w-0 flex-col bg-surface p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-fg/30 pb-3 sm:pb-4">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted sm:text-xs">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: niche.accentColor }}
          />
          Area {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-[10px] font-medium text-fg-muted sm:text-xs">
          {count} guide{count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 flex-1 sm:mt-5">
        <h3 className="font-serif text-2xl font-medium tracking-tight text-fg break-words sm:text-3xl lg:text-4xl">
          {niche.name}
        </h3>
        {niche.tagline ? (
          <p className="mt-2 text-sm leading-6 text-fg sm:mt-3 sm:text-base sm:leading-7">
            {niche.tagline}
          </p>
        ) : null}
        <Link
          href={nicheUrl(niche.slug)}
          className="group mt-4 inline-flex items-center gap-2 text-sm font-semibold text-fg transition hover:opacity-80"
        >
          <span className="break-words">Explore {niche.name}</span>
          <span
            aria-hidden
            className="shrink-0 transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
        {niche.description ? (
          <p className="mt-3 line-clamp-4 whitespace-pre-line text-xs leading-5 text-fg-muted sm:text-sm sm:leading-6">
            {niche.description}
          </p>
        ) : null}
      </div>

      <div className="mt-5 border-t border-fg/30 pt-4 sm:mt-6">
        <SocialLinks slug={niche.slug} />
      </div>
    </article>
  );
}

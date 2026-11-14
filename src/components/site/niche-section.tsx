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
  const accent = niche.accentColor ?? "#6366f1";

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 p-5 shadow-xl backdrop-blur-2xl transition duration-300 hover:-translate-y-1 dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl transition group-hover:opacity-40"
        style={{ backgroundColor: accent }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/80 pb-4 dark:border-[#34343a]/40">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:bg-[#292a2f]/60 dark:text-[#cbc3d7] sm:text-xs">
          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
          Area {String(index + 1).padStart(2, "0")}
        </span>
        <span className="rounded-full bg-slate-100/70 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:bg-[#292a2f]/60 dark:text-[#958ea0] sm:text-xs">
          {count} guide{count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="relative mt-5 flex-1">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900 break-words dark:text-[#e3e1e9] sm:text-3xl">
          {niche.name}
        </h3>
        {niche.tagline ? (
          <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-[#e3e1e9]/90 sm:text-base">{niche.tagline}</p>
        ) : null}
        {niche.description ? (
          <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-[#cbc3d7]">
            {niche.description}
          </p>
        ) : null}
        <Link
          href={nicheUrl(niche.slug)}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-[#0d0e13] dark:hover:bg-neutral-100"
        >
          <span className="break-words">Explore {niche.name}</span>
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      <div className="relative mt-6 border-t border-slate-200/80 pt-4 dark:border-[#34343a]/40">
        <SocialLinks slug={niche.slug} />
      </div>
    </article>
  );
}

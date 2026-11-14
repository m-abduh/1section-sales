import Link from "next/link";
import type { Niche } from "@/lib/types";
import { SITE_NAME } from "@/lib/site";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({
  niches = [],
  currentNicheName,
  currentNicheSlug,
}: {
  niches?: Niche[];
  variant?: "default" | "home";
  currentNicheName?: string;
  currentNicheSlug?: string;
}) {
  const niche =
    niches.find((n) => n.slug === currentNicheSlug) ??
    niches.find((n) => n.name === currentNicheName);
  const accent = niche?.accentColor ?? "#4edea3";
  const label = niche
    ? niche.name.toUpperCase()
    : currentNicheName
      ? currentNicheName.toUpperCase()
      : null;
  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top,0px)] [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8">
        <Link
          href="/"
          aria-label={SITE_NAME}
          className="inline-flex h-11 min-w-0 items-center gap-2.5 rounded-full border border-white/60 bg-white/60 px-4 text-slate-600 shadow-sm backdrop-blur-xl transition-all hover:bg-white/80 hover:text-slate-900 active:scale-95 dark:border-[#34343a]/40 dark:bg-[#292a2f]/60 dark:text-[#cbc3d7] dark:hover:bg-[#34343a]/60 dark:hover:text-[#e3e1e9]"
        >
          <div className="h-2 w-2 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} aria-hidden />
          <Logo className="h-4 w-[66px] shrink-0 sm:h-[18px] sm:w-[74px]" />
          {label ? (
            <>
              <span className="shrink-0 text-[11px] font-bold text-slate-400 dark:text-[#494454] sm:text-xs" aria-hidden>/</span>
              <span className="max-w-[8rem] truncate text-[10px] font-bold uppercase tracking-widest sm:max-w-60 sm:text-[11px]">
                {label}
              </span>
            </>
          ) : null}
        </Link>

        <ThemeToggle className="grid size-11 shrink-0 place-items-center rounded-full border border-white/60 bg-white/60 text-slate-600 shadow-sm backdrop-blur-xl transition-all hover:bg-white/80 hover:text-slate-900 active:scale-95 dark:border-[#34343a]/40 dark:bg-[#292a2f]/60 dark:text-[#cbc3d7] dark:hover:bg-[#34343a]/60 dark:hover:text-[#e3e1e9]" />
      </div>
    </header>
  );
}

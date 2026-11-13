import Link from "next/link";
import type { Niche } from "@/lib/types";
import { SITE_NAME } from "@/lib/site";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({
  niches = [],
  currentNicheName,
}: {
  niches?: Niche[];
  variant?: "default" | "home";
  currentNicheName?: string;
}) {
  const accent = niches.find((n) => n.name === currentNicheName)?.accentColor;
  return (
    <header className="sticky top-0 z-40 w-full px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-[2rem] border border-white/40 bg-white/30 px-4 shadow-lg shadow-black/5 backdrop-blur-2xl backdrop-saturate-150 sm:h-16 sm:px-6 dark:border-white/10 dark:bg-slate-900/30">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" aria-label={SITE_NAME} className="flex shrink-0 items-center">
            <Logo className="h-4 w-[66px] text-fg sm:h-5 sm:w-[82px]" />
          </Link>
          {currentNicheName ? (
            <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
              <span aria-hidden className="text-base text-fg-muted/40 sm:text-lg">/</span>
              <span
                className="max-w-[8rem] truncate text-sm font-semibold sm:max-w-60 sm:text-base"
                style={{
                  color: accent ? `color-mix(in srgb, ${accent} 85%, var(--fg))` : "var(--fg-muted)",
                }}
              >
                {currentNicheName}
              </span>
            </div>
          ) : null}
        </div>

        <ThemeToggle className="shrink-0 border-white/50 bg-white/30 backdrop-blur-xl hover:bg-white/45 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15" />
      </div>
    </header>
  );
}

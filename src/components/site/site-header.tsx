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
      <div className="glass-strong mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-[2rem] px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" aria-label={SITE_NAME} className="flex shrink-0 items-center">
            <Logo className="h-5 w-[82px] text-fg sm:h-6 sm:w-[98px]" />
          </Link>
          {currentNicheName ? (
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <span aria-hidden className="text-fg-muted/40">/</span>
              <span
                className="max-w-24 truncate rounded-full px-2 py-0.5 text-[11px] font-semibold sm:max-w-52 sm:px-2.5 sm:py-1 sm:text-xs"
                style={{
                  color: accent ? `color-mix(in srgb, ${accent} 80%, var(--fg))` : "var(--fg-muted)",
                  backgroundColor: accent
                    ? `color-mix(in srgb, ${accent} 14%, transparent)`
                    : "var(--surface-muted)",
                }}
              >
                {currentNicheName}
              </span>
            </div>
          ) : null}
        </div>

        <ThemeToggle className="shrink-0 border-white/40 bg-white/40 backdrop-blur-md hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" />
      </div>
    </header>
  );
}

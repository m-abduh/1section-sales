import Link from "next/link";
import type { Niche } from "@/lib/types";
import { SITE_NAME, nicheUrl } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({
  niches = [],
  variant = "default",
  currentNicheName,
}: {
  niches?: Niche[];
  variant?: "default" | "home";
  currentNicheName?: string;
}) {
  if (variant === "home") {
    return (
      <header className="sticky top-0 z-40 border-b border-border bg-surface/70 backdrop-blur-xl">
        {niches.length > 0 ? (
          <div
            aria-hidden
            className="h-[3px] w-full"
            style={{
              backgroundImage: `linear-gradient(90deg, ${niches
                .map((n) => n.accentColor)
                .join(", ")})`,
            }}
          />
        ) : null}
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-fg">
              {SITE_NAME}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/#niches"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
            >
              Explore
            </Link>
          </div>
        </div>

        <div className="border-t border-border bg-surface-muted/60">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 sm:px-6">
            <nav className="flex flex-1 items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {niches.length === 0 ? (
                <span className="px-2 py-1 text-sm text-fg-muted">
                  No areas yet
                </span>
              ) : (
                niches.map((niche) => (
                  <a
                    key={niche.id}
                    href={nicheUrl(niche.slug)}
                    className="group inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-fg-muted transition hover:bg-card hover:text-fg"
                  >
                    <span
                      className="size-2 rounded-full transition group-hover:scale-125"
                      style={{ backgroundColor: niche.accentColor }}
                    />
                    {niche.name}
                  </a>
                ))
              )}
            </nav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        {/* Left: brand + current area */}
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-fg">
              {SITE_NAME}
            </span>
          </Link>
          {currentNicheName ? (
            <>
              <span className="text-fg-muted/60">/</span>
              <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-fg">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      niches.find((n) => n.name === currentNicheName)?.accentColor ??
                      "var(--accent)",
                  }}
                />
                <span className="truncate">{currentNicheName}</span>
              </span>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {currentNicheName ? (
            <Link
              href="/checkout/success"
              className="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-surface-muted hover:text-fg"
            >
              Retrieve purchase
            </Link>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

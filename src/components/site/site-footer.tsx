import Link from "next/link";
import type { Niche } from "@/lib/types";
import { SITE_NAME, SITE_TAGLINE, nicheUrl } from "@/lib/site";
import { Logo } from "@/components/site/logo";

export function SiteFooter({ niches = [] }: { niches?: Niche[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full px-3 pb-4 pt-6 sm:px-4 sm:pb-6">
      <div className="glass mx-auto w-full max-w-6xl rounded-[2rem] p-6 sm:p-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-[98px] text-fg" />
            </div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-fg-muted">{SITE_TAGLINE}</p>
            <p className="mt-3 text-xs leading-5 text-fg-muted">
              Understand what is happening. Consider what it means for you.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-fg">Problems</h3>
            <ul className="mt-3 space-y-2">
              {niches.map((niche) => (
                <li key={niche.id}>
                  <a
                    href={nicheUrl(niche.slug)}
                    className="inline-flex items-center gap-2 text-sm text-fg-muted transition hover:text-fg"
                  >
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: niche.accentColor }} />
                    {niche.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-fg">Learn</h3>
            <ul className="mt-3 space-y-2 text-sm text-fg-muted">
              <li><Link href="/about" className="transition hover:text-fg">About us</Link></li>
              <li><Link href="/faq" className="transition hover:text-fg">FAQ</Link></li>
              <li><Link href="/checkout/success" className="transition hover:text-fg">Retrieve a purchase</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-fg">Legal &amp; support</h3>
            <ul className="mt-3 space-y-2 text-sm text-fg-muted">
              <li><Link href="/privacy" className="transition hover:text-fg">Privacy policy</Link></li>
              <li><Link href="/terms" className="transition hover:text-fg">Terms of service</Link></li>
              <li><Link href="/refund" className="transition hover:text-fg">Refund policy</Link></li>
              <li><Link href="/support" className="transition hover:text-fg">Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center rounded-2xl border border-white/40 bg-surface-muted/40 px-4 py-4 text-center text-xs text-fg-muted sm:px-6 dark:border-white/10">
          <span>© {year} {SITE_NAME}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

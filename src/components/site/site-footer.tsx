import Link from "next/link";
import type { Niche } from "@/lib/types";
import { SITE_NAME, SITE_TAGLINE, nicheUrl } from "@/lib/site";

export function SiteFooter({ niches = [] }: { niches?: Niche[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-fg">{SITE_NAME}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-fg-muted">{SITE_TAGLINE}</p>
          <p className="mt-3 text-xs text-fg-muted">
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
                  className="text-sm text-fg-muted transition hover:text-fg"
                >
                  {niche.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-fg">Learn</h3>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
            <li>
              <Link href="/about" className="transition hover:text-fg">
                About us
              </Link>
            </li>
            <li>
              <Link href="/faq" className="transition hover:text-fg">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/checkout/success" className="transition hover:text-fg">
                Retrieve a purchase
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-fg">Legal &amp; support</h3>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
            <li>
              <Link href="/privacy" className="transition hover:text-fg">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition hover:text-fg">
                Terms of service
              </Link>
            </li>
            <li>
              <Link href="/refund" className="transition hover:text-fg">
                Refund policy
              </Link>
            </li>
            <li>
              <Link href="/support" className="transition hover:text-fg">
                Support
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            © {year} {SITE_NAME}. All rights reserved.
          </span>
          <span>Payments secured by Paddle · Instant access after purchase</span>
        </div>
      </div>
    </footer>
  );
}

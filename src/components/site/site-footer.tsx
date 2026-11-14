import Link from "next/link";
import type { Niche } from "@/lib/types";
import { SITE_NAME, SITE_TAGLINE, nicheUrl } from "@/lib/site";
import { Logo } from "@/components/site/logo";

export function SiteFooter({ niches = [] }: { niches?: Niche[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-8 pt-2 md:px-8 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif]">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 p-6 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 md:p-8 lg:p-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" aria-label={SITE_NAME} className="inline-flex items-center text-slate-900 dark:text-[#e3e1e9]">
              <Logo className="h-5 w-[82px]" />
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-[20px] tracking-[0.005em] text-slate-600 dark:text-[#cbc3d7]">{SITE_TAGLINE}</p>
            <p className="mt-3 text-[12px] leading-[16px] tracking-[0.01em] text-slate-500 dark:text-[#958ea0]">
              Understand what is happening. Consider what it means for you.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold leading-[20px] text-slate-900 dark:text-[#e3e1e9]">Problems</h3>
            <ul className="mt-3 space-y-2">
              {niches.map((item) => (
                <li key={item.id}>
                  <Link href={nicheUrl(item.slug)} className="inline-flex items-center gap-2 text-[13px] leading-[20px] text-slate-600 transition hover:text-slate-900 dark:text-[#cbc3d7] dark:hover:text-[#e3e1e9]">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: item.accentColor ?? "#d0bcff" }} />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold leading-[20px] text-slate-900 dark:text-[#e3e1e9]">Learn</h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-[20px] text-slate-600 dark:text-[#cbc3d7]">
              <li><Link href="/about" className="transition hover:text-slate-900 dark:hover:text-[#e3e1e9]">About us</Link></li>
              <li><Link href="/faq" className="transition hover:text-slate-900 dark:hover:text-[#e3e1e9]">FAQ</Link></li>
              <li><Link href="/checkout/success" className="transition hover:text-slate-900 dark:hover:text-[#e3e1e9]">Retrieve a purchase</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold leading-[20px] text-slate-900 dark:text-[#e3e1e9]">Legal &amp; support</h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-[20px] text-slate-600 dark:text-[#cbc3d7]">
              <li><Link href="/privacy" className="transition hover:text-slate-900 dark:hover:text-[#e3e1e9]">Privacy policy</Link></li>
              <li><Link href="/terms" className="transition hover:text-slate-900 dark:hover:text-[#e3e1e9]">Terms of service</Link></li>
              <li><Link href="/refund" className="transition hover:text-slate-900 dark:hover:text-[#e3e1e9]">Refund policy</Link></li>
              <li><Link href="/support" className="transition hover:text-slate-900 dark:hover:text-[#e3e1e9]">Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-100/50 px-4 py-4 text-center text-[12px] leading-[16px] tracking-[0.01em] text-slate-500 dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 dark:text-[#958ea0] sm:px-6">
          <span>© {year} {SITE_NAME}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

import type { Niche } from "@/lib/types";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SitePageHero } from "@/components/site/site-page-hero";
import { getCurrentNiche } from "@/lib/server-api";

export const LEGAL_UPDATED = "October 2026";

export async function LegalLayout({
  title,
  intro,
  niches = [],
  children,
}: {
  title: string;
  intro?: string;
  niches?: Niche[];
  children: React.ReactNode;
}) {
  const currentNiche = await getCurrentNiche();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f6f7fb] text-[#0f172a] selection:bg-indigo-500/20 selection:text-indigo-700 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif] dark:bg-[#121318] dark:text-[#e3e1e9] dark:selection:bg-[#d0bcff]/20 dark:selection:text-[#d0bcff]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="pointer-events-none fixed -top-24 left-1/2 z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-[100px] dark:bg-[#d0bcff]/10" />
      <div className="pointer-events-none fixed -right-20 bottom-20 z-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-[90px] dark:bg-[#4edea3]/10" />
      <SiteHeader niches={niches} currentNicheName={currentNiche?.name} />
      <main className="relative z-10 flex-1 pt-16">
        <SitePageHero
          eyebrow="1section · information"
          title={title}
          description={intro}
          accentColor={currentNiche?.accentColor}
          meta={`Last updated: ${LEGAL_UPDATED}`}
        />

        <section className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
          <div className="rounded-3xl border border-slate-200/80 bg-white/60 px-5 py-8 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:px-10 sm:py-12">
            <div className="space-y-8 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 dark:text-[#cbc3d7] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-slate-900 [&_h2]:sm:text-xl dark:[&_h2]:text-[#e3e1e9] [&_p]:max-w-3xl [&_ul]:max-w-3xl">
              {children}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter niches={niches} />
    </div>
  );
}

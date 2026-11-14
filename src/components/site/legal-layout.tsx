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
    <div className="flex min-h-screen flex-col bg-[#f6f7fb] text-slate-900 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif] dark:bg-[#121318] dark:text-[#e3e1e9]">
      <SiteHeader niches={niches} currentNicheName={currentNiche?.name} />
      <main className="flex-1 pt-16">
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

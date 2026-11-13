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
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches} currentNicheName={currentNiche?.name} />
      <main className="flex-1">
        <SitePageHero
          eyebrow="1section · information"
          title={title}
          description={intro}
          accentColor={currentNiche?.accentColor}
          meta={`Last updated: ${LEGAL_UPDATED}`}
        />

        <section className="w-full border-b border-dashed border-fg/30">
          <div className="mx-auto w-full max-w-6xl border-x border-dashed border-fg/30 px-4 py-12 sm:px-6 sm:py-16">
            <div className="space-y-8 text-sm leading-7 text-fg-muted sm:text-base sm:leading-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-fg [&_h2]:sm:text-xl [&_p]:max-w-2xl [&_ul]:max-w-2xl">
              {children}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter niches={niches} />
    </div>
  );
}

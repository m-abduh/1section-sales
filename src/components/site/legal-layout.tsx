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
      <SiteHeader
        niches={niches}
        currentNicheName={currentNiche?.name}
      />
      <main className="flex-1">
        <SitePageHero
          eyebrow="1section · information"
          title={title}
          description={intro}
          accentColor={currentNiche?.accentColor}
          meta={`Last updated: ${LEGAL_UPDATED}`}
        />

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="space-y-8 text-sm leading-relaxed text-fg-muted [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-fg [&_h2]:tracking-tight">
            {children}
          </div>
        </section>
      </main>
      <SiteFooter niches={niches} />
    </div>
  );
}

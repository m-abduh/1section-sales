import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SitePageHero } from "@/components/site/site-page-hero";
import { getCurrentNiche, getNiches } from "@/lib/server-api";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  description:
    "1section is a practical learning platform organized around real-world problems: understand, decide, act.",
};

export default async function AboutPage() {
  const [nichesResponse, currentNiche] = await Promise.all([
    getNiches(),
    getCurrentNiche(),
  ]);
  const niches = nichesResponse ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches} currentNicheName={currentNiche?.name} />

      <main className="flex-1">
        <SitePageHero
          eyebrow={currentNiche ? `${currentNiche.name} · About 1section` : "About 1section"}
          title={`About ${SITE_NAME}`}
          description="Most people do not lack information. They lack a clear next step."
          accentColor={currentNiche?.accentColor}
        />

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="space-y-8 text-base text-fg-muted">
            <p>
              {SITE_NAME} is a practical learning platform organized around
              real-world problems. Instead of browsing by topic, you start by
              describing the situation you are actually in: irregular income,
              an untested business idea, a habit that keeps breaking, or a role
              you want but are not sure how to prepare for.
            </p>
            <p>
              Every resource follows the same structure: understand the problem,
              decide what to do with a framework, and act with a concrete next
              step. We write in plain language, use worked examples, and say
              clearly who a resource is for and what it will not do.
            </p>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-fg">Our principles</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <span className="font-medium text-fg">Honest scope.</span> We
                  state the audience, the boundaries, and the limitations of
                  each resource.
                </li>
                <li>
                  <span className="font-medium text-fg">Decision-first.</span>{" "}
                  Learning is in service of a decision, not an end in itself.
                </li>
                <li>
                  <span className="font-medium text-fg">Actionable.</span> Every
                  resource ends with something you can start this week.
                </li>
                <li>
                  <span className="font-medium text-fg">No filler.</span> We
                  remove padding and repetition so you can move quickly.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-fg">How we are funded</h2>
              <p className="mt-3">
                Resources are sold as one-time purchases. Payments and taxes are
                handled by Paddle as merchant of record. We do not run
                subscription billing or show third-party advertising.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-fg">Editorial care</h2>
              <p className="mt-3">
                We review each resource for clarity and accuracy before
                publishing, and we keep an eye on feedback. If something is
                unclear or out of date, tell us and we will correct it.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter niches={niches} />
    </div>
  );
}

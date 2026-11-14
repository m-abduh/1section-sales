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

  const principles = [
    { title: "Honest scope", text: "We state the audience, the boundaries, and the limitations of each resource." },
    { title: "Decision-first", text: "Learning is in service of a decision, not an end in itself." },
    { title: "Actionable", text: "Every resource ends with something you can start this week." },
    { title: "No filler", text: "We remove padding and repetition so you can move quickly." },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f6f7fb] text-slate-900 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif] dark:bg-[#121318] dark:text-[#e3e1e9]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="pointer-events-none fixed -top-24 left-1/2 z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-[100px] dark:bg-[#d0bcff]/10" />
      <div className="pointer-events-none fixed -right-20 bottom-20 z-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-[90px] dark:bg-[#4edea3]/10" />
      <SiteHeader niches={niches} currentNicheName={currentNiche?.name} />

      <main className="relative z-10 flex-1 pt-16">
        <SitePageHero
          eyebrow={currentNiche ? `${currentNiche.name} · About 1section` : "About 1section"}
          title={`About ${SITE_NAME}`}
          description="Most people do not lack information. They lack a clear next step."
          accentColor={currentNiche?.accentColor}
        />

        <section className="mx-auto w-full max-w-6xl px-5 pb-2 pt-6 md:px-8 md:pt-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-3xl border border-slate-200/80 bg-white/60 px-5 py-8 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:px-10 sm:py-10">
              <p className="max-w-3xl text-base leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-lg sm:leading-8">
                {SITE_NAME} is a practical learning platform organized around real-world problems. Instead of browsing by topic, you start by describing the situation you are actually in: irregular income, an untested business idea, a habit that keeps breaking, or a role you want but are not sure how to prepare for.
              </p>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-lg sm:leading-8">
                Every resource follows the same structure: understand the problem, decide what to do with a framework, and act with a concrete next step. We write in plain language, use worked examples, and say clearly who a resource is for and what it will not do.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/60 px-5 py-8 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:px-10 sm:py-10">
              <div className="flex items-end justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-[#34343a]/40">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-[#e3e1e9] sm:text-2xl">Our principles</h2>
                <span className="rounded-full bg-slate-100/70 px-3 py-1 text-xs text-slate-500 dark:bg-[#292a2f]/60 dark:text-[#958ea0]">4 pillars</span>
              </div>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {principles.map((item, i) => (
                  <li key={item.title} className="rounded-2xl border border-slate-200/80 bg-white/50 p-5 backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 sm:p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#958ea0]">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-[#e3e1e9] sm:text-lg">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#cbc3d7] sm:text-base sm:leading-7">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white/60 px-5 py-8 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:px-8 sm:py-10">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-[#e3e1e9] sm:text-2xl">How we are funded</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-base sm:leading-8">
                  Resources are sold as one-time purchases. Payments and taxes are handled by Paddle as merchant of record. We do not run subscription billing or show third-party advertising.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-white/60 px-5 py-8 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:px-8 sm:py-10">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-[#e3e1e9] sm:text-2xl">Editorial care</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-base sm:leading-8">
                  We review each resource for clarity and accuracy before publishing, and we keep an eye on feedback. If something is unclear or out of date, tell us and we will correct it.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter niches={niches} />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ProductCard } from "@/components/site/product-card";
import { SocialLinks } from "@/components/site/social-links";
import { getNiche, getNiches } from "@/lib/server-api";

export const revalidate = 30;

interface NichePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: NichePageProps): Promise<Metadata> {
  const { slug } = await params;
  const niche = await getNiche(slug);
  if (!niche) {
    return { title: "Problem area not found" };
  }
  return {
    title: `${niche.name} — understand the problem`,
    description:
      niche.tagline ??
      niche.description ??
      `Explore real-life problems in ${niche.name} through focused, practical understanding.`,
  };
}

export default async function NichePage({ params }: NichePageProps) {
  const { slug } = await params;
  const [niche, niches] = await Promise.all([getNiche(slug), getNiches()]);

  if (!niche) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches ?? []} currentNicheName={niche.name} />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border bg-surface-muted/40">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(48% 70% at 100% 0%, ${niche.accentColor}16, transparent 72%)`,
            }}
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card/80 px-3 py-1.5 backdrop-blur">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: niche.accentColor }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted sm:text-xs">
                  A closer look at {niche.name}
                </span>
              </div>

              <h1
                className="mt-7 max-w-2xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-fg sm:text-5xl sm:leading-[1.06] lg:text-[3.5rem]"
              >
                {niche.tagline ??
                  `Understand what makes ${niche.name.toLowerCase()} difficult.`}
              </h1>

              <p className="mt-6 max-w-xl whitespace-pre-line text-base leading-7 text-fg-muted sm:text-lg sm:leading-8">
                {niche.description ??
                  `Focused, practical explanations of the real-life situations people face in ${niche.name.toLowerCase()}—and the factors that may be shaping them.`}
              </p>

              {niche.audience ? (
                <p
                  className="mt-6 max-w-xl border-l-2 pl-4 text-sm leading-6 text-fg-muted"
                  style={{ borderColor: niche.accentColor }}
                >
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                    A place to start if
                  </span>
                  <span className="text-fg">{niche.audience}</span>
                </p>
              ) : null}

              <div
                className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3"
              >
                <a
                  href="#guides"
                  className="group inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition hover:opacity-90"
                >
                  Explore the guides
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-y-0.5"
                  >
                    ↓
                  </span>
                </a>
                <span className="text-sm text-fg-muted">
                  {niche.products.length} focused guide
                  {niche.products.length === 1 ? "" : "s"} · pay once
                </span>
              </div>
              <div className="mt-6 border-t border-border/80 pt-5">
                <SocialLinks slug={niche.slug} />
              </div>
            </div>

            {niche.problems.length > 0 ? (
              <div
                className="animate-fade-up rounded-3xl border border-border bg-card/90 p-6 sm:p-8"
                style={{ animationDelay: "120ms" }}
              >
                <div className="flex items-start justify-between gap-6 border-b border-border pb-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
                      Start with the situation
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-fg sm:text-2xl">
                      What feels familiar?
                    </h2>
                  </div>
                  <span
                    aria-hidden
                    className="mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-border/60"
                    style={{ backgroundColor: niche.accentColor }}
                  />
                </div>
                <ul className="divide-y divide-border">
                  {niche.problems.map((problem, index) => (
                    <li
                      key={problem}
                      className="flex items-start gap-4 py-4 last:pb-0"
                    >
                      <span
                        className="mt-0.5 font-mono text-xs tabular-nums"
                        style={{ color: niche.accentColor }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm leading-6 text-fg">
                        {problem}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex min-h-48 items-end rounded-3xl border border-border bg-card/90 p-6 sm:p-8">
                <p className="max-w-sm text-lg leading-7 text-fg-muted">
                  A closer look at the real-life situations and questions within{" "}
                  <span className="font-semibold text-fg">{niche.name}</span>.
                </p>
              </div>
            )}
          </div>
        </section>

        <section id="guides" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted sm:text-xs">
                The guide collection
              </p>
              <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight text-fg sm:text-5xl">
                One problem at a time.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-fg-muted">
              Focused guides that take the time to explain what may be behind a
              situation. One-time purchase; access follows confirmed payment.
            </p>
          </div>

          {niche.products.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface-muted/50 p-10 text-center text-sm text-fg-muted">
              The first guides for this area are being prepared.
            </p>
          ) : (
            <div className="mt-10 flex flex-col gap-6">
              {niche.products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  nicheSlug={niche.slug}
                  accentColor={niche.accentColor}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter niches={niches ?? []} />
    </div>
  );
}

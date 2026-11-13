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
    <div className="flex min-h-screen flex-col">
      <SiteHeader niches={niches ?? []} currentNicheName={niche.name} />

      <main className="flex-1">
        <section className="px-3 pt-6 sm:px-4 sm:pt-8">
          <div className="glass relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] px-5 py-10 sm:px-8 sm:py-14">
            <div aria-hidden className="orb -right-12 -top-12 h-40 w-40 opacity-25" style={{ backgroundColor: niche.accentColor }} />
            <div className="relative mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-muted/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: niche.accentColor }} />
                {niche.name}
              </div>
              <h1 className="mt-5 text-balance text-3xl font-bold leading-tight tracking-tight text-fg sm:text-5xl">
                {niche.tagline ?? `Understand what makes ${niche.name.toLowerCase()} difficult.`}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl whitespace-pre-line text-base leading-7 text-fg-muted sm:text-lg">
                {niche.description ?? `Focused, practical explanations of the real-life situations people face in ${niche.name.toLowerCase()}—and the factors that may be shaping them.`}
              </p>
              <div className="mt-7">
                <a href="#guides" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition hover:opacity-90">
                  Explore the guides
                  <span aria-hidden>↓</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="px-3 pt-6 sm:px-4 sm:pt-8">
          <div className="glass relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] px-4 py-5 sm:px-6 sm:py-6">
            <div aria-hidden className="orb -right-10 -top-10 h-32 w-32 opacity-15" style={{ backgroundColor: niche.accentColor }} />
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">Stay connected</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-fg sm:text-xl">Follow {niche.name}</h2>
                </div>
              </div>
              <SocialLinks slug={niche.slug} accentColor={niche.accentColor} variant="cards" />
            </div>
          </div>
        </section>

        <section id="guides" className="px-3 pb-2 pt-6 sm:px-4 sm:pt-8">
          <div className="glass relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] px-5 py-10 sm:px-8 sm:py-14">
            <div aria-hidden className="orb -right-12 -top-12 h-40 w-40" style={{ backgroundColor: `color-mix(in srgb, ${niche.accentColor} 25%, transparent)` }} />
            <div className="relative flex flex-col gap-4 border-b border-white/40 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted sm:text-xs">The guide collection</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-4xl">One problem at a time.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-fg-muted">
                Focused guides that take the time to explain what may be behind a situation. One-time purchase; access follows confirmed payment.
              </p>
            </div>

            {niche.products.length === 0 ? (
              <p className="relative mt-8 rounded-2xl bg-surface-muted/40 p-10 text-center text-sm text-fg-muted">
                The first guides for this area are being prepared.
              </p>
            ) : (
              <div className="relative mt-8 flex flex-col gap-6">
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
          </div>
        </section>
      </main>

      <SiteFooter niches={niches ?? []} />
    </div>
  );
}

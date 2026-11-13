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
        <section className="w-full border-b border-dashed border-fg/30">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center border-x border-dashed border-fg/30 px-4 py-14 text-center sm:px-6 sm:py-20">
            <div className="flex max-w-3xl flex-col items-center">
              <h1 className="text-balance text-4xl font-bold leading-[1.06] tracking-tight text-fg sm:text-5xl lg:text-6xl">
                {niche.tagline ??
                  `Understand what makes ${niche.name.toLowerCase()} difficult.`}
              </h1>

              <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-base leading-7 text-fg-muted sm:text-lg sm:leading-8">
                {niche.description ??
                  `Focused, practical explanations of the real-life situations people face in ${niche.name.toLowerCase()}—and the factors that may be shaping them.`}
              </p>

              <div className="mt-8 flex flex-col items-center gap-4">
                <a
                  href="#guides"
                  className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-fg transition hover:opacity-90"
                >
                  Explore the guides
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-y-0.5"
                  >
                    ↓
                  </span>
                </a>
              </div>

              <div className="mt-8 w-full border-t border-fg/30 pt-6">
                <SocialLinks slug={niche.slug} />
              </div>
            </div>
          </div>
        </section>

        <section id="guides" className="w-full border-b border-dashed border-fg/30">
          <div className="mx-auto w-full max-w-6xl border-x border-dashed border-fg/30 px-4 py-14 sm:px-6 sm:py-20">
            <div className="flex flex-col gap-4 border-b border-fg/30 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted sm:text-xs">
                  The guide collection
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-4xl">
                  One problem at a time.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-fg-muted">
                Focused guides that take the time to explain what may be behind a
                situation. One-time purchase; access follows confirmed payment.
              </p>
            </div>

            {niche.products.length === 0 ? (
              <p className="mt-8 rounded-2xl border border-dashed border-fg/30 bg-surface-muted/50 p-10 text-center text-sm text-fg-muted">
                The first guides for this area are being prepared.
              </p>
            ) : (
              <div className="mt-8 flex flex-col gap-6">
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

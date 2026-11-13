import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { NicheSection } from "@/components/site/niche-section";
import { getNiches, getProducts } from "@/lib/server-api";
import { formatCurrency } from "@/lib/format";
import { resourceUrl } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  const [nichesResponse, productsResponse] = await Promise.all([
    getNiches(),
    getProducts(),
  ]);
  const niches = nichesResponse ?? [];
  const list = niches;
  const activeNichesById = new Map(niches.map((niche) => [niche.id, niche]));
  const latestProducts = (productsResponse ?? [])
    .flatMap((product) => {
      const niche = activeNichesById.get(product.nicheId);
      return niche ? [{ product, niche }] : [];
    })
    .sort(
      (left, right) =>
        new Date(right.product.createdAt).getTime() -
        new Date(left.product.createdAt).getTime(),
    )
    .slice(0, 4);

  const heroAccent = niches[0]?.accentColor ?? "var(--accent)";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader niches={niches} variant="home" />

      <main className="flex-1">
        <section className="relative px-3 pt-6 sm:px-4 sm:pt-8">
          <div className="glass-strong relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] px-5 py-14 sm:px-10 sm:py-20 lg:py-24">
            <div aria-hidden className="orb -left-20 -top-20 h-72 w-72 opacity-30" style={{ backgroundColor: heroAccent }} />
            <div aria-hidden className="orb -bottom-24 right-0 h-80 w-80 bg-pink-400/20" />
            <div aria-hidden className="orb bottom-12 left-1/3 h-44 w-44 bg-sky-400/20" />
            <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
              <h1 className="text-balance text-4xl font-bold leading-[1.03] tracking-tight text-fg sm:text-6xl lg:text-7xl">
                One problem,{" "}
                <span style={{ color: heroAccent }}>many paths.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-fg-muted sm:text-lg sm:leading-8">
                1section turns real-life problems into deep, practical understanding—beyond familiar advice—so you can think clearly about what a situation means for you.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <a href="#niches" className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-fg shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 transition hover:-translate-y-0.5">
                  Explore real-life problems
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </a>
                <a href="#latest" className="glass-soft inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-fg transition hover:-translate-y-0.5">
                  Latest guides
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="latest" className="px-3 pt-6 sm:px-4 sm:pt-8">
          <div className="glass relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] px-5 py-10 sm:px-8 sm:py-14">
            <div aria-hidden className="orb -right-16 -top-16 h-48 w-48 bg-sky-400/20" />
            <div className="relative flex flex-col gap-4 border-b border-white/40 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fg-muted sm:text-xs">Recently published</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-4xl">Latest guides</h2>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-surface-muted/60 px-3 py-1.5 text-xs text-fg-muted ring-1 ring-white/30 dark:ring-white/10">One problem, explored in depth</span>
            </div>

            {latestProducts.length > 0 ? (
              <ul className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {latestProducts.map(({ product, niche }, index) => {
                  const hasDiscount =
                    product.compareAtAmount != null &&
                    product.compareAtAmount > product.priceAmount;
                  const discountPercent = hasDiscount
                    ? Math.round(
                        ((product.compareAtAmount as number) - product.priceAmount) /
                          (product.compareAtAmount as number) * 100,
                      )
                    : 0;
                  return (
                    <li key={product.id} className="min-w-0">
                      <a href={resourceUrl(niche.slug, product.slug)} className="glass-soft group flex h-full flex-col overflow-hidden rounded-2xl p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5">
                        <div aria-hidden className="pointer-events-none -mx-4 -mt-4 mb-3 h-1 sm:-mx-5 sm:-mt-5" style={{ background: `linear-gradient(90deg, ${niche.accentColor}, transparent)` }} />
                        <div className="flex items-center justify-end gap-2">
                          <span className="shrink-0 rounded-full bg-surface-muted/70 px-2 py-0.5 text-[10px] tabular-nums text-fg-muted">0{index + 1}</span>
                        </div>
                        <h3 className="mt-3 text-base font-semibold tracking-tight text-fg break-words sm:text-lg">{product.name}</h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-fg-muted">
                          {product.summary ?? product.outcome ?? "A focused guide to understanding a real-life problem."}
                        </p>
                        <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-fg">{product.priceAmount === 0 ? "Free" : formatCurrency(product.priceAmount, product.currency)}</span>
                          {hasDiscount ? (
                            <>
                              <span className="text-xs text-fg-muted line-through">{formatCurrency(product.compareAtAmount as number, product.currency)}</span>
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{discountPercent}% off</span>
                            </>
                          ) : null}
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="relative mt-6 rounded-2xl bg-surface-muted/40 py-10 text-center text-sm text-fg-muted">New guides will appear here as they are published.</p>
            )}
          </div>
        </section>

        <section id="niches" className="px-3 pb-2 pt-6 sm:px-4 sm:pt-8">
          <div className="glass relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] px-5 py-10 sm:px-8 sm:py-14">
            <div className="relative grid gap-6 border-b border-white/40 pb-8 lg:grid-cols-[1fr_0.7fr] lg:items-end dark:border-white/10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">Find your starting point</p>
                <h2 className="mt-4 max-w-2xl text-balance text-3xl font-bold tracking-tight text-fg sm:text-5xl sm:leading-[1.08]">
                  Start with what’s happening in your life.
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-7 text-fg-muted sm:text-base lg:justify-self-end">
                Not sure what to call it? Begin with the situation. Explore focused guides that look at what may be behind it—and what that could mean for you.
              </p>
            </div>

            {list.length === 0 ? (
              <div className="relative pt-8">
                <p className="rounded-2xl bg-surface-muted/40 p-10 text-center text-sm text-fg-muted">No problem areas are published yet.</p>
              </div>
            ) : (
              <div className="relative mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {list.map((niche, index) => (
                  <NicheSection key={niche.id} niche={niche} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter niches={niches} />
    </div>
  );
}

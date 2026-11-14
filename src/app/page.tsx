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

  const heroAccent = niches[0]?.accentColor ?? "#6366f1";

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f6f7fb] text-slate-900 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif] dark:bg-[#121318] dark:text-[#e3e1e9]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="pointer-events-none fixed -top-24 left-1/2 z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-[100px] dark:bg-[#d0bcff]/10" />
      <div className="pointer-events-none fixed -right-20 bottom-20 z-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-[90px] dark:bg-[#4edea3]/10" />

      <SiteHeader niches={niches} variant="home" />

      <main className="relative z-10 flex-1 pt-16">
        <section className="relative mx-auto w-full max-w-6xl px-5 pt-6 md:px-8 md:pt-8">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 px-6 py-14 text-center shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:px-10 sm:py-20 lg:py-24">
            <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-[110px]" style={{ backgroundColor: `color-mix(in srgb, ${heroAccent} 20%, transparent)` }} />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-emerald-400/15 blur-[100px] dark:bg-[#4edea3]/10" />
            <div className="relative mx-auto flex max-w-4xl flex-col items-center">
              <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-slate-900 dark:text-[#e3e1e9] sm:text-6xl lg:text-7xl">
                One problem,{" "}
                <span style={{ color: heroAccent }}>many paths.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-lg sm:leading-8">
                1section turns real-life problems into deep, practical understanding—beyond familiar advice—so you can think clearly about what a situation means for you.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <a href="#niches" className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 dark:bg-white dark:text-[#0d0e13] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] dark:hover:bg-neutral-100">
                  Explore real-life problems
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </a>
                <a href="#latest" className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-6 py-3.5 text-sm font-semibold text-slate-900 backdrop-blur-xl transition hover:bg-white/80 dark:border-[#34343a]/40 dark:bg-[#292a2f]/60 dark:text-[#e3e1e9] dark:hover:bg-[#292a2f]/80">
                  Latest guides
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="latest" className="mx-auto w-full max-w-6xl px-5 pt-6 md:px-8 md:pt-8">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 px-5 py-10 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:px-8 sm:py-14">
            <div className="relative flex flex-col gap-4 border-b border-slate-200/80 pb-6 dark:border-[#34343a]/40 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-[#d0bcff] sm:text-xs">Recently published</p>
                <h2 className="mt-2 text-[28px] font-bold leading-[36px] tracking-[-0.02em] text-slate-900 dark:text-[#e3e1e9] sm:text-4xl">Latest guides</h2>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-slate-100/70 px-3 py-1.5 text-xs text-slate-600 dark:bg-[#292a2f]/60 dark:text-[#cbc3d7]">One problem, explored in depth</span>
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
                      <a href={resourceUrl(niche.slug, product.slug)} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/50 p-4 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 sm:p-5">
                        <div aria-hidden className="pointer-events-none -mx-4 -mt-4 mb-3 h-1 sm:-mx-5 sm:-mt-5" style={{ background: `linear-gradient(90deg, ${niche.accentColor ?? heroAccent}, transparent)` }} />
                        <div className="flex items-center justify-end gap-2">
                          <span className="shrink-0 rounded-full bg-slate-100/70 px-2 py-0.5 text-[10px] tabular-nums text-slate-500 dark:bg-[#34343a] dark:text-[#958ea0]">0{index + 1}</span>
                        </div>
                        <h3 className="mt-3 text-base font-semibold tracking-tight text-slate-900 break-words dark:text-[#e3e1e9] sm:text-lg">{product.name}</h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-[#cbc3d7]">
                          {product.summary ?? product.outcome ?? "A focused guide to understanding a real-life problem."}
                        </p>
                        <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-slate-900 dark:text-[#e3e1e9]">{product.priceAmount === 0 ? "Free" : formatCurrency(product.priceAmount, product.currency)}</span>
                          {hasDiscount ? (
                            <>
                              <span className="text-xs text-slate-400 line-through dark:text-[#494454]">{formatCurrency(product.compareAtAmount as number, product.currency)}</span>
                              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-[#00a572]/30 dark:text-[#4edea3]">{discountPercent}% off</span>
                            </>
                          ) : null}
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="relative mt-6 rounded-2xl bg-slate-100/50 py-10 text-center text-sm text-slate-600 dark:bg-[#292a2f]/40 dark:text-[#cbc3d7]">New guides will appear here as they are published.</p>
            )}
          </div>
        </section>

        <section id="niches" className="mx-auto w-full max-w-6xl px-5 pb-2 pt-6 md:px-8 md:pt-8">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 px-5 py-10 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:px-8 sm:py-14">
            <div className="relative grid gap-6 border-b border-slate-200/80 pb-8 dark:border-[#34343a]/40 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-[#d0bcff]">Find your starting point</p>
                <h2 className="mt-4 max-w-2xl text-balance text-[28px] font-bold leading-[36px] tracking-[-0.02em] text-slate-900 dark:text-[#e3e1e9] sm:text-4xl sm:leading-[1.1]">
                  Start with what’s happening in your life.
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-base lg:justify-self-end">
                Not sure what to call it? Begin with the situation. Explore focused guides that look at what may be behind it—and what that could mean for you.
              </p>
            </div>

            {list.length === 0 ? (
              <div className="relative pt-8">
                <p className="rounded-2xl bg-slate-100/50 p-10 text-center text-sm text-slate-600 dark:bg-[#292a2f]/40 dark:text-[#cbc3d7]">No problem areas are published yet.</p>
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

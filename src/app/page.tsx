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

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches} variant="home" />

      <main className="flex-1">
        <section className="w-full border-b border-dashed border-fg/30">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center border-x border-dashed border-fg/30 px-4 py-16 text-center sm:px-6 sm:py-24">
            <div className="max-w-3xl">
              <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-fg/30 bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    backgroundColor: niches[0]?.accentColor ?? "var(--accent)",
                  }}
                />
                Clear perspective
              </span>
              <h1
                className="animate-fade-up mt-8 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-fg sm:text-6xl lg:text-7xl"
                style={{ animationDelay: "80ms" }}
              >
                One problem,{" "}
                <span
                  style={{
                    color: niches[0]?.accentColor ?? "var(--fg-muted)",
                  }}
                >
                  many paths.
                </span>
              </h1>
              <p
                className="animate-fade-up mx-auto mt-6 max-w-2xl text-base leading-7 text-fg-muted sm:text-lg sm:leading-8"
                style={{ animationDelay: "160ms" }}
              >
                1section turns real-life problems into deep, practical
                understanding—beyond familiar advice—so you can think clearly
                about what a situation means for you.
              </p>
              <div
                className="animate-fade-up mt-10 flex justify-center"
                style={{ animationDelay: "240ms" }}
              >
                <a
                  href="#niches"
                  className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-fg transition hover:opacity-90"
                >
                  Explore real-life problems
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full border-b border-dashed border-fg/30">
          <div className="mx-auto w-full max-w-6xl border-x border-dashed border-fg/30 px-4 py-16 sm:px-6 sm:py-20">
            <div className="flex flex-col gap-4 border-b border-fg/30 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fg-muted sm:text-xs">
                  Recently published
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                  Latest guides
                </h2>
              </div>
              <span className="text-xs text-fg-muted sm:pb-1">
                One problem, explored in depth
              </span>
            </div>

            {latestProducts.length > 0 ? (
              <ul className="grid grid-cols-2 gap-px bg-fg/30 lg:grid-cols-4">
                {latestProducts.map(({ product, niche }, index) => (
                  <li key={product.id} className="min-w-0 bg-surface">
                    <a
                      href={resourceUrl(niche.slug, product.slug)}
                      className="group flex h-full flex-col p-4 transition-colors hover:bg-surface-muted/40 sm:p-6"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2 text-[10px] font-medium text-fg-muted sm:text-xs">
                          <span
                            className="size-1.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: niche.accentColor,
                            }}
                          />
                          <span className="truncate">{niche.name}</span>
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-fg-muted sm:text-xs">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold tracking-tight text-fg break-words transition group-hover:translate-x-0.5 sm:text-lg">
                        {product.name}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-fg-muted sm:text-sm sm:leading-6">
                        {product.summary ??
                          product.outcome ??
                          "A focused guide to understanding a real-life problem."}
                      </p>
                      <span className="mt-3 text-sm font-semibold text-fg">
                        {formatCurrency(
                          product.priceAmount,
                          product.currency,
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-sm text-fg-muted">
                New guides will appear here as they are published.
              </p>
            )}
          </div>
        </section>

        <section id="niches" className="w-full border-b border-dashed border-fg/30">
          <div className="mx-auto w-full max-w-6xl border-x border-dashed border-fg/30">
            <div className="border-b border-fg/30 px-4 pb-8 pt-20 sm:px-6 sm:pb-12 sm:pt-28">
              <div className="grid gap-6 pb-0 lg:grid-cols-[1fr_0.7fr] lg:items-end lg:gap-12">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
                    Find your starting point
                  </p>
                  <h2 className="mt-4 max-w-2xl text-balance text-3xl font-bold tracking-tight text-fg sm:text-5xl sm:leading-[1.08]">
                    Start with what&rsquo;s happening in your life.
                  </h2>
                </div>
                <p className="max-w-lg text-sm leading-7 text-fg-muted sm:text-base lg:justify-self-end">
                  Not sure what to call it? Begin with the situation. Explore
                  focused guides that look at what may be behind it—and what that
                  could mean for you.
                </p>
              </div>
            </div>

            {list.length === 0 ? (
              <div className="px-4 py-12 sm:px-6">
                <p className="rounded-3xl border border-fg/30 bg-surface-muted/50 p-10 text-center text-sm text-fg-muted">
                  No problem areas are published yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 divide-x divide-y divide-fg/30">
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

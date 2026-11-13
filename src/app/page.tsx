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
    .slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches} variant="home" />

      <main className="flex-1">
        <section className="relative w-full overflow-hidden border-b border-dashed border-fg/30">
          <div className="cinema-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="cinema-spotlight pointer-events-none absolute inset-0" />
          <div className="cinema-noise pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply dark:mix-blend-screen" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface to-transparent" />

          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 border-x border-dashed border-fg/30 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="max-w-2xl">
              <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium tracking-wide text-fg-muted backdrop-blur">
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    backgroundColor: niches[0]?.accentColor ?? "var(--accent)",
                  }}
                />
                ONE PROBLEM · UNDERSTOOD MORE DEEPLY
              </span>
              <h1
                className="animate-fade-up mt-7 max-w-xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-fg sm:text-6xl sm:leading-[1.02]"
                style={{ animationDelay: "80ms" }}
              >
                Understand the problems that shape your life.
              </h1>
              <p
                className="animate-fade-up mt-6 max-w-2xl text-lg text-fg-muted"
                style={{ animationDelay: "160ms" }}
              >
                1section turns real-life problems into deep, practical
                understanding. We look beyond familiar advice to explore why a
                problem happens, so you can think through what it means for you.
              </p>
              <div
                className="animate-fade-up mt-9 flex flex-wrap items-center gap-3"
                style={{ animationDelay: "240ms" }}
              >
                <a
                  href="#niches"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-fg transition hover:opacity-90"
                >
                  Explore real-life problems
                  <span aria-hidden>→</span>
                </a>
              </div>
            </div>

            <aside
              aria-label="Latest guides"
              className="animate-fade-up mx-auto w-full max-w-xl lg:ml-auto lg:mr-0 lg:max-w-lg"
              style={{ animationDelay: "180ms" }}
            >
              <div className="flex items-end justify-between gap-4 border-b border-fg/20 pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fg-muted sm:text-xs">
                    Recently published
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                    Latest guides
                  </h2>
                </div>
                <span className="pb-1 text-xs text-fg-muted">
                  One problem, explored in depth
                </span>
              </div>

              {latestProducts.length > 0 ? (
                <ul>
                  {latestProducts.map(({ product, niche }, index) => (
                    <li key={product.id} className="border-b border-border">
                      <a
                        href={resourceUrl(niche.slug, product.slug)}
                        className="group block py-5 transition-colors hover:bg-surface-muted/60 sm:py-6"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-2 text-xs font-medium text-fg-muted">
                            <span
                              className="size-1.5 rounded-full"
                              style={{
                                backgroundColor: niche.accentColor,
                              }}
                            />
                            {niche.name}
                          </span>
                          <span className="text-xs tabular-nums text-fg-muted">
                            0{index + 1}
                          </span>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold tracking-tight text-fg transition group-hover:translate-x-0.5 sm:text-xl">
                          {product.name}
                        </h3>
                        <div className="mt-3 flex items-center justify-between gap-4">
                          <p className="line-clamp-2 max-w-sm text-sm leading-6 text-fg-muted">
                            {product.summary ??
                              product.outcome ??
                              "A focused guide to understanding a real-life problem."}
                          </p>
                          <span className="shrink-0 text-sm font-semibold text-fg">
                            {formatCurrency(
                              product.priceAmount,
                              product.currency,
                            )}
                          </span>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-b border-border py-8 text-sm text-fg-muted">
                  New guides will appear here as they are published.
                </p>
              )}
            </aside>
          </div>
        </section>

        <section className="w-full border-b border-dashed border-fg/30 bg-surface-muted/50">
          <div className="mx-auto w-full max-w-6xl border-x border-dashed border-fg/30 px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
                What 1section is here to do
              </p>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
                Not another list of things you “should” do.
              </h2>
              <p className="mt-4 text-sm leading-7 text-fg-muted sm:text-base">
                Knowing the advice is not the same as understanding why a
                situation keeps happening. We make space to examine the causes,
                the context, and what they may mean for the choices in front of
                you.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Start with a real problem",
                  text: "Begin with a situation people recognize—not a subject label or a promise.",
                },
                {
                  number: "02",
                  title: "Look beneath the surface",
                  text: "Explore the factors and patterns that can shape why it happens.",
                },
                {
                  number: "03",
                  title: "Make your own sense of it",
                  text: "Build understanding that can inform your decisions, without a one-size-fits-all prescription.",
                },
              ].map((principle) => (
                <div
                  key={principle.number}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <span className="text-xs font-semibold tracking-[0.16em] text-fg-muted">
                    {principle.number}
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-fg">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-fg-muted">
                    {principle.text}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-xs leading-5 text-fg-muted">
              Our guides offer education and perspective—not guaranteed
              outcomes or a substitute for advice tailored to your situation.
            </p>
          </div>
        </section>

        <section id="niches">
          <div className="w-full border-b border-dashed border-fg/30">
            <div className="mx-auto w-full max-w-6xl border-x border-dashed border-fg/30 px-4 pb-8 pt-20 sm:px-6 sm:pb-12 sm:pt-28">
              <div className="grid gap-6 border-b border-border pb-8 sm:pb-10 lg:grid-cols-[1fr_0.7fr] lg:items-end lg:gap-12">
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
          </div>

          <div>
            {list.length === 0 ? (
              <div className="w-full border-b border-dashed border-fg/30">
                <div className="mx-auto w-full max-w-6xl border-x border-dashed border-fg/30 px-4 py-12 sm:px-6">
                  <p className="rounded-3xl border border-dashed border-fg/30 bg-surface-muted/50 p-10 text-center text-sm text-fg-muted">
                    No problem areas are published yet.
                  </p>
                </div>
              </div>
            ) : (
              list.map((niche, index) => (
                <NicheSection
                  key={niche.id}
                  niche={niche}
                  index={index}
                  reversed={index % 2 === 1}
                />
              ))
            )}
          </div>
        </section>
      </main>

      <SiteFooter niches={niches} />
    </div>
  );
}

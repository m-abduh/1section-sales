import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { BuyButton } from "@/components/site/buy-button";
import { ProductCover } from "@/components/site/product-cover";
import { getNiches, getProduct } from "@/lib/server-api";
import { nicheUrl } from "@/lib/site";
import { formatCurrency } from "@/lib/format";
import { LEARNING_LEVEL_LABEL } from "@/lib/types";

export const revalidate = 30;

interface ResourcePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Resource not found" };
  return { title: product.name, description: product.summary ?? product.outcome ?? undefined };
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 p-6 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:p-7 ${className}`}>
      {children}
    </section>
  );
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug } = await params;
  const [product, niches] = await Promise.all([getProduct(slug), getNiches()]);

  if (!product) notFound();

  const isFree = product.priceAmount === 0;
  const accent = product.niche?.accentColor ?? "#6366f1";
  const hasDiscount = product.compareAtAmount != null && product.compareAtAmount > product.priceAmount;
  const discountPercent = hasDiscount
    ? Math.round((((product.compareAtAmount as number) - product.priceAmount) / (product.compareAtAmount as number)) * 100)
    : 0;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f6f7fb] text-[#0f172a] selection:bg-indigo-500/20 selection:text-indigo-700 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif] dark:bg-[#121318] dark:text-[#e3e1e9] dark:selection:bg-[#d0bcff]/20 dark:selection:text-[#d0bcff]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="pointer-events-none fixed -top-24 left-1/2 z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-[100px] dark:bg-[#d0bcff]/10" />
      <div className="pointer-events-none fixed -right-20 bottom-20 z-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-[90px] dark:bg-[#4edea3]/10" />

      <SiteHeader niches={niches ?? []} currentNicheName={product.niche?.name} />

      <main className="relative z-10 flex-1 pb-12 pt-16 sm:pb-16">
        <section className="mx-auto w-full max-w-6xl px-5 pt-8 md:px-8 md:pt-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-x-10">
            <div className="min-w-0">
              <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-[#cbc3d7]">
                {product.niche ? (
                  <>
                    <Link href={nicheUrl(product.niche.slug)} className="transition hover:text-slate-900 dark:hover:text-[#e3e1e9]">{product.niche.name}</Link>
                    <span className="text-slate-400 dark:text-[#958ea0]">/</span>
                  </>
                ) : null}
                <span className="text-slate-900 dark:text-[#e3e1e9]">{product.name}</span>
              </nav>

              <div className="mt-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#292a2f]/60 dark:text-[#cbc3d7]">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: accent }} />
                  {product.niche?.name ? `${product.niche.name} · ` : ""}{LEARNING_LEVEL_LABEL[product.level]}
                </span>
                <h1 className="mt-5 max-w-3xl text-balance text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-slate-900 dark:text-[#e3e1e9] sm:text-5xl sm:leading-[1.05]">{product.name}</h1>
                {product.summary ? <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-lg sm:leading-8">{product.summary}</p> : null}
              </div>

              <div className="mt-10 flex flex-col gap-5 sm:gap-6">
                {product.outcome ? (
                  <Card>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-[#d0bcff]">What you walk away with</p>
                    <p className="mt-3 max-w-2xl text-[15px] font-medium leading-7 text-slate-800 dark:text-[#e3e1e9] sm:text-base">{product.outcome}</p>
                  </Card>
                ) : null}

                {product.learnings.length > 0 ? (
                  <Card>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-[#d0bcff]">What you will learn</p>
                        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-[#e3e1e9] sm:text-2xl">Key takeaways</h2>
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-[#958ea0]">{product.learnings.length} points</span>
                    </div>
                    <ul className="mt-5 flex flex-col gap-3">
                      {product.learnings.map((item) => (
                        <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/60 px-4 py-3 text-sm leading-7 text-slate-700 dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 dark:text-[#cbc3d7] sm:text-[15px]">
                          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-600 dark:bg-[#00a572]/30 dark:text-[#4edea3]">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : null}

                {product.description || product.features.length > 0 ? (
                  <Card>
                    {product.description ? (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-[#d0bcff]">Overview</p>
                        <p className="mt-3 max-w-2xl whitespace-pre-line text-[15px] leading-8 text-slate-600 dark:text-[#cbc3d7] sm:text-base">{product.description}</p>
                      </div>
                    ) : null}
                    {product.features.length > 0 ? (
                      <div className={product.description ? "mt-7 border-t border-slate-200/80 pt-6 dark:border-[#34343a]/40" : ""}>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-[#d0bcff]">What is included</p>
                            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-[#e3e1e9] sm:text-2xl">Inside this guide</h2>
                          </div>
                          <span className="text-xs font-medium text-slate-500 dark:text-[#958ea0]">{product.features.length} items</span>
                        </div>
                        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                          {product.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 text-sm leading-6 text-slate-700 dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 dark:text-[#cbc3d7]">
                              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white text-[11px] text-slate-500 shadow-sm ring-1 ring-slate-200/70 dark:bg-[#34343a]/60 dark:text-[#cbc3d7] dark:ring-white/10">•</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </Card>
                ) : null}

                {product.audience || product.notFor ? (
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    {product.audience ? (
                      <section className="rounded-3xl border border-slate-200/80 bg-white/60 p-6 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-[#4edea3]">Who this is for</p>
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-[15px]">{product.audience}</p>
                      </section>
                    ) : null}
                    {product.notFor ? (
                      <section className="rounded-3xl border border-slate-200/80 bg-white/60 p-6 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-[#958ea0]">Who this is not for</p>
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-[15px]">{product.notFor}</p>
                      </section>
                    ) : null}
                  </div>
                ) : null}

                {product.limitations ? (
                  <section className="rounded-3xl border border-slate-200/80 bg-white/50 p-5 backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#1a1b21]/50 sm:p-6">
                    <p className="text-sm leading-7 text-slate-600 dark:text-[#cbc3d7]"><span className="font-semibold text-slate-800 dark:text-[#e3e1e9]">Limitations: </span>{product.limitations}</p>
                  </section>
                ) : null}
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 p-5 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:p-6">
                <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full blur-[80px]" style={{ backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)` }} />
                <div className="relative">
                  {product.coverImage ? (
                    <div className="mt-4">
                      <ProductCover
                        src={product.coverImage}
                        alt={product.name}
                        sizes="(min-width: 1024px) 340px, 90vw"
                      />
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-[#e3e1e9] sm:text-4xl">{isFree ? "Free" : formatCurrency(product.priceAmount, product.currency)}</span>
                      {hasDiscount && discountPercent > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-[#00a572] dark:text-[#00311f]">Save {discountPercent}%</span>
                      ) : null}
                    </div>
                    {hasDiscount ? (
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="text-slate-400 line-through dark:text-[#494454]">{formatCurrency(product.compareAtAmount as number, product.currency)}</span>
                        <span className="font-medium text-emerald-600 dark:text-[#4edea3]">{isFree ? "Free access" : `You save ${formatCurrency((product.compareAtAmount as number) - product.priceAmount, product.currency)}`}</span>
                      </div>
                    ) : null}
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#cbc3d7]">{isFree ? "Free access · lifetime access" : "One-time payment · lifetime access"}</p>
                  </div>

                  <div className="mt-5">
                    {product.active ? (
                      <BuyButton product={product} label="Buy and get instant access" />
                    ) : (
                      <p className="rounded-xl border border-slate-200/80 bg-slate-100/60 px-4 py-3 text-center text-sm text-slate-600 dark:border-[#34343a]/40 dark:bg-[#292a2f]/50 dark:text-[#cbc3d7]">Currently unavailable</p>
                    )}
                  </div>

                  {product.files.length > 0 ? (
                    <div className="mt-5 border-t border-slate-200/80 pt-5 dark:border-[#34343a]/40">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-[#958ea0]">Included files</h3>
                      <ul className="mt-3 space-y-2.5 text-sm text-slate-600 dark:text-[#cbc3d7]">
                        {product.files.map((file) => (
                          <li key={file.id} className="flex items-start gap-2.5">
                            <span className="mt-0.5 text-xs">📄</span>
                            <span className="break-words leading-6">{file.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {product.license ? (
                    <div className="mt-5 border-t border-slate-200/80 pt-5 dark:border-[#34343a]/40">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-[#958ea0]">License</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-[#cbc3d7]">{product.license}</p>
                    </div>
                  ) : null}

                  <p className="mt-5 text-xs leading-5 text-slate-500 dark:text-[#958ea0]">Secure checkout via Paddle · Instant access after payment</p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter niches={niches ?? []} />
    </div>
  );
}

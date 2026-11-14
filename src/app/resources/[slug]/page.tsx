import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { BuyButton } from "@/components/site/buy-button";
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

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/50 p-5 backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 sm:p-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-[#958ea0]">{title}</h2>
      <div className="mt-3">{children}</div>
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
    ? Math.round(((product.compareAtAmount as number) - product.priceAmount) / (product.compareAtAmount as number) * 100)
    : 0;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f6f7fb] text-slate-900 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif] dark:bg-[#121318] dark:text-[#e3e1e9]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="pointer-events-none fixed -top-24 left-1/2 z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-[100px] dark:bg-[#d0bcff]/10" />
      <div className="pointer-events-none fixed -right-20 bottom-20 z-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-[90px] dark:bg-[#4edea3]/10" />

      <SiteHeader niches={niches ?? []} currentNicheName={product.niche?.name} />

      <main className="relative z-10 flex-1 pt-16">
        <section className="mx-auto w-full max-w-6xl px-5 pt-6 md:px-8 md:pt-8">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 px-5 py-6 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:px-8 sm:py-8 lg:py-10">
              <div aria-hidden className="pointer-events-none absolute -top-20 -left-12 h-56 w-56 rounded-full blur-[90px]" style={{ backgroundColor: `color-mix(in srgb, ${accent} 20%, transparent)` }} />
              <div className="relative">
                <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-[#cbc3d7]">
                  {product.niche ? (
                    <>
                      <Link href={nicheUrl(product.niche.slug)} className="rounded-full bg-slate-100/70 px-2.5 py-1 transition hover:text-slate-900 dark:bg-[#292a2f]/60 dark:hover:text-[#e3e1e9]">{product.niche.name}</Link>
                      <span className="text-slate-400 dark:text-[#958ea0]">/</span>
                    </>
                  ) : null}
                  <span className="text-slate-900 dark:text-[#e3e1e9]">{product.name}</span>
                </nav>

                <div className="mt-6 border-b border-slate-200/80 pb-8 dark:border-[#34343a]/40 sm:pb-10">
                  <p className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:border-[#34343a]/40 dark:bg-[#292a2f]/60 dark:text-[#cbc3d7]">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: accent }} />
                    {product.niche?.name ? `${product.niche.name} · ` : ""}{LEARNING_LEVEL_LABEL[product.level]}
                  </p>
                  <h1 className="mt-4 max-w-3xl text-balance text-[32px] font-bold leading-[1.08] tracking-[-0.025em] text-slate-900 dark:text-[#e3e1e9] sm:text-[40px] sm:leading-[1.06]">{product.name}</h1>
                  {product.summary ? <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-lg sm:leading-8">{product.summary}</p> : null}
                </div>

                <div className="mt-6 space-y-4 sm:space-y-5">
                  {product.outcome ? (
                    <DetailBlock title="What you walk away with">
                      <p className="max-w-2xl text-base leading-7 text-slate-800 dark:text-[#e3e1e9] sm:text-lg sm:leading-8">{product.outcome}</p>
                    </DetailBlock>
                  ) : null}

                  {product.learnings.length > 0 ? (
                    <DetailBlock title="What you will learn">
                      <ul className="space-y-3">
                        {product.learnings.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-[#cbc3d7] sm:text-base sm:leading-7">
                            <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:bg-[#00a572]/30 dark:text-[#4edea3]">✓</span>
                            <span className="max-w-2xl">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </DetailBlock>
                  ) : null}

                  {product.description ? (
                    <DetailBlock title="Overview">
                      <p className="max-w-2xl whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-base sm:leading-8">{product.description}</p>
                    </DetailBlock>
                  ) : null}

                  {product.features.length > 0 ? (
                    <DetailBlock title="What is included">
                      <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                        {product.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-[#cbc3d7] sm:text-base">
                            <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:bg-[#00a572]/30 dark:text-[#4edea3]">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </DetailBlock>
                  ) : null}

                  {product.audience || product.notFor ? (
                    <section className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white/50 p-5 backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 sm:grid-cols-2 sm:gap-6 sm:p-6">
                      {product.audience ? (
                        <div className="rounded-2xl bg-slate-100/60 p-4 dark:bg-[#1a1b21]/50 sm:p-5">
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-[#958ea0]">Who this is for</h3>
                          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-base">{product.audience}</p>
                        </div>
                      ) : null}
                      {product.notFor ? (
                        <div className="rounded-2xl bg-slate-100/60 p-4 dark:bg-[#1a1b21]/50 sm:p-5">
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-[#958ea0]">Who this is not for</h3>
                          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-base">{product.notFor}</p>
                        </div>
                      ) : null}
                    </section>
                  ) : null}

                  {product.limitations ? (
                    <DetailBlock title="Limitations">
                      <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-[#cbc3d7] sm:text-base">{product.limitations}</p>
                    </DetailBlock>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/60 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-[#958ea0]">{isFree ? "Free guide" : "One-time purchase"}</p>

                {product.coverImage ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/70 shadow-sm dark:border-white/10">
                    <Image src={product.coverImage} alt={product.name} width={1200} height={1500} sizes="(min-width: 1024px) 360px, 90vw" className="block h-auto w-full" />
                  </div>
                ) : null}

                <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-100/50 p-4 dark:border-[#34343a]/40 dark:bg-[#1a1b21]/60 sm:p-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-[#e3e1e9] sm:text-4xl">{isFree ? "Free" : formatCurrency(product.priceAmount, product.currency)}</span>
                    {hasDiscount && discountPercent > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-[#00a572] dark:text-[#00311f]">Save {discountPercent}%</span>
                    ) : null}
                  </div>
                  {hasDiscount ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="text-slate-400 line-through dark:text-[#494454]">{formatCurrency(product.compareAtAmount as number, product.currency)}</span>
                      <span className="font-medium text-emerald-600 dark:text-[#4edea3]">{isFree ? "Free access" : `You save ${formatCurrency((product.compareAtAmount as number) - product.priceAmount, product.currency)}`}</span>
                    </div>
                  ) : null}
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#cbc3d7]">{isFree ? "Free access · lifetime access" : "One-time payment · lifetime access"}</p>
                  <div className="mt-5">
                    {product.active ? (
                      <BuyButton product={product} label="Buy and get instant access" />
                    ) : (
                      <p className="rounded-xl border border-slate-200/80 bg-slate-100/60 px-4 py-3 text-center text-sm text-slate-600 dark:border-[#34343a]/40 dark:bg-[#292a2f]/50 dark:text-[#cbc3d7]">Currently unavailable</p>
                    )}
                  </div>
                </div>

                {product.files.length > 0 ? (
                  <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-100/40 p-4 dark:border-[#34343a]/40 dark:bg-[#292a2f]/30 sm:p-5">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-[#958ea0]">Included files</h3>
                    <ul className="mt-3 space-y-2.5 text-sm text-slate-600 dark:text-[#cbc3d7]">
                      {product.files.map((file) => (
                        <li key={file.id} className="flex items-start gap-2.5 rounded-xl bg-white/60 px-3 py-2 dark:bg-[#1a1b21]/50">
                          <span className="mt-0.5 text-xs">📄</span>
                          <span className="break-words leading-6">{file.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {product.license ? (
                  <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-100/40 p-4 dark:border-[#34343a]/40 dark:bg-[#292a2f]/30 sm:p-5">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-[#958ea0]">License</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-[#cbc3d7]">{product.license}</p>
                  </div>
                ) : null}

                <div className="mt-5 rounded-2xl bg-slate-100/60 px-4 py-3 dark:bg-[#292a2f]/40">
                  <p className="text-xs leading-5 text-slate-500 dark:text-[#958ea0]">Secure checkout via Paddle · Instant access after payment</p>
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

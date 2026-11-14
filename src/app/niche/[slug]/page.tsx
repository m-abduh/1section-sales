import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ProductCover } from "@/components/site/product-cover";
import { getNiche, getNiches } from "@/lib/server-api";
import { nicheUrl } from "@/lib/site";
import { socialLinks } from "@/lib/site";
import { formatCurrency } from "@/lib/format";
import { LEARNING_LEVEL_LABEL } from "@/lib/types";
import { resourceUrl } from "@/lib/site";

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

const TIKTOK_PATH =
  "M16.5 3c.4 2.3 1.9 3.9 4.2 4.1v2.8c-1.4.1-2.8-.3-4.1-1v5.9c0 3.8-3 6.2-6.3 5.5-2.6-.6-4.4-3-4.1-5.7.3-2.5 2.5-4.5 5.1-4.4.3 0 .6 0 .9.1v2.9c-.3-.1-.6-.2-.9-.2-1.2 0-2.1 1-2.1 2.2 0 1.1.9 2 2 2.1 1.2.1 2.3-.9 2.3-2.2V3h2.9Z";

function SocialIcon({ platform }: { platform: "YouTube" | "Instagram" | "TikTok" }) {
  const className = "h-[18px] w-[18px] shrink-0";
  if (platform === "YouTube") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path
          fill="#FF0000"
          d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z"
        />
      </svg>
    );
  }
  if (platform === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <defs>
          <linearGradient id="ig-brand-niche" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="35%" stopColor="#DD2A7B" />
            <stop offset="65%" stopColor="#8134AF" />
            <stop offset="100%" stopColor="#515BD4" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-brand-niche)" />
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
        <circle cx="17.3" cy="6.7" r="1.2" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d={TIKTOK_PATH} fill="#25F4EE" transform="translate(-0.7,-0.7)" />
      <path d={TIKTOK_PATH} fill="#FE2C55" transform="translate(0.7,0.7)" />
      <path d={TIKTOK_PATH} fill="currentColor" />
    </svg>
  );
}

export default async function NichePage({ params }: NichePageProps) {
  const { slug } = await params;
  const [niche, niches] = await Promise.all([getNiche(slug), getNiches()]);

  if (!niche) {
    notFound();
  }

  const allNiches = niches ?? [];
  const socials = socialLinks(niche.slug);
  const products = niche.products ?? [];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f6f7fb] text-[#0f172a] selection:bg-indigo-500/20 selection:text-indigo-700 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif] dark:bg-[#121318] dark:text-[#e3e1e9] dark:selection:bg-[#d0bcff]/20 dark:selection:text-[#d0bcff]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />

      <div className="pointer-events-none fixed -top-24 left-1/2 z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-[100px] dark:bg-[#d0bcff]/10" />
      <div className="pointer-events-none fixed -right-20 bottom-20 z-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-[90px] dark:bg-[#4edea3]/10" />

      <SiteHeader niches={allNiches} currentNicheName={niche.name} currentNicheSlug={niche.slug} />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-transparent pb-16 pt-16">
        <div className="flex w-full flex-col gap-12 px-5 md:gap-14 md:px-8 lg:gap-16">
          <section className="relative mt-2 flex flex-col items-center overflow-hidden rounded-3xl border border-slate-200/80 dark:border-[#34343a]/40 bg-white/60 dark:bg-[#1e1f25]/50 p-6 pb-6 pt-8 text-center shadow-xl backdrop-blur-2xl md:mt-4 md:p-10 md:pt-10 lg:mt-6 lg:p-12 lg:pt-14">
            <div className="pointer-events-none absolute -top-24 left-1/2 z-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#d0bcff]/10 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 z-0 h-52 w-52 rounded-full bg-[#4edea3]/10 blur-[70px]" />
            <div className="relative z-10 flex w-full flex-col items-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-[#292a2f]/80 px-3.5 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-xl">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 dark:bg-[#4edea3] shadow-[0_0_8px_#4edea3]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-900 dark:text-[#e3e1e9]">1SECTION / {niche.name.toUpperCase()}</span>
              </div>
              <h1 className="mb-3 max-w-[360px] text-[32px] font-bold leading-[40px] tracking-[-0.025em] text-slate-900 dark:text-[#e3e1e9] md:max-w-2xl md:text-[36px] md:leading-[44px] lg:max-w-3xl lg:text-[40px] lg:leading-[48px] lg:tracking-[-0.03em]">
                {niche.tagline ?? `Navigate uncertainty in ${niche.name.toLowerCase()}.`}
              </h1>
              <p className="mb-8 max-w-[340px] text-[15px] leading-[24px] text-slate-600 dark:text-[#cbc3d7] md:max-w-xl md:text-[16px] md:leading-[26px] lg:max-w-2xl lg:text-[17px] lg:leading-[27px] lg:tracking-[-0.005em]">
                {niche.description ?? `Practical guides for the real-life situations people face in ${niche.name.toLowerCase()}.`}
              </p>
              <a className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-[14px] font-bold leading-[20px] text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 dark:bg-white dark:text-[#0d0e13] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] dark:hover:bg-neutral-100 active:scale-95" href="#guides">
                <span>Explore the guides</span>
                <span className="material-symbols-outlined text-[14px] leading-none text-current transition-transform group-hover:translate-y-0.5">arrow_downward</span>
              </a>

              <div className="mt-8 flex w-full flex-col items-center gap-3 border-t border-slate-200/80 dark:border-[#34343a]/40 pt-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-slate-500 dark:text-[#958ea0]">podcasts</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#958ea0]">FOLLOW {niche.name.toUpperCase()}</span>
                </div>
                <div className="flex w-full max-w-[360px] flex-col gap-2">
                  {socials.map((social) => (
                    <a key={social.platform} className="group flex w-full items-center justify-between rounded-2xl border border-slate-200/80 dark:border-[#34343a]/40 bg-slate-100/70 dark:bg-[#292a2f]/60 px-4 py-2 text-slate-600 dark:text-[#cbc3d7] shadow-inner transition-all hover:bg-[#292a2f] hover:text-slate-900 dark:text-[#e3e1e9]" href={social.url} target="_blank" rel="noreferrer">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-[#34343a]">
                          <SocialIcon platform={social.platform} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#958ea0]">{social.platform}</span>
                          <span className="text-[12px] font-semibold leading-[16px] tracking-[0.01em] text-slate-900 dark:text-[#e3e1e9]">@{social.handle}</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined shrink-0 text-[15px] text-slate-500 dark:text-[#958ea0] transition-colors group-hover:text-slate-900 dark:text-[#e3e1e9]">north_east</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="flex scroll-mt-20 flex-col gap-6" id="guides">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-[#d0bcff]">THE GUIDE COLLECTION</span>
              <h2 className="text-[28px] font-bold leading-[36px] tracking-[-0.02em] text-slate-900 dark:text-[#e3e1e9]">One problem at a time.</h2>
              <p className="text-[13px] leading-[20px] tracking-[0.005em] text-slate-600 dark:text-[#cbc3d7]">
                Focused guides that take the time to explain what may be behind a situation. One-time purchase; access follows confirmed payment.
              </p>
            </div>

            {products.length === 0 ? (
              <div className="rounded-3xl border border-slate-200/80 dark:border-[#34343a]/40 bg-white/60 dark:bg-[#1e1f25]/50 p-8 text-center text-[13px] text-slate-600 dark:text-[#cbc3d7] backdrop-blur-2xl">
                The first guides for this area are being prepared.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {products.map((product, index) => {
                  const isFree = product.priceAmount === 0;
                  const hasDiscount = product.compareAtAmount != null && product.compareAtAmount > product.priceAmount;
                  const discountPercent = hasDiscount
                    ? Math.round((((product.compareAtAmount as number) - product.priceAmount) / (product.compareAtAmount as number)) * 100)
                    : 0;
                  const learnings = (product.learnings ?? []).slice(0, 3);
                  const number = String(index + 1).padStart(2, "0");
                  return (
                    <div key={product.id} className="relative grid grid-cols-1 gap-6 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-[#34343a]/40 bg-white/70 dark:bg-[#1e1f25]/60 p-6 shadow-xl backdrop-blur-2xl md:grid-cols-[0.95fr_1.25fr] md:p-7 lg:grid-cols-[0.85fr_1.35fr_0.8fr] lg:items-stretch lg:gap-6 lg:p-6">
                      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#d0bcff]/10 blur-[50px]" />

                      <div className="md:aspect-auto md:min-h-[320px] lg:min-h-0">
                        <ProductCover
                          src={product.coverImage}
                          alt={product.name}
                          fallback={number}
                          sizes="(min-width: 1024px) 420px, 90vw"
                          className="md:aspect-auto md:h-full lg:aspect-square"
                        />
                      </div>

                      <div className="relative flex flex-col gap-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-200 dark:bg-[#34343a] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-[#cbc3d7]">GUIDE {number}</span>
                          <span className="rounded-full bg-slate-200 dark:bg-[#34343a] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-[#cbc3d7]">{LEARNING_LEVEL_LABEL[product.level]}</span>
                          {isFree ? (
                            <span className="rounded-full bg-emerald-500 dark:bg-[#00a572] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white dark:text-[#00311f]">FREE</span>
                          ) : hasDiscount ? (
                            <span className="rounded-full bg-emerald-500 dark:bg-[#00a572] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white dark:text-[#00311f]">SAVE {discountPercent}%</span>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-1">
                          <h3 className="text-[22px] font-semibold leading-[30px] tracking-[-0.015em] text-slate-900 dark:text-[#e3e1e9] lg:text-[28px] lg:leading-[36px] lg:tracking-[-0.02em]">{product.name}</h3>
                          <p className="text-[15px] leading-[24px] text-slate-600 dark:text-[#cbc3d7]">
                            {product.outcome ?? product.summary ?? "A focused guide to understanding a real-life problem."}
                          </p>
                        </div>

                        {learnings.length > 0 ? (
                          <div className="flex flex-col gap-3 pt-0.5">
                            {learnings.map((item) => (
                              <div key={item} className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 dark:bg-[#00a572]/30 text-emerald-600 dark:text-[#4edea3]">
                                  <span className="material-symbols-outlined text-[14px]">check</span>
                                </div>
                                <span className="text-[13px] leading-[20px] tracking-[0.005em] text-slate-900 dark:text-[#e3e1e9]">{item}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="relative flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-[#34343a]/40 bg-slate-100/70 dark:bg-[#1a1b21]/60 p-4 md:col-span-2 lg:col-span-1 lg:border-0 lg:border-l lg:border-slate-200/80 dark:border-[#34343a]/40 lg:bg-transparent lg:p-0 lg:pl-6 lg:rounded-none">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#958ea0]">{isFree ? "FREE GUIDE" : "ONE-TIME PURCHASE"}</span>
                            {hasDiscount ? <span className="shrink-0 rounded-full bg-emerald-500 dark:bg-[#00a572] px-2 py-0.5 text-[11px] font-bold text-white dark:text-[#00311f]">SAVE {discountPercent}%</span> : null}
                          </div>
                          <div className="mt-1 flex flex-wrap items-baseline gap-2">
                            <span className="text-[28px] font-bold leading-[36px] tracking-[-0.02em] text-slate-900 dark:text-[#e3e1e9]">{isFree ? "Free" : formatCurrency(product.priceAmount, product.currency)}</span>
                            {hasDiscount ? <span className="text-[18px] font-semibold leading-[26px] tracking-[-0.01em] text-slate-400 dark:text-[#494454] line-through">{formatCurrency(product.compareAtAmount as number, product.currency)}</span> : null}
                          </div>
                          <span className="text-[12px] font-medium leading-[16px] tracking-[0.01em] text-slate-600 dark:text-[#cbc3d7]">{isFree ? "Free access — no payment required." : "Instant access after confirmed payment."}</span>
                        </div>

                        <div className="flex flex-col gap-3">
                          <Link href={resourceUrl(niche.slug, product.slug)} className="group flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/70 dark:bg-[#292a2f]/80 px-6 py-4 text-center text-[14px] font-semibold leading-[20px] text-slate-900 dark:text-[#e3e1e9] shadow-lg shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-xl transition-all hover:bg-[#292a2f] active:scale-[0.98]">
                            <span>View guide</span>
                            <span className="material-symbols-outlined text-[18px] text-slate-900 dark:text-[#e3e1e9] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                          </Link>
                          <div className="flex items-center justify-center gap-1 text-[12px] font-medium leading-[16px] tracking-[0.01em] text-slate-500 dark:text-[#958ea0]">
                            <span className="material-symbols-outlined text-[14px]">lock</span>
                            <span>{(product.files?.length ?? 0) > 0 ? `${product.files?.length} file${product.files?.length === 1 ? "" : "s"} included` : "Immediate direct download"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-6 pb-8">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-[#4edea3]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-[#4edea3]">PROBLEMS PORTFOLIO</span>
              </div>
              <h2 className="text-[28px] font-bold leading-[36px] tracking-[-0.02em] text-slate-900 dark:text-[#e3e1e9]">The problems that shape our lives</h2>
              <p className="text-[13px] leading-[20px] tracking-[0.005em] text-slate-600 dark:text-[#cbc3d7]">Understand what is happening. Consider what it means for you.</p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-5">
              {allNiches.map((item) => {
                const active = item.slug === niche.slug;
                return (
                  <Link
                    key={item.id}
                    href={nicheUrl(item.slug)}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-md backdrop-blur-xl transition-all ${
                      active
                        ? "bg-slate-100/70 dark:bg-[#292a2f]/60"
                        : "bg-white/60 dark:bg-[#1e1f25]/50 shadow-sm hover:-translate-y-0.5 hover:bg-slate-100/60 dark:bg-[#292a2f]/50"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`material-symbols-outlined text-[22px] ${active ? "text-indigo-600 dark:text-[#d0bcff]" : "text-slate-500 dark:text-[#958ea0]"}`}>interests</span>
                      {active ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 dark:bg-[#00a572]/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-[#4edea3]">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-[#4edea3]" />
                          <span>ACTIVE</span>
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[14px] leading-[20px] ${active ? "font-bold text-slate-900 dark:text-[#e3e1e9]" : "font-semibold text-slate-900 dark:text-[#e3e1e9]"}`}>{item.name}</span>
                      <span className="truncate text-[12px] font-medium leading-[16px] tracking-[0.01em] text-slate-500 dark:text-[#958ea0]">{item.tagline ?? (active ? "Active Space" : item.slug)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter niches={allNiches} />
    </div>
  );
}

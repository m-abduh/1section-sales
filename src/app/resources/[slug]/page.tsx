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

export async function generateMetadata({
  params,
}: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: "Resource not found" };
  }
  return {
    title: product.name,
    description: product.summary ?? product.outcome ?? undefined,
  };
}

function DetailBlock({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`py-7 sm:py-8 ${className}`}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug } = await params;
  const [product, niches] = await Promise.all([getProduct(slug), getNiches()]);

  if (!product) {
    notFound();
  }

  const isFree = product.priceAmount === 0;
  const accentColor = product.niche?.accentColor;
  const hasDiscount =
    product.compareAtAmount != null &&
    product.compareAtAmount > product.priceAmount;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtAmount as number) - product.priceAmount) /
          (product.compareAtAmount as number) *
          100,
      )
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader
        niches={niches ?? []}
        currentNicheName={product.niche?.name}
      />

      <main className="flex-1">
        <section className="w-full border-b border-dashed border-fg/30">
          <div className="mx-auto grid w-full max-w-6xl border-x border-dashed border-fg/30 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="min-w-0 px-4 sm:px-8 lg:border-r lg:border-dashed lg:border-fg/30">
              <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 py-5 text-sm text-fg-muted">
                {product.niche ? (
                  <>
                    <Link
                      href={nicheUrl(product.niche.slug)}
                      className="transition hover:text-fg"
                    >
                      {product.niche.name}
                    </Link>
                    <span className="text-fg-muted/40">/</span>
                  </>
                ) : null}
                <span className="text-fg">{product.name}</span>
              </nav>

              <div className="pb-10 pt-2 sm:pb-14 sm:pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted sm:text-xs">
                  {product.niche?.name ? `${product.niche.name} · ` : ""}
                  {LEARNING_LEVEL_LABEL[product.level]}
                </p>
                <h1 className="mt-4 max-w-3xl text-balance text-3xl font-bold leading-[1.1] tracking-tight text-fg sm:text-5xl sm:leading-[1.08]">
                  {product.name}
                </h1>
                {product.summary ? (
                  <p className="mt-5 max-w-2xl text-base leading-7 text-fg-muted sm:text-lg sm:leading-8">
                    {product.summary}
                  </p>
                ) : null}
              </div>

              <div className="border-t border-fg/20">
                <div className="divide-y divide-fg/20">
                  {product.outcome ? (
                    <DetailBlock title="What you walk away with">
                      <p className="max-w-2xl text-base leading-7 text-fg sm:text-lg sm:leading-8">
                        {product.outcome}
                      </p>
                    </DetailBlock>
                  ) : null}

                  {product.learnings.length > 0 ? (
                    <DetailBlock title="What you will learn">
                      <ul className="space-y-3">
                        {product.learnings.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-3 text-sm leading-6 text-fg-muted sm:text-base sm:leading-7"
                          >
                            <span
                              className="mt-1 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                              style={{
                                backgroundColor: accentColor
                                  ? `color-mix(in srgb, ${accentColor} 16%, var(--surface-muted))`
                                  : "var(--surface-muted)",
                                color: accentColor ?? "var(--fg)",
                              }}
                            >
                              ✓
                            </span>
                            <span className="max-w-2xl">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </DetailBlock>
                  ) : null}

                  {product.description ? (
                    <DetailBlock title="Overview">
                      <p className="max-w-2xl whitespace-pre-line text-sm leading-7 text-fg-muted sm:text-base sm:leading-8">
                        {product.description}
                      </p>
                    </DetailBlock>
                  ) : null}

                  {product.features.length > 0 ? (
                    <DetailBlock title="What is included">
                      <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                        {product.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-3 text-sm leading-6 text-fg-muted sm:text-base"
                          >
                            <span
                              className="mt-1 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                              style={{
                                backgroundColor: accentColor
                                  ? `color-mix(in srgb, ${accentColor} 16%, var(--surface-muted))`
                                  : "var(--surface-muted)",
                                color: accentColor ?? "var(--fg)",
                              }}
                            >
                              ✓
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </DetailBlock>
                  ) : null}

                  {product.audience || product.notFor ? (
                    <section className="py-8 sm:py-9">
                      <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
                        {product.audience ? (
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted">
                              Who this is for
                            </h3>
                            <p className="mt-3 max-w-xl text-sm leading-7 text-fg-muted sm:text-base">
                              {product.audience}
                            </p>
                          </div>
                        ) : null}
                        {product.notFor ? (
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted">
                              Who this is not for
                            </h3>
                            <p className="mt-3 max-w-xl text-sm leading-7 text-fg-muted sm:text-base">
                              {product.notFor}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  {product.limitations ? (
                    <DetailBlock title="Limitations" className="pb-10 sm:pb-12">
                      <p className="max-w-2xl text-sm leading-7 text-fg-muted sm:text-base">
                        {product.limitations}
                      </p>
                    </DetailBlock>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-20 lg:self-start">
              <div className="px-4 py-6 sm:px-6 sm:py-8 lg:py-8">
                <div className="lg:pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                    {isFree ? "Free guide" : "One-time purchase"}
                  </p>

                  {product.coverImage ? (
                    <div className="mt-4">
                      <Image
                        src={product.coverImage}
                        alt={product.name}
                        width={1200}
                        height={1500}
                        sizes="(min-width: 1024px) 360px, 90vw"
                        className="block h-auto w-full rounded-xl border border-fg/20 bg-surface shadow-sm"
                      />
                    </div>
                  ) : null}

                  <div className="mt-6 border-t border-fg/20 pt-6">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
                        {isFree
                          ? "Free"
                          : formatCurrency(product.priceAmount, product.currency)}
                      </span>
                      {hasDiscount && discountPercent > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                          Save {discountPercent}%
                        </span>
                      ) : null}
                    </div>
                    {hasDiscount ? (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="text-fg-muted line-through">
                          {formatCurrency(
                            product.compareAtAmount as number,
                            product.currency,
                          )}
                        </span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {isFree
                            ? "Free access"
                            : `You save ${formatCurrency(
                                (product.compareAtAmount as number) - product.priceAmount,
                                product.currency,
                              )}`}
                        </span>
                      </div>
                    ) : null}
                    <p className="mt-2 text-sm leading-6 text-fg-muted">
                      {isFree
                        ? "Free access · lifetime access"
                        : "One-time payment · lifetime access"}
                    </p>

                    <div className="mt-5">
                      {product.active ? (
                        <BuyButton
                          product={product}
                          label="Buy and get instant access"
                        />
                      ) : (
                        <p className="rounded-xl border border-fg/30 bg-surface-muted/50 px-4 py-3 text-center text-sm text-fg-muted">
                          Currently unavailable
                        </p>
                      )}
                    </div>
                  </div>

                  {product.files.length > 0 ? (
                    <div className="mt-6 border-t border-fg/20 pt-6">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted">
                        Included files
                      </h3>
                      <ul className="mt-3 space-y-2.5 text-sm text-fg-muted">
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
                    <div className="mt-6 border-t border-fg/20 pt-6">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted">
                        License
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-fg-muted">
                        {product.license}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-6 border-t border-fg/20 pt-5">
                    <p className="text-xs leading-5 text-fg-muted">
                      Secure checkout via Paddle · Instant access after payment
                    </p>
                  </div>
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

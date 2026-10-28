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

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug } = await params;
  const [product, niches] = await Promise.all([getProduct(slug), getNiches()]);

  if (!product) {
    notFound();
  }

  const isFree = product.priceAmount === 0;
  const hasDiscount =
    product.compareAtAmount != null &&
    product.compareAtAmount > product.priceAmount;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader
        niches={niches ?? []}
        currentNicheName={product.niche?.name}
      />

      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <nav className="text-sm text-fg-muted">
              {product.niche ? (
                <Link
                  href={nicheUrl(product.niche.slug)}
                  className="transition hover:text-fg"
                >
                  {product.niche.name}
                </Link>
              ) : null}
              {product.niche ? " / " : null}
              <span className="text-fg">{product.name}</span>
            </nav>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-fg-muted">
                  {LEARNING_LEVEL_LABEL[product.level]}
                </span>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gradient sm:text-4xl">
                  {product.name}
                </h1>
                {product.summary ? (
                  <p className="mt-4 text-lg text-fg-muted">{product.summary}</p>
                ) : null}

                {product.outcome ? (
                  <div className="mt-8 rounded-2xl border border-border bg-card p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
                      What you walk away with
                    </h2>
                    <p className="mt-2 text-fg">{product.outcome}</p>
                  </div>
                ) : null}

                {product.learnings.length > 0 ? (
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold text-fg">
                      What you will learn
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {product.learnings.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-sm text-fg-muted"
                        >
                          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">
                            ✓
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {product.description ? (
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold text-fg">Overview</h2>
                    <p className="mt-3 whitespace-pre-line text-sm text-fg-muted">
                      {product.description}
                    </p>
                  </div>
                ) : null}

                {product.features.length > 0 ? (
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold text-fg">
                      What is included
                    </h2>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {product.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm text-fg-muted"
                        >
                          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">
                            ✓
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {product.audience ? (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h3 className="text-sm font-semibold text-fg">
                        Who this is for
                      </h3>
                      <p className="mt-2 text-sm text-fg-muted">
                        {product.audience}
                      </p>
                    </div>
                  ) : null}
                  {product.notFor ? (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h3 className="text-sm font-semibold text-fg">
                        Who this is not for
                      </h3>
                      <p className="mt-2 text-sm text-fg-muted">
                        {product.notFor}
                      </p>
                    </div>
                  ) : null}
                </div>

                {product.limitations ? (
                  <div className="mt-6 rounded-2xl border border-border bg-surface-muted p-5">
                    <h3 className="text-sm font-semibold text-fg">
                      Limitations
                    </h3>
                    <p className="mt-2 text-sm text-fg-muted">
                      {product.limitations}
                    </p>
                  </div>
                ) : null}
              </div>

              <aside className="lg:sticky lg:top-24 lg:self-start">
                {product.coverImage ? (
                  <div className="relative mb-5 aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border bg-surface-muted">
                    <Image
                      src={product.coverImage}
                      alt={product.name}
                      fill
                      preload
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/5 dark:shadow-black/40">
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold text-fg">
                      {isFree
                        ? "Free"
                        : formatCurrency(product.priceAmount, product.currency)}
                    </span>
                    {hasDiscount ? (
                      <span className="text-base text-fg-muted line-through">
                        {formatCurrency(
                          product.compareAtAmount as number,
                          product.currency,
                        )}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-fg-muted">
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
                      <p className="rounded-lg bg-surface-muted px-4 py-3 text-center text-sm text-fg-muted">
                        Currently unavailable
                      </p>
                    )}
                  </div>

                  {product.files.length > 0 ? (
                    <div className="mt-6 border-t border-border pt-5">
                      <h3 className="text-sm font-semibold text-fg">
                        Included files
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm text-fg-muted">
                        {product.files.map((file) => (
                          <li key={file.id} className="flex items-center gap-2">
                            <span className="text-xs">📄</span>
                            {file.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {product.license ? (
                    <div className="mt-6 border-t border-border pt-5">
                      <h3 className="text-sm font-semibold text-fg">License</h3>
                      <p className="mt-2 text-xs text-fg-muted">
                        {product.license}
                      </p>
                    </div>
                  ) : null}

                  <p className="mt-5 text-center text-xs text-fg-muted">
                    Secure checkout via Paddle · Instant access after payment
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter niches={niches ?? []} />
    </div>
  );
}

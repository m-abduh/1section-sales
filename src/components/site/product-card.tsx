import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { LEARNING_LEVEL_LABEL } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { resourceUrl } from "@/lib/site";

export function ProductCard({
  product,
  nicheSlug,
  accentColor = "#6366F1",
  index = 0,
}: {
  product: Product;
  nicheSlug: string;
  accentColor?: string;
  index?: number;
}) {
  const isFree = product.priceAmount === 0;
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
  const learnings = product.learnings?.slice(0, 3) ?? [];
  const fileCount = product.files?.length ?? 0;
  const number = String(index + 1).padStart(2, "0");

  return (
    <Link
      href={resourceUrl(nicheSlug, product.slug)}
      className="glass group relative block overflow-hidden rounded-[2rem] transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-1.5 opacity-80"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent 70%)` }}
      />

      <div className="grid lg:grid-cols-[0.85fr_1.5fr_0.75fr]">
        <div className="relative p-3 sm:p-4 lg:p-5">
          {product.coverImage ? (
            <Image
              src={product.coverImage}
              alt={product.name}
              width={1200}
              height={1500}
              preload={index === 0}
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="block h-auto w-full rounded-2xl border border-white/50 shadow-sm dark:border-white/10"
            />
          ) : (
            <div
              aria-hidden
              className="relative flex min-h-52 w-full items-end overflow-hidden rounded-2xl border border-white/40 sm:min-h-60 lg:h-full lg:min-h-72 dark:border-white/10"
              style={{ background: `radial-gradient(120% 120% at 0% 0%, color-mix(in srgb, ${accentColor} 18%, var(--surface)), var(--surface-muted) 70%)` }}
            >
              <span className="p-5 text-6xl font-bold leading-none text-fg/[0.08] sm:p-6 sm:text-7xl lg:text-8xl">{number}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col p-5 sm:p-8 lg:py-8 lg:pl-2 lg:pr-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="rounded-full bg-surface-muted/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">Guide {number}</span>
            <span className="rounded-full bg-surface-muted/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">{LEARNING_LEVEL_LABEL[product.level]}</span>
            {isFree ? (
              <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: accentColor }}>Free</span>
            ) : hasDiscount ? (
              <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: accentColor }}>
                Save {formatCurrency(product.compareAtAmount! - product.priceAmount, product.currency)}
              </span>
            ) : null}
          </div>

          <h3 className="mt-4 text-2xl font-semibold leading-[1.15] tracking-tight text-fg sm:text-4xl">{product.name}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-fg-muted sm:mt-4 sm:text-base">
            {product.outcome ?? product.summary ?? "A focused guide to understanding a real-life problem."}
          </p>

          {learnings.length > 0 ? (
            <ul className="mt-5 space-y-2.5 rounded-2xl border border-white/40 bg-surface-muted/30 p-4 sm:mt-6 dark:border-white/10">
              {learnings.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-fg-muted">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full" style={{ backgroundColor: accentColor }} />
                  <span className="line-clamp-3 sm:line-clamp-2">{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col justify-between gap-6 border-t border-white/40 bg-surface-muted/30 p-5 sm:p-8 lg:border-l lg:border-t-0 dark:border-white/10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">{isFree ? "Free guide" : "One-time purchase"}</p>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-3xl font-bold tracking-tight text-fg">{isFree ? "Free" : formatCurrency(product.priceAmount, product.currency)}</span>
              {hasDiscount && discountPercent > 0 ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Save {discountPercent}%</span>
              ) : null}
              {hasDiscount ? (
                <span className="text-sm text-fg-muted line-through">{formatCurrency(product.compareAtAmount as number, product.currency)}</span>
              ) : null}
            </p>
            <p className="mt-2 text-sm leading-6 text-fg-muted">{isFree ? "Free access — no payment required." : "Instant access after confirmed payment."}</p>
          </div>

          <div>
            <span className="inline-flex w-full items-center justify-between gap-3 rounded-2xl bg-accent px-5 py-3.5 text-sm font-semibold text-accent-fg shadow-sm transition group-hover:opacity-90">
              View guide
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </span>
            {fileCount > 0 ? (
              <p className="mt-3 text-center text-[11px] text-fg-muted">{fileCount} file{fileCount === 1 ? "" : "s"} included</p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

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
      className="group relative block overflow-hidden rounded-[2rem] border border-border bg-card transition duration-500 hover:border-fg/20 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, color-mix(in srgb, ${accentColor} 20%, transparent) 45%, transparent)`,
        }}
      />

      <div className="grid lg:grid-cols-[0.85fr_1.5fr_0.75fr]">
        {/* 1. Visual — fills the full card height on desktop */}
        <div className="relative border-b border-border lg:border-b-0 lg:border-r">
          {product.coverImage ? (
            <Image
              src={product.coverImage}
              alt={product.name}
              width={1200}
              height={1500}
              preload={index === 0}
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="block h-auto w-full"
            />
          ) : (
            <div
              aria-hidden
              className="relative flex min-h-48 w-full items-end sm:min-h-56 lg:h-full lg:min-h-64"
              style={{
                background: `radial-gradient(120% 120% at 0% 0%, color-mix(in srgb, ${accentColor} 10%, var(--surface-muted)), var(--surface-muted) 70%)`,
              }}
            >
              <span className="p-5 font-serif text-6xl font-medium leading-none text-fg/[0.08] sm:p-6 sm:text-[7rem] lg:text-[9rem]">
                {number}
              </span>
            </div>
          )}
        </div>

        {/* 2. Info */}
        <div className="flex flex-col p-5 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
              Guide {number}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {LEARNING_LEVEL_LABEL[product.level]}
            </span>
            {isFree ? (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: accentColor }}
              >
                Free
              </span>
            ) : hasDiscount ? (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: accentColor }}
              >
                Save{" "}
                {formatCurrency(
                  product.compareAtAmount! - product.priceAmount,
                  product.currency,
                )}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 font-serif text-2xl font-medium leading-[1.15] tracking-tight text-fg sm:mt-4 sm:text-4xl">
            {product.name}
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted sm:mt-4 sm:text-base sm:leading-7">
            {product.outcome ??
              product.summary ??
              "A focused guide to understanding a real-life problem."}
          </p>

          {learnings.length > 0 ? (
            <ul className="mt-5 space-y-2 border-t border-border/80 pt-4 sm:mt-6 sm:space-y-2.5 sm:pt-5">
              {learnings.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm leading-6 text-fg-muted sm:gap-3"
                >
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="line-clamp-3 sm:line-clamp-2">{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* 3. Price + action */}
        <div className="flex flex-col justify-between gap-5 border-t border-border bg-surface-muted/40 p-5 sm:gap-8 sm:p-8 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
              {isFree ? "Free guide" : "One-time purchase"}
            </p>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:mt-3">
              <span className="font-serif text-2xl font-medium text-fg sm:text-3xl">
                {isFree
                  ? "Free"
                  : formatCurrency(product.priceAmount, product.currency)}
              </span>
              {hasDiscount && discountPercent > 0 ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Save {discountPercent}%
                </span>
              ) : null}
              {hasDiscount ? (
                <span className="text-sm text-fg-muted line-through">
                  {formatCurrency(
                    product.compareAtAmount as number,
                    product.currency,
                  )}
                </span>
              ) : null}
            </p>
            <p className="mt-2 text-xs leading-5 text-fg-muted sm:text-sm sm:leading-6">
              {isFree
                ? "Free access — no payment required."
                : "Instant access after confirmed payment."}
            </p>
          </div>

          <div>
            <span className="inline-flex w-full items-center justify-between gap-3 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition group-hover:opacity-90">
              View guide
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </span>
            {fileCount > 0 ? (
              <p className="mt-2.5 text-center text-[11px] text-fg-muted sm:mt-3">
                {fileCount} file{fileCount === 1 ? "" : "s"} included
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

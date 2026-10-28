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
              className="block h-auto w-full object-cover lg:h-full"
            />
          ) : (
            <div
              aria-hidden
              className="relative flex h-full min-h-64 w-full items-end"
              style={{
                background: `radial-gradient(120% 120% at 0% 0%, color-mix(in srgb, ${accentColor} 10%, var(--surface-muted)), var(--surface-muted) 70%)`,
              }}
            >
              <span className="p-6 font-serif text-[7rem] font-medium leading-none text-fg/[0.08] sm:text-[9rem]">
                {number}
              </span>
            </div>
          )}

          <span className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted backdrop-blur">
            <span
              aria-hidden
              className="size-1.5 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            {LEARNING_LEVEL_LABEL[product.level]}
          </span>
        </div>

        {/* 2. Info */}
        <div className="flex flex-col p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
              Guide {number}
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

          <h3 className="mt-4 font-serif text-3xl font-medium leading-[1.08] tracking-tight text-fg sm:text-4xl">
            {product.name}
          </h3>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-fg-muted sm:text-base sm:leading-8">
            {product.outcome ??
              product.summary ??
              "A focused guide to understanding a real-life problem."}
          </p>

          {learnings.length > 0 ? (
            <ul className="mt-6 space-y-2.5 border-t border-border/80 pt-5">
              {learnings.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-6 text-fg-muted"
                >
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="line-clamp-2">{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* 3. Price + action */}
        <div className="flex flex-col justify-between gap-8 border-t border-border bg-surface-muted/40 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
              {isFree ? "Free guide" : "One-time purchase"}
            </p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-medium text-fg">
                {isFree
                  ? "Free"
                  : formatCurrency(product.priceAmount, product.currency)}
              </span>
              {hasDiscount ? (
                <span className="text-sm text-fg-muted line-through">
                  {formatCurrency(
                    product.compareAtAmount as number,
                    product.currency,
                  )}
                </span>
              ) : null}
            </p>
            <p className="mt-2 text-xs leading-5 text-fg-muted">
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
              <p className="mt-3 text-center text-[11px] text-fg-muted">
                {fileCount} file{fileCount === 1 ? "" : "s"} included
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

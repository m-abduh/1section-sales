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
      className="group relative block overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-xl backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/60 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif]"
    >
      <div className="grid md:grid-cols-[0.95fr_1.25fr] lg:grid-cols-[0.85fr_1.35fr_0.8fr] lg:items-stretch">
        <div className="relative p-3 sm:p-4 lg:p-5">
          {product.coverImage ? (
            <Image
              src={product.coverImage}
              alt={product.name}
              width={1200}
              height={1500}
              preload={index === 0}
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="block h-auto w-full rounded-2xl border border-slate-200/70 shadow-sm dark:border-white/10"
            />
          ) : (
            <div
              aria-hidden
              className="relative flex min-h-52 w-full items-end overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-slate-100 via-slate-50 to-white sm:min-h-60 lg:h-full lg:min-h-72 dark:border-white/10 dark:from-[#1e2029] dark:via-[#16171f] dark:to-[#0d0e13]"
            >
              <span className="p-5 text-6xl font-bold leading-none text-slate-900/[0.08] sm:p-6 sm:text-7xl lg:text-8xl dark:text-[#e3e1e9]/10">{number}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:py-6 lg:pl-2 lg:pr-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-[#34343a] dark:text-[#cbc3d7]">Guide {number}</span>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-[#34343a] dark:text-[#cbc3d7]">{LEARNING_LEVEL_LABEL[product.level]}</span>
            {isFree ? (
              <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white dark:bg-[#00a572] dark:text-[#00311f]">Free</span>
            ) : hasDiscount ? (
              <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white dark:bg-[#00a572] dark:text-[#00311f]">
                Save {discountPercent}%
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-[22px] font-semibold leading-[30px] tracking-[-0.015em] text-slate-900 lg:text-[28px] lg:leading-[36px] dark:text-[#e3e1e9]">{product.name}</h3>
            <p className="text-[15px] leading-[24px] text-slate-600 dark:text-[#cbc3d7]">
              {product.outcome ?? product.summary ?? "A focused guide to understanding a real-life problem."}
            </p>
          </div>

          {learnings.length > 0 ? (
            <div className="flex flex-col gap-3 pt-0.5">
              {learnings.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-[#00a572]/30 dark:text-[#4edea3]">
                    <span aria-hidden className="text-[12px] font-bold">✓</span>
                  </div>
                  <span className="text-[13px] leading-[20px] tracking-[0.005em] text-slate-700 dark:text-[#e3e1e9]">{item}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-slate-200/80 bg-slate-100/30 p-5 sm:p-7 md:col-span-2 lg:col-span-1 lg:border-l lg:border-t-0 lg:bg-transparent lg:pl-6 dark:border-[#34343a]/40 dark:bg-transparent">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#958ea0]">{isFree ? "Free guide" : "One-time purchase"}</span>
              {hasDiscount ? <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-[#00a572] dark:text-[#00311f]">Save {discountPercent}%</span> : null}
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-[28px] font-bold leading-[36px] tracking-[-0.02em] text-slate-900 dark:text-[#e3e1e9]">{isFree ? "Free" : formatCurrency(product.priceAmount, product.currency)}</span>
              {hasDiscount ? <span className="text-[18px] font-semibold leading-[26px] tracking-[-0.01em] text-slate-400 line-through dark:text-[#494454]">{formatCurrency(product.compareAtAmount as number, product.currency)}</span> : null}
            </div>
            <span className="text-[12px] font-medium leading-[16px] tracking-[0.01em] text-slate-600 dark:text-[#cbc3d7]">{isFree ? "Free access — no payment required." : "Instant access after confirmed payment."}</span>
          </div>

          <div className="flex flex-col gap-3">
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-slate-900 px-6 py-3.5 text-[14px] font-semibold text-white shadow-lg transition group-hover:bg-slate-800 dark:border-white/10 dark:bg-[#292a2f]/80 dark:text-[#e3e1e9] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.15)] dark:hover:bg-[#292a2f]">
              View guide
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
            {fileCount > 0 ? (
              <p className="text-center text-[12px] font-medium text-slate-500 dark:text-[#958ea0]">{fileCount} file{fileCount === 1 ? "" : "s"} included</p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

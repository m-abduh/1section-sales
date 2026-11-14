import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SitePageHero } from "@/components/site/site-page-hero";
import { getCurrentNiche, getNiches } from "@/lib/server-api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about buying resources, instant access, refunds, and how 1section works.",
};

const faqs = [
  { q: "What exactly am I buying?", a: "A digital learning resource (or a step in a learning path) that you access immediately after purchase. Each resource page lists what is included, who it is for, and its limitations." },
  { q: "How do I receive my purchase?", a: "Access is delivered digitally. As soon as your payment is confirmed, a private access link appears on the checkout success page and a copy is sent to your email." },
  { q: "Do I need an account?", a: "No. Purchases use your email and a secure access link. You can always retrieve a purchase from the Retrieve a purchase page using your order details." },
  { q: "Is this a subscription?", a: "No. Every resource is a one-time purchase with lifetime access to the files. There are no recurring charges." },
  { q: "What is a learning path?", a: "A learning path is an ordered sequence of resources for a specific problem. You can buy the steps individually and work through them in order, starting with the first step." },
  { q: "Who handles payment and taxes?", a: "Paddle acts as the merchant of record, so it processes the payment and handles applicable taxes. Your statement will show Paddle." },
  { q: "What is your refund policy?", a: "Because these are digital products delivered instantly, refunds are limited. Please review the refund policy for the full details before purchasing." },
  { q: "How do I get support?", a: "Visit the support page for how to reach us about an order, a payment issue, or a problem with a file." },
];

export default async function FaqPage() {
  const [nichesResponse, currentNiche] = await Promise.all([
    getNiches(),
    getCurrentNiche(),
  ]);
  const niches = nichesResponse ?? [];

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f6f7fb] text-[#0f172a] selection:bg-indigo-500/20 selection:text-indigo-700 [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif] dark:bg-[#121318] dark:text-[#e3e1e9] dark:selection:bg-[#d0bcff]/20 dark:selection:text-[#d0bcff]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="pointer-events-none fixed -top-24 left-1/2 z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-[100px] dark:bg-[#d0bcff]/10" />
      <div className="pointer-events-none fixed -right-20 bottom-20 z-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-[90px] dark:bg-[#4edea3]/10" />
      <SiteHeader niches={niches} currentNicheName={currentNiche?.name} />

      <main className="relative z-10 flex-1 pt-16">
        <SitePageHero
          eyebrow={currentNiche ? `${currentNiche.name} · Help & guidance` : "Help & guidance"}
          title="Frequently asked questions"
          description="Everything about buying, accessing, and using a resource."
          accentColor={currentNiche?.accentColor}
        />

        <section className="mx-auto w-full max-w-6xl px-5 pb-2 pt-6 md:px-8 md:pt-8">
          <div className="rounded-3xl border border-slate-200/80 bg-white/60 p-3 shadow-xl backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#1e1f25]/50 sm:p-5">
            <div className="space-y-3">
              {faqs.map((item, i) => (
                <details key={item.q} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/50 px-4 py-4 backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 sm:px-6 sm:py-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                    <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100/70 text-[11px] font-semibold text-slate-500 dark:bg-[#34343a] dark:text-[#958ea0]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-base font-semibold text-slate-900 dark:text-[#e3e1e9] sm:text-lg">{item.q}</span>
                    </div>
                    <span aria-hidden className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-slate-100/70 text-sm text-slate-500 transition group-open:rotate-45 group-open:bg-slate-900 group-open:text-white dark:bg-[#34343a] dark:text-[#958ea0] dark:group-open:bg-white dark:group-open:text-[#0d0e13]">+</span>
                  </summary>
                  <p className="ml-10 mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-[#cbc3d7] sm:ml-11 sm:text-base sm:leading-8">{item.a}</p>
                </details>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-100/50 px-4 py-5 dark:border-[#34343a]/40 dark:bg-[#292a2f]/40 sm:px-6">
              <p className="text-sm text-slate-600 dark:text-[#cbc3d7] sm:text-base">
                Still have a question?{" "}
                <Link href="/support" className="font-semibold text-slate-900 underline decoration-slate-400 underline-offset-4 hover:decoration-slate-900 dark:text-[#e3e1e9] dark:decoration-[#958ea0] dark:hover:decoration-[#e3e1e9]">
                  Contact support
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter niches={niches} />
    </div>
  );
}

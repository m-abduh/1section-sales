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
    <div className="flex min-h-screen flex-col">
      <SiteHeader niches={niches} currentNicheName={currentNiche?.name} />

      <main className="flex-1">
        <SitePageHero
          eyebrow={currentNiche ? `${currentNiche.name} · Help & guidance` : "Help & guidance"}
          title="Frequently asked questions"
          description="Everything about buying, accessing, and using a resource."
          accentColor={currentNiche?.accentColor}
        />

        <section className="px-3 pb-2 pt-6 sm:px-4 sm:pt-8">
          <div className="glass mx-auto w-full max-w-6xl rounded-[2rem] p-3 sm:p-5">
            <div className="space-y-3">
              {faqs.map((item, i) => (
                <details key={item.q} className="group glass-soft overflow-hidden rounded-2xl px-4 py-4 sm:px-6 sm:py-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                    <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-muted/70 text-[11px] font-semibold text-fg-muted">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-base font-semibold text-fg sm:text-lg">{item.q}</span>
                    </div>
                    <span aria-hidden className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted/70 text-sm text-fg-muted transition group-open:rotate-45 group-open:bg-accent group-open:text-accent-fg">+</span>
                  </summary>
                  <p className="ml-10 mt-3 max-w-3xl text-sm leading-7 text-fg-muted sm:ml-11 sm:text-base sm:leading-8">{item.a}</p>
                </details>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/40 bg-surface-muted/40 px-4 py-5 sm:px-6 dark:border-white/10">
              <p className="text-sm text-fg-muted sm:text-base">
                Still have a question?{" "}
                <Link href="/support" className="font-semibold text-fg underline decoration-fg/30 underline-offset-4 hover:decoration-fg">
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

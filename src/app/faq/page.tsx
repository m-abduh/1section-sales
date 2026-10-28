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
  {
    q: "What exactly am I buying?",
    a: "A digital learning resource (or a step in a learning path) that you access immediately after purchase. Each resource page lists what is included, who it is for, and its limitations.",
  },
  {
    q: "How do I receive my purchase?",
    a: "Access is delivered digitally. As soon as your payment is confirmed, a private access link appears on the checkout success page and a copy is sent to your email.",
  },
  {
    q: "Do I need an account?",
    a: "No. Purchases use your email and a secure access link. You can always retrieve a purchase from the Retrieve a purchase page using your order details.",
  },
  {
    q: "Is this a subscription?",
    a: "No. Every resource is a one-time purchase with lifetime access to the files. There are no recurring charges.",
  },
  {
    q: "What is a learning path?",
    a: "A learning path is an ordered sequence of resources for a specific problem. You can buy the steps individually and work through them in order, starting with the first step.",
  },
  {
    q: "Who handles payment and taxes?",
    a: "Paddle acts as the merchant of record, so it processes the payment and handles applicable taxes. Your statement will show Paddle.",
  },
  {
    q: "What is your refund policy?",
    a: "Because these are digital products delivered instantly, refunds are limited. Please review the refund policy for the full details before purchasing.",
  },
  {
    q: "How do I get support?",
    a: "Visit the support page for how to reach us about an order, a payment issue, or a problem with a file.",
  },
];

export default async function FaqPage() {
  const [nichesResponse, currentNiche] = await Promise.all([
    getNiches(),
    getCurrentNiche(),
  ]);
  const niches = nichesResponse ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches} currentNicheName={currentNiche?.name} />

      <main className="flex-1">
        <SitePageHero
          eyebrow={currentNiche ? `${currentNiche.name} · Help & guidance` : "Help & guidance"}
          title="Frequently asked questions"
          description="Everything about buying, accessing, and using a resource."
          accentColor={currentNiche?.accentColor}
        />

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group px-5 py-5 transition-colors open:bg-surface-muted/50 sm:px-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-fg">
                  {item.q}
                  <span
                    aria-hidden
                    className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-sm text-fg-muted transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-fg-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          <p className="mt-10 text-sm text-fg-muted">
            Still have a question?{" "}
            <Link href="/support" className="font-medium text-fg hover:underline">
              Contact support
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter niches={niches} />
    </div>
  );
}

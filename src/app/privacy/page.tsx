import type { Metadata } from "next";
import { LegalLayout } from "@/components/site/legal-layout";
import { getNiches } from "@/lib/server-api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How 1section collects, uses, and protects your information.",
};

export default async function PrivacyPage() {
  const niches = (await getNiches()) ?? [];

  return (
    <LegalLayout
      title="Privacy policy"
      niches={niches}
      intro="This policy explains what information we collect when you use 1section, why we collect it, and how it is handled."
    >
      <div>
        <h2>Information we collect</h2>
        <p className="mt-3">
          When you make a purchase we collect the email address you provide and
          the order details. Payment card details are collected and processed by
          Paddle as the merchant of record; we do not store full card numbers.
        </p>
      </div>
      <div>
        <h2>Chat assistant</h2>
        <p className="mt-3">
          Our on-site assistant uses AI to answer questions. When you send a
          message, the text is processed by our AI provider to generate a reply.
          Conversations that include at least one message are stored with the
          page you were viewing, timestamps, and the message count so we can
          review and improve answer quality. Emails, order numbers, and other
          long numbers are replaced with placeholders before a conversation is
          stored, and chat records are deleted automatically after 30 days.
        </p>
      </div>
      <div>
        <h2>How we use information</h2>
        <p className="mt-3">
          We use your email address to deliver access links, provide support, and
          send transactional messages about your order. We use order data to
          process purchases, issue refunds, and meet accounting obligations.
        </p>
      </div>
      <div>
        <h2>Service providers</h2>
        <p className="mt-3">
          We rely on trusted providers for payments (Paddle), AI chat replies
          (Groq), file storage and delivery, and transactional email. These
          providers process data only as needed to provide their service to us.
        </p>
      </div>
      <div>
        <h2>Data retention</h2>
        <p className="mt-3">
          We retain order and email records for as long as needed to provide
          access, resolve disputes, and comply with legal and accounting
          requirements.
        </p>
      </div>
      <div>
        <h2>Your choices</h2>
        <p className="mt-3">
          You can request access to, correction of, or deletion of your personal
          information by contacting us through the support page. Some records may
          be retained where we are legally required to keep them.
        </p>
      </div>
      <div>
        <h2>Cookies</h2>
        <p className="mt-3">
          We use minimal cookies required for the site to function, such as
          remembering your theme preference. We do not use them for third-party
          advertising.
        </p>
      </div>
      <div>
        <h2>Contact</h2>
        <p className="mt-3">
          For privacy questions, reach us through the support page.
        </p>
      </div>
    </LegalLayout>
  );
}

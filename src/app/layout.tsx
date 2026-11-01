import type { Metadata } from "next";
import { Providers } from "./providers";
import { CustomerServiceWidget } from "@/components/site/customer-service-widget";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "1section — Practical learning for real-world problems",
    template: "%s | 1section",
  },
  description:
    "Understand the problem, decide what to do, and act. Practical learning resources organized around real-world problems in finance, business, psychology, and career.",
  metadataBase: new URL("https://1section.com"),
  openGraph: {
    title: "1section — Practical learning for real-world problems",
    description:
      "Understand the problem, decide what to do, and act with practical learning resources.",
    siteName: "1section",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <Providers>
          {children}
          <CustomerServiceWidget />
        </Providers>
      </body>
    </html>
  );
}

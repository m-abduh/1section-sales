import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getCurrentNiche, getNiches } from "@/lib/server-api";

export default async function CheckoutSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nichesResponse, currentNiche] = await Promise.all([
    getNiches(),
    getCurrentNiche(),
  ]);
  const niches = nichesResponse ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={niches} currentNicheName={currentNiche?.name} />
      {children}
      <SiteFooter niches={niches} />
    </div>
  );
}

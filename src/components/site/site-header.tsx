import type { Niche } from "@/lib/types";
import { SITE_NAME } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({
  niches = [],
  currentNicheName,
  currentNicheSlug,
}: {
  niches?: Niche[];
  variant?: "default" | "home";
  currentNicheName?: string;
  currentNicheSlug?: string;
}) {
  const niche =
    niches.find((n) => n.slug === currentNicheSlug) ??
    niches.find((n) => n.name === currentNicheName);
  const accent = niche?.accentColor ?? "#4edea3";
  const label = niche ? `1SECTION / ${niche.name.toUpperCase()}` : (currentNicheName ? `1SECTION / ${currentNicheName.toUpperCase()}` : SITE_NAME.toUpperCase());
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-t border-white/60 bg-white/70 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_8px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-[#34343a]/40 dark:bg-[#121318]/80 dark:shadow-[0_1px_8px_rgba(0,0,0,0.25)] [font-family:'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1.5 shadow-sm backdrop-blur-xl dark:border-[#34343a]/40 dark:bg-[#292a2f]/60">
          <div className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f172a] dark:text-[#e3e1e9]">{label}</span>
        </div>

        <ThemeToggle className="grid size-11 shrink-0 place-items-center rounded-full border border-white/60 bg-white/60 text-slate-600 shadow-sm backdrop-blur-xl transition-all hover:bg-white/80 hover:text-slate-900 active:scale-95 dark:border-[#34343a]/40 dark:bg-[#292a2f]/60 dark:text-[#cbc3d7] dark:hover:bg-[#34343a]/60 dark:hover:text-[#e3e1e9]" />
      </div>
    </header>
  );
}

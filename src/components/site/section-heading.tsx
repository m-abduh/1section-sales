interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  accent?: "indigo" | "emerald";
}

export function SectionHeading({ eyebrow, title, description, accent = "indigo" }: SectionHeadingProps) {
  const emerald = accent === "emerald";

  return (
    <div className="flex flex-col gap-1">
      {emerald ? (
        <div className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-[#4edea3]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-[#4edea3]">{eyebrow}</span>
        </div>
      ) : (
        <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-[#d0bcff]">{eyebrow}</span>
      )}
      <h2 className="text-[28px] font-bold leading-[36px] tracking-[-0.02em] text-slate-900 dark:text-[#e3e1e9]">{title}</h2>
      {description ? (
        <p className="text-[13px] leading-[20px] tracking-[0.005em] text-slate-600 dark:text-[#cbc3d7]">{description}</p>
      ) : null}
    </div>
  );
}

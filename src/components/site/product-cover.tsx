import Image from "next/image";

export function ProductCover({
  src,
  alt,
  fallback,
  className = "",
  imageClassName = "",
  sizes = "(min-width: 1024px) 360px, 90vw",
}: {
  src?: string | null;
  alt: string;
  fallback?: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
}) {
  return (
    <div
      className={`group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b from-slate-100 via-slate-50 to-white shadow-inner dark:border-white/10 dark:from-[#1e2029] dark:via-[#16171f] dark:to-[#0d0e13] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1.5px, transparent 1.5px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="pointer-events-none absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#d0bcff]/10 blur-[70px]" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-[#4edea3]/10 blur-[60px]" />
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={1500}
          sizes={sizes}
          className={`relative z-10 max-h-[82%] w-auto rounded-2xl border border-white/10 object-contain shadow-[0_20px_40px_-12px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-[1.02] ${imageClassName}`}
        />
      ) : (
        <span className="relative z-10 p-6 text-7xl font-bold text-slate-900/10 dark:text-[#e3e1e9]/10">
          {fallback ?? "•"}
        </span>
      )}
    </div>
  );
}

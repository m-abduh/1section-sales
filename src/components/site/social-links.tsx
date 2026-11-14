import { socialLinks, type SocialLink } from "@/lib/site";

const TIKTOK_PATH =
  "M16.5 3c.4 2.3 1.9 3.9 4.2 4.1v2.8c-1.4.1-2.8-.3-4.1-1v5.9c0 3.8-3 6.2-6.3 5.5-2.6-.6-4.4-3-4.1-5.7.3-2.5 2.5-4.5 5.1-4.4.3 0 .6 0 .9.1v2.9c-.3-.1-.6-.2-.9-.2-1.2 0-2.1 1-2.1 2.2 0 1.1.9 2 2 2.1 1.2.1 2.3-.9 2.3-2.2V3h2.9Z";

const PLATFORM: Record<SocialLink["platform"], { short: string; tint: string }> = {
  YouTube: { short: "YT", tint: "bg-red-500/10 text-red-600 dark:text-red-400" },
  Instagram: { short: "IG", tint: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  TikTok: { short: "TT", tint: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400" },
};

function SocialIcon({ platform }: { platform: SocialLink["platform"] }) {
  const className = "size-4 shrink-0";

  if (platform === "YouTube") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path
          fill="#FF0000"
          d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z"
        />
      </svg>
    );
  }
  if (platform === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <defs>
          <linearGradient id="ig-brand" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="35%" stopColor="#DD2A7B" />
            <stop offset="65%" stopColor="#8134AF" />
            <stop offset="100%" stopColor="#515BD4" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-brand)" />
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
        <circle cx="17.3" cy="6.7" r="1.2" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d={TIKTOK_PATH} fill="#25F4EE" transform="translate(-0.7,-0.7)" />
      <path d={TIKTOK_PATH} fill="#FE2C55" transform="translate(0.7,0.7)" />
      <path d={TIKTOK_PATH} fill="currentColor" />
    </svg>
  );
}

export function SocialLinks({
  slug,
  accentColor,
  variant = "inline",
}: {
  slug: string;
  accentColor?: string;
  variant?: "inline" | "cards" | "hero";
}) {
  const items = socialLinks(slug);

  if (variant === "hero") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-2.5">
        {items.map((social) => {
          const meta = PLATFORM[social.platform];
          return (
            <a
              key={social.platform}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${social.platform} @${social.handle}`}
              className="group flex items-center justify-between rounded-2xl border border-white/40 bg-surface/40 px-3 py-2.5 shadow-sm backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-surface/55 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className={`grid size-9 shrink-0 place-items-center rounded-full ${meta.tint}`}>
                  <SocialIcon platform={social.platform} />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">{social.platform}</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-fg">@{social.handle}</span>
                </span>
              </div>
              <span aria-hidden className="shrink-0 text-sm text-fg-muted/60 transition-colors group-hover:text-fg">↗</span>
            </a>
          );
        })}
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
        {items.map((social) => {
          const meta = PLATFORM[social.platform];
          return (
            <a
              key={social.platform}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${social.platform} @${social.handle}`}
              className="group flex items-center gap-3 rounded-xl border border-white/40 bg-surface-muted/25 px-3.5 py-3 transition duration-200 hover:bg-surface-muted/45 dark:border-white/10"
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${meta.tint}`}>
                <SocialIcon platform={social.platform} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                  {social.platform}
                </span>
                <span className="mt-0.5 block truncate text-sm font-medium text-fg">
                  @{social.handle}
                </span>
              </span>
              <span
                aria-hidden
                className="shrink-0 text-xs text-fg-muted/70 transition-colors group-hover:text-fg"
              >
                ↗
              </span>
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {items.map((social) => (
        <a
          key={social.platform}
          href={social.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`${social.platform} @${social.handle}`}
          className="glass-soft group inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-fg-muted transition hover:-translate-y-0.5 hover:text-fg"
        >
          <SocialIcon platform={social.platform} />
          <span>@{social.handle}</span>
        </a>
      ))}
    </div>
  );
}

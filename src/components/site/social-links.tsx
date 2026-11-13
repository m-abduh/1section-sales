import { socialLinks, type SocialLink } from "@/lib/site";

const TIKTOK_PATH =
  "M16.5 3c.4 2.3 1.9 3.9 4.2 4.1v2.8c-1.4.1-2.8-.3-4.1-1v5.9c0 3.8-3 6.2-6.3 5.5-2.6-.6-4.4-3-4.1-5.7.3-2.5 2.5-4.5 5.1-4.4.3 0 .6 0 .9.1v2.9c-.3-.1-.6-.2-.9-.2-1.2 0-2.1 1-2.1 2.2 0 1.1.9 2 2 2.1 1.2.1 2.3-.9 2.3-2.2V3h2.9Z";

function SocialIcon({ platform }: { platform: SocialLink["platform"] }) {
  const className = "size-3.5 shrink-0";
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

export function SocialLinks({ slug }: { slug: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {socialLinks(slug).map((social) => (
        <a
          key={social.platform}
          href={social.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`${social.platform} @${social.handle}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-fg-muted transition hover:border-fg/20 hover:text-fg"
        >
          <SocialIcon platform={social.platform} />
          @{social.handle}
        </a>
      ))}
    </div>
  );
}

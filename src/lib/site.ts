export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "1section";
export const SITE_TAGLINE =
  process.env.NEXT_PUBLIC_SITE_TAGLINE ??
  "A deeper understanding of the problems that shape our lives";

const ENV_ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "1section.com";

function isLocalHostName(host: string): boolean {
  return host === "localhost" || host === "lvh.me" || host.endsWith(".localhost") || host.endsWith(".lvh.me");
}

export function getRootDomain(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (isLocalHostName(host)) {
      const base = host.endsWith(".localhost") ? "localhost" : host.endsWith(".lvh.me") ? "lvh.me" : host;
      const port = window.location.port ? `:${window.location.port}` : "";
      return `${base}${port}`;
    }
  }
  if (process.env.NODE_ENV !== "production" && ENV_ROOT_DOMAIN === "1section.com") {
    return "localhost:3000";
  }
  return ENV_ROOT_DOMAIN;
}

// Configured root domain (env). Prefer getRootDomain() for URL building.
export const ROOT_DOMAIN = ENV_ROOT_DOMAIN;

export function isLocalRoot(): boolean {
  const root = getRootDomain();
  return root.includes("localhost") || root.includes("lvh.me");
}

export function useSubdomains(): boolean {
  return process.env.NEXT_PUBLIC_USE_SUBDOMAINS !== "false";
}

export function nicheUrl(slug: string): string {
  if (useSubdomains()) {
    const root = getRootDomain();
    const protocol = root.includes("localhost") || root.includes("lvh.me") ? "http" : "https";
    return `${protocol}://${slug}.${root}`;
  }
  return `/niche/${slug}`;
}

export function resourceUrl(nicheSlug: string, productSlug: string): string {
  if (useSubdomains()) {
    const root = getRootDomain();
    const protocol = root.includes("localhost") || root.includes("lvh.me") ? "http" : "https";
    return `${protocol}://${nicheSlug}.${root}/resources/${productSlug}`;
  }
  return `/resources/${productSlug}`;
}

export function rootUrl(): string {
  if (useSubdomains()) {
    const root = getRootDomain();
    const protocol = root.includes("localhost") || root.includes("lvh.me") ? "http" : "https";
    return `${protocol}://${root}`;
  }
  return "/";
}

export const SOCIAL_HANDLE_PREFIX =
  process.env.NEXT_PUBLIC_SOCIAL_HANDLE_PREFIX ?? "1section.";

export interface SocialLink {
  platform: "YouTube" | "Instagram" | "TikTok";
  handle: string;
  url: string;
}

export function socialHandle(slug: string): string {
  return `${SOCIAL_HANDLE_PREFIX}${slug}`;
}

export function socialLinks(slug: string): SocialLink[] {
  const handle = socialHandle(slug);
  return [
    {
      platform: "YouTube",
      handle,
      url: `https://www.youtube.com/@${handle}`,
    },
    {
      platform: "Instagram",
      handle,
      url: `https://www.instagram.com/${handle}/`,
    },
    {
      platform: "TikTok",
      handle,
      url: `https://www.tiktok.com/@${handle}`,
    },
  ];
}

export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

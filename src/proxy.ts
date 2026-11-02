import { NextResponse, type NextRequest } from "next/server";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "1section.com")
  .split(":")[0]
  .toLowerCase();

const DEV_SUFFIXES = ["localhost", "lvh.me"];

function getSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return null;

  const suffixes = new Set([ROOT_DOMAIN, ...DEV_SUFFIXES]);

  for (const suffix of suffixes) {
    if (host === suffix) return null;
    if (host.endsWith(`.${suffix}`)) {
      const sub = host.slice(0, -(suffix.length + 1));
      if (!sub || sub.includes(".")) return null;
      return sub;
    }
  }

  return null;
}

function isKnownHost(hostname: string): boolean {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return false;

  for (const suffix of new Set([ROOT_DOMAIN, ...DEV_SUFFIXES])) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return true;
  }
  return false;
}

function subdomainUrl(request: NextRequest, slug: string, path = "/"): string {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  return `${request.nextUrl.protocol}//${slug}.${host}${path}`;
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);
  const { pathname } = request.nextUrl;

  if (subdomain === "admin") {
    // The admin subdomain is already the admin area, so keep the address bar
    // clean: /admin/products -> /products. The clean path is rewritten back to
    // the underlying /admin route below.
    const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
    if (isAdminPath) {
      const url = request.nextUrl.clone();
      url.host = request.headers.get("host") ?? request.nextUrl.host;
      url.pathname = pathname.slice("/admin".length) || "/";
      return NextResponse.redirect(url, 308);
    }

    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Niche subdomain: this IS the "deep dive" area. Root path renders the niche
  // landing page; every other path (resources, about, ...) is served as-is.
  if (subdomain && subdomain !== "www") {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/niche/${subdomain}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Hosts that are not the configured root domain (e.g. a default preview URL
  // like *.vercel.app) cannot resolve niche subdomains, so serve paths as-is
  // instead of redirecting to an unreachable subdomain.
  if (!isKnownHost(host)) {
    return NextResponse.next();
  }

  // Root domain is reserved for the landing page. Anything under a niche or
  // resource path is bounced onto the matching subdomain.
  const nicheMatch = pathname.match(/^\/niche\/([^/]+)/);
  if (nicheMatch) {
    return NextResponse.redirect(subdomainUrl(request, nicheMatch[1]), 308);
  }

  const resourceMatch = pathname.match(/^\/resources\/([^/]+)/);
  if (resourceMatch) {
    const slug = resourceMatch[1];
    const nicheSlug = await lookupNicheSlug(request, slug);
    if (nicheSlug) {
      return NextResponse.redirect(
        subdomainUrl(request, nicheSlug, `/resources/${slug}`),
        308,
      );
    }
  }

  return NextResponse.next();
}

async function lookupNicheSlug(request: NextRequest, productSlug: string): Promise<string | null> {
  const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  try {
    const res = await fetch(`${origin}/api/products/${productSlug}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { niche?: { slug?: string } } };
    return json.data?.niche?.slug ?? null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

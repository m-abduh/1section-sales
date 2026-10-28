import { headers } from "next/headers";
import type { Niche, NicheWithProducts, Product } from "./types";
import * as nicheService from "./server/modules/niches/niche.service";
import * as productService from "./server/modules/products/product.service";
import { ROOT_DOMAIN } from "./site";

function serialize<T>(v: unknown): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export async function getNiches(): Promise<Niche[] | null> {
  try {
    return serialize<Niche[]>(await nicheService.listPublicNiches());
  } catch {
    return null;
  }
}

export async function getNiche(slug: string): Promise<NicheWithProducts | null> {
  try {
    return serialize<NicheWithProducts>(await nicheService.getNicheBySlug(slug));
  } catch {
    return null;
  }
}

export async function getCurrentNiche(): Promise<NicheWithProducts | null> {
  const requestHeaders = await headers();
  const hostname = (requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "")
    .split(":")[0]
    .toLowerCase();
  const rootDomain = ROOT_DOMAIN.split(":")[0].toLowerCase();
  const domains = [rootDomain, "localhost", "lvh.me"];

  for (const domain of domains) {
    const suffix = `.${domain}`;
    if (!hostname.endsWith(suffix)) continue;

    const slug = hostname.slice(0, -suffix.length);
    if (!slug || slug.includes(".") || slug === "www" || slug === "admin") {
      return null;
    }

    return getNiche(slug);
  }

  return null;
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    return serialize<Product>(await productService.getPublicProductBySlug(slug));
  } catch {
    return null;
  }
}

export async function getProducts(nicheSlug?: string): Promise<Product[] | null> {
  try {
    return serialize<Product[]>(await productService.listPublicProducts(nicheSlug));
  } catch {
    return null;
  }
}

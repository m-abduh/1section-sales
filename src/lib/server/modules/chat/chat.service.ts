import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/api-error";
import { formatCurrency } from "@/lib/format";
import type { ChatMessage } from "./chat.schema";

const STATIC_PAGE_CONTEXT: Record<string, string> = {
  "/": "Home page. The visitor can browse problem areas (niches), see the latest guides with prices, and open a guide.",
  "/about":
    "About page. Explains what 1section is, its principles, and how each resource is structured (understand, decide, act).",
  "/faq":
    "FAQ page. Answers questions about what is being sold, instant delivery, accounts, subscriptions, learning paths, taxes, refunds, and support.",
  "/support":
    "Support page. Tells visitors to email support@1section.com with their order number, and how to retrieve a lost access link.",
  "/privacy":
    "Privacy policy page. Explains what data is collected, how it is used, providers (Paddle, storage, email), retention, and user choices.",
  "/refund":
    "Refund policy page. Digital products are generally final sale; duplicate charges, inaccessible files, and materially different products are handled case by case.",
  "/terms":
    "Terms of service page. Covers digital products, personal license, Paddle payments and taxes, educational-only content, and liability limits.",
  "/checkout/success":
    "Checkout success / retrieve a purchase page. The visitor can look up an order with their order number and email, then download their files.",
};

const SUPPORT_EMAIL = "support@1section.com";
const MAX_CATALOG_ITEMS = 40;

const SEARCH_STOPWORDS = new Set([
  "the", "and", "you", "your", "for", "with", "about", "this", "that", "have",
  "does", "can", "could", "would", "what", "which", "who", "how", "much",
  "many", "any", "are", "is", "it", "its", "do", "get", "got", "from", "guide",
  "guides", "free", "price", "cost", "there", "their", "them", "please", "tell",
  "want", "need", "know", "more", "details", "include", "included", "buy",
]);

function normalizePath(pathname: string): string {
  if (!pathname || !pathname.startsWith("/")) return "/";
  const clean = pathname.split("?")[0].split("#")[0];
  return clean.length > 1 ? clean.replace(/\/+$/, "") || "/" : clean;
}

function getSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return null;

  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "1section.com")
    .split(":")[0]
    .toLowerCase();

  for (const suffix of new Set([rootDomain, "localhost", "lvh.me"])) {
    if (host.endsWith(`.${suffix}`)) {
      const sub = host.slice(0, -(suffix.length + 1));
      if (sub && !sub.includes(".")) return sub;
    }
  }

  return null;
}

function asTextList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .slice(0, maxItems)
    .map((item) => truncate(item, 110));
}

async function describeResource(slug: string): Promise<string | null> {
  const product = await prisma.product
    .findUnique({
      where: { slug },
      select: {
        name: true,
        summary: true,
        outcome: true,
        audience: true,
        notFor: true,
        limitations: true,
        learnings: true,
        features: true,
        priceAmount: true,
        currency: true,
        level: true,
        active: true,
        niche: { select: { name: true } },
        files: {
          orderBy: { sortOrder: "asc" },
          take: 5,
          select: { name: true, format: true },
        },
      },
    })
    .catch(() => null);

  if (!product || !product.active) return null;

  const price =
    product.priceAmount === 0
      ? "free"
      : formatCurrency(product.priceAmount, product.currency);
  const learnings = asTextList(product.learnings, 4);
  const features = asTextList(product.features, 4);
  const files = product.files
    .map((file) => `${file.name}${file.format ? ` (${file.format})` : ""}`)
    .join(", ");

  const details = [
    `Guide "${product.name}"${product.niche ? ` in ${product.niche.name}` : ""}.`,
    `Price: ${price}. Level: ${product.level}.`,
    product.summary ? `Summary: ${truncate(product.summary, 160)}` : null,
    product.outcome ? `Outcome: ${truncate(product.outcome, 160)}` : null,
    learnings.length ? `What they learn: ${learnings.join("; ")}.` : null,
    features.length ? `What is included: ${features.join("; ")}.` : null,
    files ? `Files: ${truncate(files, 160)}.` : null,
    product.audience ? `For: ${truncate(product.audience, 140)}` : null,
    product.notFor ? `Not for: ${truncate(product.notFor, 140)}` : null,
    product.limitations ? `Limitations: ${truncate(product.limitations, 140)}` : null,
    "The visitor can preview the sample and buy it to get instant access.",
  ];

  return details.filter(Boolean).join(" ");
}

async function describeNiche(slug: string): Promise<string | null> {  const niche = await prisma.niche
    .findUnique({
      where: { slug },
      select: {
        name: true,
        tagline: true,
        description: true,
        active: true,
        products: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }],
          take: 6,
          select: { name: true, priceAmount: true, currency: true },
        },
      },
    })
    .catch(() => null);

  if (!niche || !niche.active) return null;

  const guides = niche.products
    .map(
      (product) =>
        `${product.name} (${formatCurrency(product.priceAmount, product.currency)})`,
    )
    .join(", ");
  return [
    `Problem-area page for "${niche.name}".`,
    niche.tagline ?? niche.description ?? null,
    guides ? `Guides here: ${guides}.` : "No guides published yet.",
    "The visitor can browse the guides in this area and open one.",
  ]
    .filter(Boolean)
    .join(" ");
}

interface CatalogItem {
  slug: string;
  name: string;
  summary: string | null;
  priceAmount: number;
  currency: string;
  nicheName: string | null;
}

async function loadCatalog(): Promise<CatalogItem[]> {
  const products = await prisma.product
    .findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: MAX_CATALOG_ITEMS,
      select: {
        slug: true,
        name: true,
        summary: true,
        priceAmount: true,
        currency: true,
        niche: { select: { name: true } },
      },
    })
    .catch(() => []);

  return products.map((product) => ({
    slug: product.slug,
    name: product.name,
    summary: product.summary,
    priceAmount: product.priceAmount,
    currency: product.currency,
    nicheName: product.niche?.name ?? null,
  }));
}

function priceLabel(amount: number, currency: string): string {
  return amount === 0 ? "free" : formatCurrency(amount, currency);
}

function catalogLine(item: CatalogItem): string {
  return [
    `${item.name}${item.nicheName ? ` (${item.nicheName})` : ""} — ${priceLabel(item.priceAmount, item.currency)}`,
    item.summary ? truncate(item.summary, 110) : null,
  ]
    .filter(Boolean)
    .join(": ");
}

function findRelevantProducts(
  catalog: CatalogItem[],
  message: string,
): CatalogItem[] {
  const words = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !SEARCH_STOPWORDS.has(word));

  if (words.length === 0) return [];

  return catalog
    .map((item) => {
      const name = item.name.toLowerCase();
      const niche = item.nicheName?.toLowerCase() ?? "";
      const summary = item.summary?.toLowerCase() ?? "";
      let score = 0;

      for (const word of words) {
        if (name.includes(word)) score += 4;
        else if (niche.includes(word)) score += 2;
        else if (summary.includes(word)) score += 1;
      }

      return { item, score };
    })
    .filter((entry) => entry.score >= 2)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((entry) => entry.item);
}

export async function buildPageContext(
  pathname: string,
  hostname: string,
): Promise<string> {
  const path = normalizePath(pathname);
  const subdomain = getSubdomain(hostname);

  // A niche subdomain renders the niche page at "/", so check it first.
  if (subdomain && subdomain !== "www" && subdomain !== "admin" && path === "/") {
    const niche = await describeNiche(subdomain);
    if (niche) return niche;
  }

  const staticContext = STATIC_PAGE_CONTEXT[path];
  if (staticContext) return staticContext;

  const resourceMatch = path.match(/^\/resources\/([^/]+)$/);
  if (resourceMatch) {
    const resource = await describeResource(resourceMatch[1]);
    if (resource) return resource;
  }

  const nicheMatch = path.match(/^\/niche\/([^/]+)$/);
  if (nicheMatch) {
    const niche = await describeNiche(nicheMatch[1]);
    if (niche) return niche;
  }

  return "A page on 1section. If the visitor asks something page-specific you are unsure about, ask them to email support.";
}

export async function buildKnowledgeContext(
  pathname: string,
  hostname: string,
  messages: ChatMessage[],
): Promise<string> {
  const latestUserMessage =
    [...messages].reverse().find((message) => message.role === "user")
      ?.content ?? "";

  const [pageContext, catalog] = await Promise.all([
    buildPageContext(pathname, hostname),
    loadCatalog(),
  ]);

  const matches = findRelevantProducts(catalog, latestUserMessage);
  const details = (
    await Promise.all(matches.map((item) => describeResource(item.slug)))
  ).filter((detail): detail is string => Boolean(detail));

  const catalogText = catalog.map(catalogLine).join("; ");

  return [
    `Current page: ${pageContext}`,
    catalogText ? `Guide database: ${catalogText}.` : null,
    details.length ? `Relevant guide details: ${details.join(" ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function truncate(value: string, max = 140): string {
  if (value.length <= max) return value;
  const slice = value.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

function toOneSentence(reply: string): string {
  const firstLine = reply.trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return "";

  const sentences = firstLine.split(/(?<=[.!?])\s+/);
  const first = sentences[0]?.trim() ?? "";
  const chosen =
    first.length < 25 && sentences[1] ? sentences[1].trim() : first;

  return truncate(chosen, 280);
}

function withFriendlyEmoji(reply: string, userMessage: string): string {
  if (/\p{Extended_Pictographic}/u.test(reply)) return reply;
  if (
    /\b(refund|payment|order|problem|issue|broken|error|charged|charge)\b/i.test(
      userMessage,
    )
  ) {
    return reply;
  }

  const isGreeting = /\b(hi|hello|hey|yo)\b/i.test(userMessage);
  const isCasual =
    /\b(thanks|thank you|okay|ok|cool|great|nice|love)\b/i.test(userMessage);
  if (!isGreeting && !isCasual) return reply;

  return `${reply} ${isGreeting ? "👋" : "😊"}`;
}

export async function generateCustomerServiceReply(
  messages: ChatMessage[],
  pageContext: string,
): Promise<string> {
  if (!env.GROQ_API_KEY) {
    throw new ApiError(
      503,
      "Chat is unavailable right now. Please email support@1section.com.",
      { code: "CHAT_UNAVAILABLE" },
    );
  }

  const systemPrompt = [
    "You are the customer service assistant for 1section, a digital learning platform that sells practical guides as one-time purchases.",
    "How to answer:",
    "- Reply in English only.",
    "- Reply with exactly ONE sentence, like a busy human: direct, warm, and short.",
    "- Keep it under 25 words; name at most one guide, and only when it directly fits a specific problem.",
    "- Do not list product names for general questions; describe the category instead.",
    "- Only mention a guide by name when the user described a specific problem it solves, or asked about that exact guide.",
    "- Emojis are okay but rare: at most one, only when it genuinely fits; never for refunds, payments, or problems.",
    "- No lists, no bullet points, no extra tips or disclaimers.",
    "- Only ask when the answer depends on their situation; for general catalog or policy questions, answer directly without product names.",
    "- If you do not know the person's situation, ask one short question instead of guessing or giving a solution.",
    "- Ask only while the situation is unclear; once they describe their problem, answer it directly.",
    "- Never assume their goal, problem, age, income, or relationship status.",
    "- Use the page and guide database details below to answer accurately.",
    "- Never claim you cannot see information that is present below.",
    "- Never invent prices, discounts, policies, or account details.",
    "- For refunds: digital sales are generally final, but billing errors and broken access are reviewed case by case.",
    "- Never ask for order numbers, emails, or payment details in chat; send those cases to " +
      SUPPORT_EMAIL +
      ".",
    "Context:",
    pageContext,
  ].join("\n");

  const history = messages.slice(-6).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        temperature: 0.4,
        max_tokens: 200,
        ...(env.GROQ_MODEL.includes("gpt-oss")
          ? { reasoning_effort: "low" }
          : {}),
        messages: [{ role: "system", content: systemPrompt }, ...history],
      }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    },
  ).catch(() => null);

  if (!response || !response.ok) {
    console.error(
      "[chat] Groq request failed:",
      response ? `${response.status} ${response.statusText}` : "network error",
    );
    throw new ApiError(
      502,
      "Chat is unavailable right now. Please email support@1section.com.",
      { code: "CHAT_UNAVAILABLE" },
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string } }> }
    | null;

  const reply = payload?.choices?.[0]?.message?.content ?? "";
  const sentence = toOneSentence(reply);

  if (!sentence) {
    throw new ApiError(
      502,
      "Chat is unavailable right now. Please email support@1section.com.",
      { code: "CHAT_UNAVAILABLE" },
    );
  }

  const latestUserMessage =
    [...messages].reverse().find((message) => message.role === "user")
      ?.content ?? "";

  return withFriendlyEmoji(sentence, latestUserMessage);
}

import type { EbookRichTextNode } from "./types";

export type EbookVisualType =
  | "stat-row"
  | "process"
  | "comparison"
  | "bar-chart"
  | "key-points";

export type EbookVisualItem = {
  label: string;
  value?: string;
  detail?: string;
};

/** Legacy structured spec (kept for backward compatibility with old nodes). */
export type EbookVisualSpec = {
  type: EbookVisualType;
  title: string;
  subtitle?: string;
  items: EbookVisualItem[];
};

/** AI-generated SVG visual. Preferred format. */
export type EbookVisualSvg = {
  svg: string;
  alt?: string;
};

export const VISUAL_TYPES: EbookVisualType[] = [
  "key-points",
  "stat-row",
  "process",
  "comparison",
  "bar-chart",
];

export const VISUAL_LABELS: Record<EbookVisualType, string> = {
  "key-points": "Key Points",
  "stat-row": "Key Stats",
  process: "Process",
  comparison: "Comparison",
  "bar-chart": "Bar Chart",
};

export function isVisualSpec(value: unknown): value is EbookVisualSpec {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.type === "string" &&
    VISUAL_TYPES.includes(v.type as EbookVisualType) &&
    typeof v.title === "string" &&
    Array.isArray(v.items)
  );
}

export function visualSpecOf(node: EbookRichTextNode): EbookVisualSpec | null {
  const spec = node.attrs?.spec;
  if (!isVisualSpec(spec)) return null;
  return spec;
}

export function visualSvgOf(node: EbookRichTextNode): string | null {
  const svg = node.attrs?.svg;
  if (typeof svg !== "string" || !svg.trim()) return null;
  const safe = sanitizeEbookSvg(svg);
  return safe || null;
}

export function visualAltOf(node: EbookRichTextNode): string {
  const alt = node.attrs?.alt;
  if (typeof alt === "string" && alt.trim()) return alt.trim().slice(0, 200);
  const spec = visualSpecOf(node);
  return spec?.title || "Visual";
}

export function sanitizeVisualSpec(input: EbookVisualSpec): EbookVisualSpec {
  const items = (input.items || [])
    .slice(0, 6)
    .map((item) => ({
      label: String(item.label || "").trim().slice(0, 80),
      ...(item.value ? { value: String(item.value).trim().slice(0, 40) } : {}),
      ...(item.detail ? { detail: String(item.detail).trim().slice(0, 120) } : {}),
    }))
    .filter((i) => i.label || i.value);
  return {
    type: VISUAL_TYPES.includes(input.type) ? input.type : "stat-row",
    title: String(input.title || "Visual").trim().slice(0, 120),
    ...(input.subtitle ? { subtitle: String(input.subtitle).trim().slice(0, 160) } : {}),
    items: items.length
      ? items
      : [{ label: "Point 1" }, { label: "Point 2" }, { label: "Point 3" }],
  };
}

export function nextVisualType(type: EbookVisualType): EbookVisualType {
  const idx = VISUAL_TYPES.indexOf(type);
  return VISUAL_TYPES[(idx + 1) % VISUAL_TYPES.length];
}

export function preferredVisualTypes(text: string): EbookVisualType[] {
  const t = text.toLowerCase();
  const hasNumber = /(\d|\$|%|rp|idr|usd)/i.test(text);
  const hasStep = /(step|steps|first|second|third|then|next|finally|tahap|langkah|mulai|kemudian|akhirnya)/i.test(t);
  const hasCompare = /(vs\.?|versus|before|after|compare|comparison|pros|cons|old|new|sebelum|sesudah|dibanding)/i.test(t);
  if (hasNumber) return ["bar-chart", "stat-row", "key-points", "comparison", "process"];
  if (hasStep) return ["process", "key-points", "stat-row", "comparison", "bar-chart"];
  if (hasCompare) return ["comparison", "key-points", "stat-row", "process", "bar-chart"];
  return ["key-points", "stat-row", "process", "comparison", "bar-chart"];
}

const DANGEROUS_SVG =
  /<(script|foreignObject|iframe|object|embed|link|meta|base|form|input|button|textarea|select)[\s>]/i;
const EVENT_ATTR = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URL = /(href|xlink:href|src)\s*=\s*("|\')\s*(javascript:|data:text\/html)/gi;
const EXTERNAL_URL = /(href|xlink:href|src)\s*=\s*("|\')\s*https?:\/\//gi;

/** Sanitize AI-generated SVG. Returns empty string if unsafe/invalid. */
export function sanitizeEbookSvg(input: string): string {
  let svg = String(input || "").trim();
  if (!svg) return "";
  // strip code fences
  svg = svg.replace(/^```(?:svg|xml|html)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = svg.toLowerCase().indexOf("<svg");
  const end = svg.toLowerCase().lastIndexOf("</svg>");
  if (start < 0 || end < 0 || end <= start) return "";
  svg = svg.slice(start, end + "</svg>".length);
  if (svg.length > 200_000) return "";
  if (DANGEROUS_SVG.test(svg)) return "";
  svg = svg.replace(EVENT_ATTR, "");
  if (JS_URL.test(svg)) return "";
  // remove external URLs in common attributes (keep data:image safe? no, disallow for simplicity)
  svg = svg.replace(EXTERNAL_URL, '$1=$2#');
  // disallow xml entities that can be used for exfil/obfuscation; basic guard
  if (/<!DOCTYPE|<!ENTITY/i.test(svg)) return "";
  if (!/^<svg[\s>]/i.test(svg) || !/<\/svg>\s*$/i.test(svg)) return "";
  return svg;
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

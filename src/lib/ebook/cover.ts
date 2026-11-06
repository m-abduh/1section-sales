import type {
  EbookContent,
  EbookCover,
  EbookCoverBackground,
  EbookCoverTemplate,
} from "./types";

/**
 * Bump this when a template's visual output changes so every existing cover
 * is marked stale and gets re-rendered on the next save.
 */
const COVER_VERSION = 1;

export const COVER_WIDTH = 874;
export const COVER_HEIGHT = 1240;

export const COVER_TEMPLATES: {
  id: EbookCoverTemplate;
  label: string;
  hint: string;
}[] = [
  { id: "minimal", label: "Minimal", hint: "Bersih dan lapang" },
  { id: "editorial", label: "Editorial", hint: "Aksen tegas di kiri" },
  { id: "bold", label: "Bold", hint: "Judul besar, kontras tinggi" },
  { id: "gradient", label: "Gradient", hint: "Warna modern" },
  { id: "photo", label: "Foto", hint: "Gambar penuh + overlay" },
];

export const COVER_ACCENTS = [
  "#B68A42",
  "#F2C879",
  "#1F2421",
  "#0F766E",
  "#1D4ED8",
  "#7C3AED",
  "#9D174D",
  "#C2410C",
];

export const TEMPLATE_DEFAULTS: Record<
  EbookCoverTemplate,
  Pick<EbookCover, "accent" | "background">
> = {
  minimal: {
    accent: "#B68A42",
    background: { type: "solid", color: "#F7F4EE" },
  },
  editorial: {
    accent: "#1F2421",
    background: { type: "solid", color: "#FFFFFF" },
  },
  bold: {
    accent: "#F2C879",
    background: { type: "solid", color: "#101010" },
  },
  gradient: {
    accent: "#F2C879",
    background: { type: "gradient", from: "#0B1220", to: "#1D4ED8", angle: 135 },
  },
  photo: {
    accent: "#FFFFFF",
    background: { type: "gradient", from: "#111827", to: "#334155", angle: 160 },
  },
};

export const DEFAULT_COVER: EbookCover = {
  template: "minimal",
  ...TEMPLATE_DEFAULTS.minimal,
  showDescription: true,
  showBadge: true,
};

/**
 * Applies a template while keeping an uploaded background image, so switching
 * layouts does not throw away the user's photo.
 */
export function coverWithTemplate(
  cover: EbookCover,
  template: EbookCoverTemplate,
): EbookCover {
  const defaults = TEMPLATE_DEFAULTS[template];
  const keepImage = cover.background.type === "image";
  return {
    ...cover,
    template,
    accent: defaults.accent,
    background: keepImage ? cover.background : defaults.background,
  };
}

export function coverBackgroundCss(background: EbookCoverBackground): string {
  if (background.type === "solid") return background.color;
  if (background.type === "gradient") {
    return `linear-gradient(${background.angle ?? 135}deg, ${background.from}, ${background.to})`;
  }
  return "#111827";
}

export type CoverInk = {
  fg: string;
  muted: string;
  line: string;
};

/** Picks readable text colours for the chosen background. */
export function readableInk(background: EbookCoverBackground): CoverInk {
  if (background.type === "image") {
    return {
      fg: "#FFFFFF",
      muted: "rgba(255,255,255,0.78)",
      line: "rgba(255,255,255,0.34)",
    };
  }

  const base =
    background.type === "solid"
      ? background.color
      : mixHex(background.from, background.to, 0.5);
  const [r, g, b] = hexToRgb(base);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  if (luminance < 0.5) {
    return {
      fg: "#FFFFFF",
      muted: "rgba(255,255,255,0.76)",
      line: "rgba(255,255,255,0.32)",
    };
  }
  return {
    fg: "#1F2421",
    muted: "rgba(31,36,33,0.66)",
    line: "rgba(31,36,33,0.22)",
  };
}

function hexToRgb(value: string): [number, number, number] {
  const hex = normalizeHex(value).slice(1);
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

function mixHex(from: string, to: string, ratio: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const channel = (index: number) =>
    Math.round(a[index] + (b[index] - a[index]) * ratio)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

export function normalizeHex(value: string): string {
  const hex = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return "#000000";
}

/**
 * Fingerprint of everything that affects the rendered cover, including the
 * text it displays. Stored next to the rendered URL to detect stale covers.
 */
export function coverFingerprint(content: EbookContent): string {
  const cover = content.cover;
  if (!cover) return "";
  return hash(
    JSON.stringify({
      version: COVER_VERSION,
      template: cover.template,
      accent: cover.accent,
      background: cover.background,
      showDescription: cover.showDescription,
      showBadge: cover.showBadge,
      brand: content.brand,
      niche: content.niche,
      title: content.title,
      description: content.description,
      chapters: content.chapters.length,
    }),
  );
}

export function isCoverStale(content: EbookContent): boolean {
  const cover = content.cover;
  if (!cover) return false;
  return !cover.renderedUrl || cover.renderedHash !== coverFingerprint(content);
}

function hash(value: string): string {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }
  return (result >>> 0).toString(36);
}

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
const COVER_VERSION = 18;

export const COVER_WIDTH = 874;
export const COVER_HEIGHT = 1240;

export const COVER_TEMPLATES: {
  id: EbookCoverTemplate;
  label: string;
  hint: string;
}[] = [
  { id: "signature", label: "Signature", hint: "Elegan, aksen halus" },
  { id: "minimal", label: "Minimal", hint: "Bersih dengan garis" },
  { id: "editorial", label: "Editorial", hint: "Tegas, aksen samping" },
  { id: "bold", label: "Bold", hint: "Judul kuat, kontras" },
  { id: "gradient", label: "Gradient", hint: "Atmosfer, glow modern" },
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
  signature: {
    accent: "#B68A42",
    background: { type: "gradient", from: "#F8F6F1", to: "#ECE3D3", angle: 135 },
  },
  minimal: {
    accent: "#B68A42",
    background: { type: "gradient", from: "#F7F4EE", to: "#EBE3D5", angle: 135 },
  },
  editorial: {
    accent: "#1F2421",
    background: { type: "gradient", from: "#FFFFFF", to: "#EDEDEB", angle: 135 },
  },
  bold: {
    accent: "#F2C879",
    background: { type: "gradient", from: "#101010", to: "#1C1C1C", angle: 135 },
  },
  gradient: {
    accent: "#F2C879",
    background: { type: "gradient", from: "#0B1220", to: "#1D4ED8", angle: 135 },
  },
};

export const DEFAULT_COVER: EbookCover = {
  template: "signature",
  ...TEMPLATE_DEFAULTS.signature,
  showDescription: true,
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

/**
 * Legacy covers used a solid colour. Turn it into a subtle gradient of the
 * same colour so only gradient and photo backgrounds remain.
 */
export function normalizeCoverBackground(
  background: EbookCoverBackground,
): EbookCoverBackground {
  if (background.type !== "solid") return background;
  return {
    type: "gradient",
    from: background.color,
    to: mixHex(background.color, "#000000", 0.16),
    angle: 135,
  };
}

export function normalizeCover(cover: EbookCover): EbookCover {
  let current = cover;
  if ((current.template as string) === "photo") {
    current = { ...current, template: "signature" };
  }
  const background = normalizeCoverBackground(current.background);
  return background === current.background ? current : { ...current, background };
}

export function normalizeEbookCover(content: EbookContent): EbookContent {
  if (!content.cover) return content;
  const cover = normalizeCover(content.cover);
  return cover === content.cover ? content : { ...content, cover };
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

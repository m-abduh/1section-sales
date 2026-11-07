export type EbookReference = {
  title: string;
  url: string;
};

export type EbookChapterReference = {
  title: string;
  url?: string;
};

export type EbookSection = {
  title: string;
  paragraphs: string[];
};

/**
 * ProseMirror/Tiptap JSON node. Chapter bodies are stored as a flat list of
 * block nodes (paragraph, heading, image, list) so both DOCX and PDF exports
 * can render the exact same structure the editor shows.
 */
export type EbookRichTextValue =
  | string
  | number
  | boolean
  | null
  | EbookRichTextValue[];

export type EbookRichTextAttrs = Record<string, EbookRichTextValue>;

export type EbookRichTextMark = {
  type: string;
  attrs?: EbookRichTextAttrs;
};

export type EbookRichTextNode = {
  type: string;
  attrs?: EbookRichTextAttrs;
  content?: EbookRichTextNode[];
  text?: string;
  marks?: EbookRichTextMark[];
};

export type EbookChapter = {
  title: string;
  /** Materi/brief yang dipakai untuk mengisi bab ini lewat AI. */
  brief?: string;
  intro?: string[];
  sections: EbookSection[];
  /** Rich text body. Takes precedence over `intro` + `sections` when present. */
  body?: EbookRichTextNode[];
  references?: EbookChapterReference[];
};

export type EbookCoverTemplate =
  | "minimal"
  | "editorial"
  | "bold"
  | "gradient"
  | "photo";

export type EbookCoverBackground =
  | { type: "solid"; color: string }
  | { type: "gradient"; from: string; to: string; angle?: number }
  | { type: "image"; url: string; overlay?: number };

/**
 * Cover design settings. The cover itself is a reusable React/Tailwind
 * component that is rasterised in the browser and stored in Cloudinary, so
 * exports only need `renderedUrl`.
 */
export type EbookCover = {
  template: EbookCoverTemplate;
  accent: string;
  background: EbookCoverBackground;
  showDescription: boolean;
  showBadge: boolean;
  /** Cloudinary URL of the last rendered A5 JPEG. */
  renderedUrl?: string;
  /** Fingerprint of the inputs used for the last render. */
  renderedHash?: string;
};

export type EbookContent = {
  brand: string;
  niche: string;
  title: string;
  description: string;
  /** Brief untuk mengisi judul + deskripsi cover lewat AI. */
  metadataBrief?: string;
  introduction: string[];
  /** Rich text introduction. Takes precedence over `introduction` when present. */
  introductionBody?: EbookRichTextNode[];
  /** Brief untuk mengisi pendahuluan lewat AI. */
  introductionBrief?: string;
  chapters: EbookChapter[];
  conclusion: string[];
  /** Brief untuk mengisi kesimpulan lewat AI. */
  conclusionBrief?: string;
  references: EbookReference[];
  /** Brief untuk mengisi daftar referensi lewat AI. */
  referencesBrief?: string;
  about: string[];
  /** Brief untuk mengisi about lewat AI. */
  aboutBrief?: string;
  cover?: EbookCover;
};

export type TocEntry = {
  key: string;
  label: string;
  level: 1 | 2;
};

export function tocEntriesOf(ebook: EbookContent): TocEntry[] {
  return [
    { key: "intro", label: "Pendahuluan", level: 1 },
    ...ebook.chapters.map((chapter, index) => ({
      key: `chapter-${index}`,
      label: `${String(index + 1).padStart(2, "0")}. ${chapter.title}`,
      level: 2 as const,
    })),
    { key: "conclusion", label: "Kesimpulan", level: 1 },
    { key: "references", label: "Referensi", level: 1 },
    { key: "about", label: "About", level: 1 },
  ];
}

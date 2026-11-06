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
export type EbookRichTextAttrs = Record<
  string,
  string | number | boolean | null
>;

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
  intro?: string[];
  sections: EbookSection[];
  /** Rich text body. Takes precedence over `intro` + `sections` when present. */
  body?: EbookRichTextNode[];
  references?: EbookChapterReference[];
};

export type EbookContent = {
  brand: string;
  niche: string;
  title: string;
  description: string;
  introduction: string[];
  chapters: EbookChapter[];
  conclusion: string[];
  references: EbookReference[];
  about: string[];
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

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

export type EbookChapter = {
  title: string;
  intro?: string[];
  sections: EbookSection[];
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

import type {
  EbookChapter,
  EbookRichTextMark,
  EbookRichTextNode,
} from "./types";

export function richTextParagraph(text: string): EbookRichTextNode {
  return {
    type: "paragraph",
    content: text.trim() ? [{ type: "text", text }] : undefined,
  };
}

export function richTextHeading(
  level: 2 | 3,
  text: string,
): EbookRichTextNode {
  return {
    type: "heading",
    attrs: { level },
    content: text.trim() ? [{ type: "text", text }] : undefined,
  };
}

/**
 * Returns the editable body for a chapter. Chapters generated before rich text
 * existed only have `intro` + `sections`, so they are converted on the fly.
 */
export function richTextFromChapter(chapter: EbookChapter): EbookRichTextNode[] {
  if (chapter.body !== undefined) return chapter.body;

  const nodes: EbookRichTextNode[] = [];
  for (const text of chapter.intro ?? []) {
    if (text.trim()) nodes.push(richTextParagraph(text));
  }
  for (const section of chapter.sections) {
    if (section.title.trim()) nodes.push(richTextHeading(3, section.title));
    for (const text of section.paragraphs) {
      if (text.trim()) nodes.push(richTextParagraph(text));
    }
  }
  return nodes;
}

export function richTextIsEmpty(nodes: EbookRichTextNode[] | undefined): boolean {
  if (!nodes || nodes.length === 0) return true;
  return richTextPlainText(nodes).trim().length === 0;
}

export function richTextPlainText(nodes: EbookRichTextNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.text ?? "";
      if (node.type === "hardBreak") return "\n";
      if (!node.content?.length) return "";
      return richTextInlineText(node.content);
    })
    .filter((value) => value.length > 0)
    .join(" ");
}

function richTextInlineText(nodes: EbookRichTextNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.text ?? "";
      if (node.type === "hardBreak") return "\n";
      if (!node.content?.length) return "";
      return richTextInlineText(node.content);
    })
    .join("");
}

export function richTextMarksOf(node: EbookRichTextNode): {
  bold: boolean;
  italic: boolean;
} {
  const marks = node.marks ?? [];
  return {
    bold: marks.some((mark) => mark.type === "bold"),
    italic: marks.some((mark) => mark.type === "italic"),
  };
}

export function richTextImageSrc(node: EbookRichTextNode): string | null {
  if (node.type !== "image") return null;
  const src = node.attrs?.src;
  return typeof src === "string" ? src : null;
}

export function richTextImageAlt(node: EbookRichTextNode): string {
  const alt = node.attrs?.alt;
  return typeof alt === "string" ? alt : "";
}

export type RichTextRun = {
  text: string;
  marks: EbookRichTextMark[];
};

/** Flattens inline content into text runs, preserving bold/italic marks. */
export function richTextRuns(nodes: EbookRichTextNode[]): RichTextRun[] {
  const runs: RichTextRun[] = [];
  for (const node of nodes) {
    if (node.type === "text" && node.text) {
      runs.push({ text: node.text, marks: node.marks ?? [] });
      continue;
    }
    if (node.type === "hardBreak") {
      runs.push({ text: "\n", marks: [] });
      continue;
    }
    if (node.content?.length) runs.push(...richTextRuns(node.content));
  }
  return runs;
}

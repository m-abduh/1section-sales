import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  HorizontalPositionRelativeFrom,
  ImageRun,
  PageNumber,
  Packer,
  Paragraph,
  SectionType,
  ShadingType,
  Tab,
  TabStopType,
  Table,
  TableCell,
  TableLayoutType,
  TableOfContents,
  TableRow,
  TextRun,
  TextWrappingType,
  VerticalPositionRelativeFrom,
  WidthType,
} from "docx";
import { estimatePageNumbersWith } from "docx/layout";
import { imageInfoOf } from "./image";
import {
  richTextImageSrc,
  richTextIsEmpty,
  richTextPlainText,
  richTextRuns,
} from "./rich-text";
import type { EbookContent, EbookRichTextMark, EbookRichTextNode } from "./types";

const RUNNING_MATTER_COLOR = "7A8589";
const RUNNING_MATTER_OFFSET = 432;
const CHAPTER_NUMBER_COLOR = "B68A42";

type ParagraphOptions = {
  heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  pageBreakBefore?: boolean;
  indent?: { firstLine?: number; left?: number };
  bottomBorder?: boolean;
};

function docxParagraph(
  text: string,
  style?: string,
  options: ParagraphOptions = {},
) {
  return new Paragraph({
    text,
    style,
    heading: options.heading,
    alignment: options.alignment,
    pageBreakBefore: options.pageBreakBefore,
    indent: options.indent,
    border: options.bottomBorder
      ? {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: "666666",
            space: 1,
          },
        }
      : undefined,
  });
}

function splitLongText(text: string, maxChars = 900): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return [trimmed];
  const parts: string[] = [];
  let rest = trimmed;
  while (rest.length > maxChars) {
    let cut = rest.lastIndexOf(". ", maxChars);
    if (cut < maxChars * 0.4) cut = rest.lastIndexOf(" ", maxChars);
    if (cut < maxChars * 0.3) cut = maxChars;
    parts.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

function docxBodyParagraphs(text: string): Paragraph[] {
  const parts = splitLongText(text);
  if (parts.length === 0) return [];
  const paragraphs: Paragraph[] = [];
  parts.forEach((part, idx) => {
    paragraphs.push(
      new Paragraph({
        style: "Normal",
        indent: idx === 0 ? { firstLine: 360 } : { firstLine: 0 },
        children: [new TextRun({ text: part, font: "Montserrat" })],
      }),
    );
  });
  return paragraphs;
}

function createRunningHeader(kicker: string, sectionTitle: string) {
  return new Header({
    children: [
      new Paragraph({
        style: "RunningMatter",
        tabStops: [{ type: TabStopType.RIGHT, position: 6123 }],
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 4,
            color: RUNNING_MATTER_COLOR,
            space: 6,
          },
        },
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: kicker,
            font: "Montserrat",
            size: 16,
            bold: true,
            color: RUNNING_MATTER_COLOR,
          }),
          new TextRun({
            children: [new Tab()],
            font: "Montserrat",
            size: 16,
            color: RUNNING_MATTER_COLOR,
          }),
          new TextRun({
            text: sectionTitle,
            font: "Montserrat",
            size: 16,
            color: RUNNING_MATTER_COLOR,
          }),
        ],
      }),
    ],
  });
}

function createRunningFooter() {
  return new Footer({
    children: [
      new Paragraph({
        style: "RunningMatter",
        alignment: AlignmentType.CENTER,
        border: {
          top: {
            style: BorderStyle.SINGLE,
            size: 4,
            color: RUNNING_MATTER_COLOR,
            space: 6,
          },
        },
        spacing: { before: 120 },
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
            font: "Montserrat",
            size: 16,
            color: RUNNING_MATTER_COLOR,
          }),
        ],
      }),
    ],
  });
}

function createSection(
  children: (Paragraph | Table | TableOfContents)[],
  sectionTitle: string | undefined,
  kicker: string,
  options: { startsPageNumber?: boolean; bleed?: boolean } = {},
) {
  const isCover = sectionTitle === undefined;
  const blankHeader = new Header({ children: [new Paragraph("")] });
  const blankFooter = new Footer({ children: [new Paragraph("")] });

  return {
    properties: {
      type: SectionType.NEXT_PAGE,
      titlePage: isCover,
      page: {
        size: { width: 8391, height: 11906 },
        pageNumbers: options.startsPageNumber ? { start: 0 } : undefined,
        margin: options.bleed
          ? { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 }
          : {
              top: 1134,
              right: 1134,
              bottom: 1134,
              left: 1134,
              header: RUNNING_MATTER_OFFSET,
              footer: RUNNING_MATTER_OFFSET,
            },
      },
    },
    headers: {
      default: isCover ? blankHeader : createRunningHeader(kicker, sectionTitle),
      first: blankHeader,
    },
    footers: {
      default: isCover ? blankFooter : createRunningFooter(),
      first: blankFooter,
    },
    children,
  };
}

function referenceLine(reference: { title: string; url?: string }) {
  return reference.url
    ? `${reference.title} ${reference.url}`
    : reference.title;
}

type DocxImageCache = Map<string, Buffer | null>;

async function loadDocxImage(
  src: string,
  cache: DocxImageCache,
): Promise<Buffer | null> {
  if (cache.has(src)) return cache.get(src) ?? null;
  let buffer: Buffer | null = null;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
      cache.set(src, null);
      return null;
    }
    const response = await fetch(src, { signal: AbortSignal.timeout(15000) });
    if (response.ok) {
      buffer = Buffer.from(await response.arrayBuffer());
    }
  } catch {
    buffer = null;
  }
  cache.set(src, buffer);
  return buffer;
}

async function loadCoverImage(
  ebook: EbookContent,
  images: DocxImageCache,
): Promise<{ data: Buffer; type: "png" | "jpg" } | null> {
  const src = ebook.cover?.renderedUrl;
  if (!src) return null;
  const buffer = await loadDocxImage(src, images);
  if (!buffer) return null;
  const info = imageInfoOf(buffer);
  if (!info || info.type === "webp") return null;
  return { data: buffer, type: info.type };
}

function docxRuns(nodes: EbookRichTextNode[]): TextRun[] {
  const runs: TextRun[] = [];
  for (const run of richTextRuns(nodes)) {
    if (run.text.length === 0) continue;
    const marks = run.marks.map((mark) => mark.type);
    const lines = run.text.split("\n");
    lines.forEach((line, index) => {
      runs.push(
        new TextRun({
          text: line,
          font: "Montserrat",
          bold: marks.includes("bold"),
          italics: marks.includes("italic"),
          break: index > 0 ? 1 : undefined,
        }),
      );
    });
  }
  return runs;
}

function docxRunsColored(nodes: EbookRichTextNode[], color: string): TextRun[] {
  const runs: TextRun[] = [];
  for (const run of richTextRuns(nodes)) {
    if (run.text.length === 0) continue;
    const marks = run.marks.map((mark) => mark.type);
    const lines = run.text.split("\n");
    lines.forEach((line, index) => {
      runs.push(
        new TextRun({
          text: line,
          font: "Montserrat",
          bold: marks.includes("bold"),
          italics: marks.includes("italic"),
          color,
          break: index > 0 ? 1 : undefined,
        }),
      );
    });
  }
  return runs;
}

async function docxImageParagraph(
  node: EbookRichTextNode,
  images: DocxImageCache,
): Promise<Paragraph | null> {
  const src = richTextImageSrc(node);
  if (!src) return null;
  const buffer = await loadDocxImage(src, images);
  if (!buffer) return null;
  const info = imageInfoOf(buffer);
  if (!info || info.type === "webp") return null;

  const scale = Math.min(400 / info.width, 320 / info.height, 1);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [
      new ImageRun({
        type: info.type === "png" ? "png" : "jpg",
        data: buffer,
        transformation: {
          width: Math.max(1, Math.round(info.width * scale)),
          height: Math.max(1, Math.round(info.height * scale)),
        },
      }),
    ],
  });
}

function extractRunSegment(
  runs: { text: string; marks: EbookRichTextMark[] }[],
  offset: number,
  length: number,
): { text: string; marks: EbookRichTextMark[] }[] {
  const out: { text: string; marks: EbookRichTextMark[] }[] = [];
  let pos = 0;
  let start = offset;
  let remaining = length;
  for (const run of runs) {
    const runStart = pos;
    const runEnd = pos + run.text.length;
    pos = runEnd;
    if (runEnd <= start) continue;
    if (runStart >= start + length) break;
    const from = Math.max(0, start - runStart);
    const to = Math.min(run.text.length, start + remaining - runStart);
    if (to > from) {
      out.push({ text: run.text.slice(from, to), marks: run.marks });
      remaining -= to - from;
      start = runEnd;
      if (remaining <= 0) break;
    }
  }
  return out;
}

function docxRunsFromSegments(
  segments: { text: string; marks: EbookRichTextMark[] }[],
): TextRun[] {
  const runs: TextRun[] = [];
  for (const run of segments) {
    if (run.text.length === 0) continue;
    const marks = run.marks.map((mark) => mark.type);
    const lines = run.text.split("\n");
    lines.forEach((line, index) => {
      runs.push(
        new TextRun({
          text: line,
          font: "Montserrat",
          bold: marks.includes("bold"),
          italics: marks.includes("italic"),
          break: index > 0 ? 1 : undefined,
        }),
      );
    });
  }
  return runs;
}

async function richDocxBlocks(
  nodes: EbookRichTextNode[],
  images: DocxImageCache,
  level = 0,
): Promise<(Paragraph | Table)[]> {
  const blocks: (Paragraph | Table)[] = [];

  for (const node of nodes) {
    if (node.type === "paragraph") {
      const plain = richTextPlainText([node]);
      if (plain.trim().length > 0) {
        const parts = splitLongText(plain);
        if (parts.length <= 1) {
          blocks.push(
            new Paragraph({
              children: docxRuns(node.content ?? []),
              style: "Normal",
              indent: { firstLine: 360 },
            }),
          );
        } else {
          const runs = richTextRuns(node.content ?? []);
          let cursor = 0;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            // find part position in plain text from cursor
            const idx = plain.indexOf(part, cursor);
            const start = idx >= 0 ? idx : cursor;
            const segment = extractRunSegment(runs, start, part.length);
            cursor = start + part.length;
            blocks.push(
              new Paragraph({
                children: segment.length
                  ? docxRunsFromSegments(segment)
                  : [new TextRun({ text: part, font: "Montserrat" })],
                style: "Normal",
                indent: i === 0 ? { firstLine: 360 } : { firstLine: 0 },
              }),
            );
          }
        }
      }
      continue;
    }

    if (node.type === "heading") {
      const text = richTextPlainText(node.content ?? []).trim();
      if (text) {
        const level = Number(node.attrs?.level ?? 3);
        blocks.push(
          docxParagraph(text, undefined, {
            heading:
              level <= 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          }),
        );
      }
      continue;
    }

    if (node.type === "bulletList" || node.type === "orderedList") {
      const ordered = node.type === "orderedList";
      let position = 1;
      for (const item of node.content ?? []) {
        const inline: EbookRichTextNode[] = [];
        const nested: EbookRichTextNode[] = [];
        for (const child of item.content ?? []) {
          if (child.type === "paragraph" || child.type === "heading") {
            inline.push(...(child.content ?? []));
          } else {
            nested.push(child);
          }
        }
        const marker = ordered ? `${position}.` : "•";
        const indent = 720 + level * 360;
        blocks.push(
          new Paragraph({
            style: "Normal",
            indent: { left: indent, hanging: 360 },
            tabStops: [{ type: TabStopType.LEFT, position: indent }],
            spacing: { before: 0, after: 0, line: 360, lineRule: "auto" },
            children: [
              new TextRun({ text: `${marker}\t` }),
              ...docxRuns(inline),
            ],
          }),
        );
        if (nested.length > 0) {
          blocks.push(...(await richDocxBlocks(nested, images, level + 1)));
        }
        position += 1;
      }
      continue;
    }

    if (node.type === "table") {
      blocks.push(await richDocxTable(node, images));
      continue;
    }

    if (node.type === "image") {
      const paragraph = await docxImageParagraph(node, images);
      if (paragraph) blocks.push(paragraph);
      continue;
    }

    if (node.type === "blockquote") {
      for (const child of node.content ?? []) {
        if (child.type === "paragraph") {
          const runs = docxRunsColored(
            child.content ?? [],
            CHAPTER_NUMBER_COLOR,
          );
          blocks.push(
            new Paragraph({
              style: "Normal",
              indent: { left: 360 },
              spacing: {
                before: 140,
                after: 100,
                line: 360,
                lineRule: "auto",
              },
              border: {
                left: {
                  style: BorderStyle.SINGLE,
                  size: 18,
                  color: CHAPTER_NUMBER_COLOR,
                  space: 14,
                },
              },
              shading: {
                type: ShadingType.CLEAR,
                color: "auto",
                fill: "F5F4F1",
              },
              children:
                runs.length > 0
                  ? runs
                  : [
                      new TextRun({
                        text: "",
                        color: CHAPTER_NUMBER_COLOR,
                      }),
                    ],
            }),
          );
        } else if (child.content?.length) {
          blocks.push(...(await richDocxBlocks(child.content, images)));
        }
      }
      continue;
    }

    if (node.content?.length) {
      blocks.push(...(await richDocxBlocks(node.content, images)));
    }
  }

  return blocks;
}

async function richDocxTable(
  node: EbookRichTextNode,
  images: DocxImageCache,
): Promise<Table> {
  const rows = (node.content ?? []).filter(
    (child) => child.type === "tableRow",
  );
  const tableRows: TableRow[] = [];

  for (const row of rows) {
    const cells = (row.content ?? []).filter(
      (child) => child.type === "tableCell" || child.type === "tableHeader",
    );
    const isHeader = cells.some((cell) => cell.type === "tableHeader");
    const tableCells: TableCell[] = [];

    for (const cell of cells) {
      const children = cell.content?.length
        ? await richDocxBlocks(cell.content, images)
        : [];

      if (isHeader) {
        const text = richTextPlainText(cell.content ?? []).trim();
        children.length = 0;
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text, bold: true, font: "Montserrat" }),
            ],
          }),
        );
      }

      if (children.length === 0) children.push(new Paragraph(""));

      tableCells.push(
        new TableCell({
          children,
          shading: isHeader
            ? { type: ShadingType.CLEAR, color: "auto", fill: "F4F4F5" }
            : undefined,
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
        }),
      );
    }

    tableRows.push(new TableRow({ children: tableCells, tableHeader: isHeader }));
  }

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.AUTOFIT,
  });
}

async function createDocument(
  ebook: EbookContent,
  images: DocxImageCache,
): Promise<Document> {
  const coverImage = await loadCoverImage(ebook, images);
  const coverText = [
    new Paragraph({
      spacing: { before: 2400, after: 120 },
      indent: { firstLine: 0 },
      children: [
        new TextRun({
          text: `${ebook.brand} · ${ebook.niche}`.toUpperCase(),
          font: "Montserrat",
          size: 18,
          bold: true,
          color: RUNNING_MATTER_COLOR,
        }),
      ],
    }),
    new Paragraph({
      indent: { firstLine: 0 },
      spacing: { before: 120, after: 360 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 12,
          color: CHAPTER_NUMBER_COLOR,
          space: 8,
        },
      },
      children: [new TextRun({ text: " " })],
    }),
    new Paragraph({
      style: "CoverTitle",
      indent: { firstLine: 0 },
      spacing: { before: 120, after: 240, line: 360, lineRule: "auto" },
      children: [
        new TextRun({
          text: ebook.title,
          font: "Montserrat",
          size: 56,
          bold: true,
          color: "1F2421",
        }),
      ],
    }),
    new Paragraph({
      indent: { firstLine: 0 },
      spacing: { before: 0, after: 240 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 4,
          color: RUNNING_MATTER_COLOR,
          space: 6,
        },
      },
      children: [new TextRun({ text: " " })],
    }),
    ...(ebook.description?.trim()
      ? [
          new Paragraph({
            style: "CoverDescription",
            indent: { firstLine: 0 },
            spacing: { before: 120, after: 120, line: 360, lineRule: "auto" },
            children: [
              new TextRun({
                text: ebook.description,
                font: "Montserrat",
                size: 22,
                color: RUNNING_MATTER_COLOR,
              }),
            ],
          }),
        ]
      : []),
  ];
  const coverVisual = coverImage
    ? [
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              type: coverImage.type,
              data: coverImage.data,
              transformation: { width: 559, height: 794 },
              floating: {
                horizontalPosition: {
                  relative: HorizontalPositionRelativeFrom.PAGE,
                  offset: 0,
                },
                verticalPosition: {
                  relative: VerticalPositionRelativeFrom.PAGE,
                  offset: 0,
                },
                wrap: { type: TextWrappingType.NONE },
                allowOverlap: true,
              },
            }),
          ],
        }),
      ]
    : null;

  const contents = [
    docxParagraph("Table of Contents", "SectionHeading"),
    new TableOfContents("Table of Contents", {
      headingStyleRange: "1-2",
      hyperlink: true,
      beginDirty: true,
    }),
  ];

  const introductionBody = ebook.introductionBody;
  const introduction = [
    docxParagraph("Introduction", undefined, {
      heading: HeadingLevel.HEADING_1,
    }),
    ...(introductionBody && !richTextIsEmpty(introductionBody)
      ? await richDocxBlocks(introductionBody, images)
      : ebook.introduction.flatMap((text) => docxBodyParagraphs(text))),
  ];

  const chapters: { title: string; children: (Paragraph | Table)[] }[] = [];
  for (const [index, chapter] of ebook.chapters.entries()) {
    const children: (Paragraph | Table)[] = [
      new Paragraph({
        style: "Normal",
        indent: { firstLine: 0 },
        spacing: { before: 240, after: 0, line: 240, lineRule: "auto" },
        children: [
          new TextRun({
            text: `${String(index + 1).padStart(2, "0")}`,
            font: "Montserrat",
            size: 56,
            bold: true,
            color: CHAPTER_NUMBER_COLOR,
          }),
        ],
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        indent: { firstLine: 0 },
        spacing: { before: 40, after: 120, line: 360, lineRule: "auto" },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 8,
            color: CHAPTER_NUMBER_COLOR,
            space: 18,
          },
        },
        children: [
          new TextRun({
            text: chapter.title,
            font: "Montserrat",
            size: 44,
            bold: true,
          }),
        ],
      }),
    ];

    if (chapter.body !== undefined) {
      children.push(...(await richDocxBlocks(chapter.body, images)));
    } else {
      (chapter.intro ?? []).forEach((text) =>
        children.push(...docxBodyParagraphs(text)),
      );

      chapter.sections.forEach((section) => {
        children.push(
          docxParagraph(section.title, undefined, {
            heading: HeadingLevel.HEADING_3,
          }),
        );
        section.paragraphs.forEach((text) =>
          children.push(...docxBodyParagraphs(text)),
        );
      });
    }

    if (chapter.references?.length) {
      children.push(
        docxParagraph("Research References", "ChapterReferenceLabel"),
        ...chapter.references.map((reference) =>
          docxParagraph(referenceLine(reference), "ChapterReference"),
        ),
      );
    }

    chapters.push({ title: `${index + 1}. ${chapter.title}`, children });
  }

  const conclusion = [
    docxParagraph("Conclusion", undefined, {
      heading: HeadingLevel.HEADING_1,
    }),
    ...(ebook.conclusionBody && !richTextIsEmpty(ebook.conclusionBody)
      ? await richDocxBlocks(ebook.conclusionBody, images)
      : ebook.conclusion.flatMap((text) => docxBodyParagraphs(text))),
  ];

  const references = [
    docxParagraph("References", undefined, {
      heading: HeadingLevel.HEADING_1,
    }),
    ...ebook.references.map((reference, index) =>
      docxParagraph(`[${index + 1}] ${reference.title} ${reference.url}`),
    ),
  ];

  const about = [
    docxParagraph("About", undefined, {
      heading: HeadingLevel.HEADING_1,
    }),
    ...(ebook.aboutBody && !richTextIsEmpty(ebook.aboutBody)
      ? await richDocxBlocks(ebook.aboutBody, images)
      : ebook.about.flatMap((text) => docxBodyParagraphs(text))),
  ];

  const kicker = `${ebook.brand} · ${ebook.niche}`;
  const coverSections = coverVisual
    ? [
        createSection(coverVisual, undefined, kicker, {
          startsPageNumber: true,
          bleed: true,
        }),
        createSection(coverText, undefined, kicker),
      ]
    : [createSection(coverText, undefined, kicker, { startsPageNumber: true })];
  const sections = [
    ...coverSections,
    createSection(contents, "DAFTAR ISI", kicker),
    createSection(introduction, "PENDAHULUAN", kicker),
    ...chapters.map(({ title, children }) =>
      createSection(children, title, kicker),
    ),
    createSection(conclusion, "KESIMPULAN", kicker),
    createSection(references, "REFERENSI", kicker),
    createSection(about, "ABOUT", kicker),
  ];

  return new Document({
    pageNumbers: estimatePageNumbersWith({ guess: true }),
    features: { updateFields: true },
    styles: {
      default: {
        document: {
          run: { font: "Montserrat", size: 24 },
          paragraph: { spacing: { after: 0, line: 360, lineRule: "auto" } },
        },
        heading1: {
          run: { font: "Montserrat", size: 44, bold: true, color: "1F2421" },
          paragraph: {
            indent: { firstLine: 0 },
            keepNext: true,
            spacing: { before: 480, after: 360, line: 360, lineRule: "auto" },
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 10,
                color: CHAPTER_NUMBER_COLOR,
                space: 20,
              },
            },
          },
        },
        heading2: {
          run: { font: "Montserrat", size: 44, bold: true, color: "1F2421" },
          paragraph: {
            indent: { firstLine: 0 },
            keepNext: true,
            spacing: { before: 320, after: 240, line: 360, lineRule: "auto" },
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: CHAPTER_NUMBER_COLOR,
                space: 18,
              },
            },
          },
        },
        heading3: {
          run: { font: "Montserrat", size: 28, bold: true },
          paragraph: {
            indent: { firstLine: 0 },
            keepNext: true,
            spacing: { before: 200, after: 240, line: 360, lineRule: "auto" },
          },
        },
      },
      paragraphStyles: [
        {
          id: "RunningMatter",
          name: "Running Matter",
          basedOn: "Normal",
          run: {
            font: "Montserrat",
            size: 16,
            color: RUNNING_MATTER_COLOR,
          },
          paragraph: {
            indent: { firstLine: 0 },
            spacing: { before: 0, after: 0, line: 240, lineRule: "auto" },
          },
        },
        {
          id: "Normal",
          name: "Normal",
          run: { font: "Montserrat", size: 24 },
          paragraph: {
            indent: { firstLine: 360 },
            spacing: { before: 0, after: 120, line: 360, lineRule: "auto" },
          },
        },
        {
          id: "ChapterReferenceLabel",
          name: "Chapter Reference Label",
          basedOn: "Normal",
          run: { font: "Montserrat", size: 20, bold: true },
          paragraph: {
            indent: { firstLine: 0 },
            keepNext: true,
            spacing: { before: 240, after: 80, line: 300, lineRule: "auto" },
          },
        },
        {
          id: "ChapterReference",
          name: "Chapter Reference",
          basedOn: "Normal",
          run: { font: "Montserrat", size: 20, color: RUNNING_MATTER_COLOR },
          paragraph: {
            indent: { firstLine: 0, left: 0 },
            spacing: { before: 0, after: 80, line: 300, lineRule: "auto" },
          },
        },
        {
          id: "CoverTitle",
          name: "Cover Title",
          basedOn: "Normal",
          run: { font: "Montserrat", size: 52, bold: true },
          paragraph: {
            indent: { firstLine: 0 },
            spacing: { before: 0, after: 120, line: 360, lineRule: "auto" },
          },
        },
        {
          id: "CoverDescription",
          name: "Cover Description",
          basedOn: "Normal",
          run: { font: "Montserrat", size: 24 },
          paragraph: {
            indent: { firstLine: 0 },
            spacing: { before: 0, after: 120, line: 360, lineRule: "auto" },
          },
        },
        {
          id: "Divider",
          name: "Divider",
          basedOn: "Normal",
          paragraph: {
            indent: { firstLine: 0 },
            spacing: { before: 0, after: 120, line: 360, lineRule: "auto" },
          },
        },
        {
          id: "SectionHeading",
          name: "Section Heading",
          basedOn: "Normal",
          run: { font: "Montserrat", size: 40, bold: true },
          paragraph: {
            indent: { firstLine: 0 },
            keepNext: true,
            spacing: { before: 640, after: 640, line: 360, lineRule: "auto" },
          },
        },
        {
          id: "TOC1",
          name: "TOC 1",
          basedOn: "Normal",
          run: { font: "Montserrat", size: 24 },
          paragraph: {
            indent: { firstLine: 0 },
            spacing: { before: 0, after: 120, line: 360, lineRule: "auto" },
          },
        },
        {
          id: "TOC2",
          name: "TOC 2",
          basedOn: "Normal",
          run: { font: "Montserrat", size: 24 },
          paragraph: {
            indent: { left: 760, hanging: 400 },
            spacing: { before: 0, after: 120, line: 360, lineRule: "auto" },
          },
        },
      ],
    },
    sections,
  });
}

export async function generateEbookDocx(ebook: EbookContent): Promise<Buffer> {
  return Packer.toBuffer(await createDocument(ebook, new Map()));
}

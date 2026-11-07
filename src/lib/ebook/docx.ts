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
import type { EbookContent, EbookRichTextNode } from "./types";

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

async function richDocxBlocks(
  nodes: EbookRichTextNode[],
  images: DocxImageCache,
): Promise<(Paragraph | Table)[]> {
  const blocks: (Paragraph | Table)[] = [];

  for (const node of nodes) {
    if (node.type === "paragraph") {
      const runs = docxRuns(node.content ?? []);
      if (runs.length > 0) {
        blocks.push(new Paragraph({ children: runs, style: "Normal" }));
      }
      continue;
    }

    if (node.type === "heading") {
      const text = richTextPlainText(node.content ?? []).trim();
      if (text) {
        blocks.push(
          docxParagraph(text, undefined, { heading: HeadingLevel.HEADING_3 }),
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
        blocks.push(
          new Paragraph({
            style: "Normal",
            indent: { left: 360, firstLine: 0 },
            children: docxRuns([
              { type: "text", text: `${marker} ` },
              ...inline,
            ]),
          }),
        );
        if (nested.length > 0) {
          blocks.push(...(await richDocxBlocks(nested, images)));
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
      children: [
        new TextRun({ text: `${ebook.brand} · ${ebook.niche}`, bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    docxParagraph(" ", "Divider", {
      bottomBorder: true,
      alignment: AlignmentType.CENTER,
      indent: { firstLine: 0 },
    }),
    docxParagraph(ebook.title, "CoverTitle"),
    docxParagraph(" ", "Divider", {
      bottomBorder: true,
      alignment: AlignmentType.CENTER,
      indent: { firstLine: 0 },
    }),
    docxParagraph(ebook.description, "CoverDescription", {
      indent: { firstLine: 0 },
    }),
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
    new TableOfContents("Daftar Isi", {
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
      : ebook.introduction.map((text) => docxParagraph(text))),
  ];

  const chapters: { title: string; children: (Paragraph | Table)[] }[] = [];
  for (const [index, chapter] of ebook.chapters.entries()) {
    const children: (Paragraph | Table)[] = [
      new Paragraph(""),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        indent: { firstLine: 0 },
        children: [
          new TextRun({
            text: `${String(index + 1).padStart(2, "0")}.`,
            font: "Montserrat",
            size: 48,
            bold: true,
            color: CHAPTER_NUMBER_COLOR,
          }),
          new TextRun({
            text: chapter.title,
            break: 1,
            font: "Montserrat",
            size: 36,
            bold: true,
          }),
        ],
      }),
      new Paragraph(""),
    ];

    if (chapter.body !== undefined) {
      children.push(...(await richDocxBlocks(chapter.body, images)));
    } else {
      (chapter.intro ?? []).forEach((text) => children.push(docxParagraph(text)));

      chapter.sections.forEach((section) => {
        children.push(
          docxParagraph(section.title, undefined, {
            heading: HeadingLevel.HEADING_3,
          }),
        );
        section.paragraphs.forEach((text) => children.push(docxParagraph(text)));
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
    ...ebook.conclusion.map((text) => docxParagraph(text)),
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
    ...ebook.about.map((text) => docxParagraph(text)),
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
          run: { font: "Montserrat", size: 40, bold: true },
          paragraph: {
            indent: { firstLine: 0 },
            keepNext: true,
            spacing: { before: 0, after: 120, line: 360, lineRule: "auto" },
          },
        },
        heading2: {
          run: { font: "Montserrat", size: 36, bold: true },
          paragraph: {
            indent: { firstLine: 0 },
            keepNext: true,
            spacing: { before: 0, after: 120, line: 360, lineRule: "auto" },
          },
        },
        heading3: {
          run: { font: "Montserrat", size: 32, bold: true },
          paragraph: {
            indent: { firstLine: 0 },
            keepNext: true,
            spacing: { before: 0, after: 120, line: 360, lineRule: "auto" },
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
            spacing: { before: 240, after: 240, line: 360, lineRule: "auto" },
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
            spacing: { before: 0, after: 120, line: 360, lineRule: "auto" },
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
            indent: { left: 360, firstLine: 0 },
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

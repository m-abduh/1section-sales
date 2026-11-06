import path from "node:path";
import PDFDocument from "pdfkit";
import { imageInfoOf } from "./image";
import {
  richTextImageSrc,
  richTextMarksOf,
  richTextPlainText,
  richTextRuns,
} from "./rich-text";
import { tocEntriesOf, type EbookContent, type EbookRichTextNode, type TocEntry } from "./types";

const PAGE_WIDTH = 419.53;
const PAGE_HEIGHT = 595.28;
const MARGIN = 56.69;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TOP = MARGIN;
const BOTTOM = PAGE_HEIGHT - MARGIN;

const INK = "#1F2421";
const MUTED = "#7A8589";
const GOLD = "#B68A42";

const BODY_SIZE = 12;
const BODY_LINE_GAP = 5;
const BODY_BEFORE = 12;
const BODY_AFTER = 12;

const H1_SIZE = 20;
const H2_SIZE = 18;
const H3_SIZE = 16;
const COVER_TITLE_SIZE = 26;
const COVER_DESCRIPTION_SIZE = 12;
const CHAPTER_NUMBER_SIZE = 24;
const RUNNING_SIZE = 8;
const TOC_SIZE = 12;
const TOC_LINE_GAP = 4;
const TOC_AFTER = 8;

const IMAGE_MAX_HEIGHT = 240;
const IMAGE_BEFORE = 12;
const IMAGE_AFTER = 14;

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");
const FONTS = {
  regular: path.join(FONT_DIR, "Montserrat-Regular.ttf"),
  bold: path.join(FONT_DIR, "Montserrat-Bold.ttf"),
  italic: path.join(FONT_DIR, "Montserrat-Italic.ttf"),
  boldItalic: path.join(FONT_DIR, "Montserrat-BoldItalic.ttf"),
};

function referenceLine(reference: { title: string; url?: string }) {
  return reference.url
    ? `${reference.title} ${reference.url}`
    : reference.title;
}

type PageMap = Record<string, number>;

type ImageCache = Map<string, Buffer | null>;

/**
 * Inline images come from our own Cloudinary account. Restricting the host
 * keeps the server-side fetch from being used as an SSRF probe.
 */
async function loadImage(src: string, cache: ImageCache): Promise<Buffer | null> {
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

class PdfBook {
  private readonly doc: PDFKit.PDFDocument;
  private readonly chunks: Buffer[] = [];
  private readonly ended: Promise<Buffer>;
  private readonly ebook: EbookContent;
  private readonly images: ImageCache;

  private page = 0;
  private y = TOP;
  private section = "";
  private pageMap: PageMap = {};

  constructor(ebook: EbookContent, images: ImageCache = new Map()) {
    this.ebook = ebook;
    this.images = images;
    this.doc = new PDFDocument({
      size: [PAGE_WIDTH, PAGE_HEIGHT],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      autoFirstPage: true,
      info: {
        Title: ebook.title,
        Author: ebook.brand,
        Subject: ebook.niche,
        Creator: "1section Ebook Studio",
      },
    });

    this.doc.registerFont("Body", FONTS.regular);
    this.doc.registerFont("Bold", FONTS.bold);
    this.doc.registerFont("Italic", FONTS.italic);
    this.doc.registerFont("BoldItalic", FONTS.boldItalic);

    this.doc.on("data", (chunk: Buffer) => this.chunks.push(chunk));
    this.ended = new Promise<Buffer>((resolve, reject) => {
      this.doc.on("end", () => resolve(Buffer.concat(this.chunks)));
      this.doc.on("error", reject);
    });
  }

  async render(pageMap: PageMap): Promise<{ buffer: Buffer; pageMap: PageMap }> {
    this.drawCover();
    this.drawContents(pageMap);
    this.drawIntroduction();
    await this.drawChapters();
    this.drawConclusion();
    this.drawReferences();
    this.drawAbout();
    this.doc.end();
    const buffer = await this.ended;
    return { buffer, pageMap: this.pageMap };
  }

  private addPage(section: string) {
    this.doc.addPage();
    this.page += 1;
    this.section = section;
    this.y = TOP;
    this.drawHeader(section);
    this.drawFooter();
  }

  private drawHeader(section: string) {
    const d = this.doc;
    const title = this.fit(
      section,
      "Body",
      RUNNING_SIZE,
      CONTENT_WIDTH * 0.62,
    );
    d.font("Bold")
      .fontSize(RUNNING_SIZE)
      .fillColor(MUTED)
      .text(`${this.ebook.brand} · ${this.ebook.niche}`, MARGIN, 30, {
        width: CONTENT_WIDTH / 2,
        align: "left",
        lineBreak: false,
      });
    d.font("Body")
      .fontSize(RUNNING_SIZE)
      .fillColor(MUTED)
      .text(title, MARGIN, 30, {
        width: CONTENT_WIDTH,
        align: "right",
        lineBreak: false,
      });
    d.moveTo(MARGIN, 44)
      .lineTo(PAGE_WIDTH - MARGIN, 44)
      .lineWidth(0.4)
      .strokeColor(MUTED)
      .stroke();
  }

  private drawFooter() {
    if (this.page === 0) return;
    const d = this.doc;
    d.moveTo(MARGIN, PAGE_HEIGHT - 44)
      .lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 44)
      .lineWidth(0.4)
      .strokeColor(MUTED)
      .stroke();
    d.font("Body")
      .fontSize(RUNNING_SIZE)
      .fillColor(MUTED)
      .text(String(this.page), MARGIN, PAGE_HEIGHT - 36, {
        width: CONTENT_WIDTH,
        align: "center",
        lineBreak: false,
      });
  }

  private rule(y: number) {
    this.doc
      .moveTo(MARGIN, y)
      .lineTo(PAGE_WIDTH - MARGIN, y)
      .lineWidth(0.6)
      .strokeColor("#666666")
      .stroke();
  }

  private fit(text: string, font: string, size: number, maxWidth: number) {
    this.doc.font(font).fontSize(size);
    if (this.doc.widthOfString(text) <= maxWidth) return text;
    let out = text;
    while (out.length > 0 && this.doc.widthOfString(`${out}…`) > maxWidth) {
      out = out.slice(0, -1);
    }
    return `${out}…`;
  }

  private ensureSpace(height: number) {
    if (this.y + height > BOTTOM) {
      this.addPage(this.section);
    }
  }

  private heading(
    text: string,
    size: number,
    before: number,
    after: number,
    color = INK,
    keepWith = 0,
  ) {
    const d = this.doc;
    d.font("Bold").fontSize(size).fillColor(color);
    const height = d.heightOfString(text, {
      width: CONTENT_WIDTH,
      lineGap: 2,
    });
    this.ensureSpace(before + height + after + keepWith);
    d.font("Bold").fontSize(size).fillColor(color);
    this.y += before;
    d.text(text, MARGIN, this.y, { width: CONTENT_WIDTH, lineGap: 2 });
    this.y = d.y + after;
  }

  private paragraphHeight(text: string) {
    if (!text.trim()) return 0;
    const d = this.doc;
    d.font("Body").fontSize(BODY_SIZE);
    const height = d.heightOfString(text, {
      width: CONTENT_WIDTH,
      align: "justify",
      lineGap: BODY_LINE_GAP,
      indent: 18,
    });
    const lineHeight = d.currentLineHeight(true) + BODY_LINE_GAP;
    return (
      BODY_BEFORE +
      Math.min(height, lineHeight * 10) +
      Math.min(BODY_AFTER, lineHeight)
    );
  }

  private paragraph(text: string) {
    if (!text.trim()) return;
    const d = this.doc;
    d.font("Body").fontSize(BODY_SIZE).fillColor(INK);
    const options = {
      width: CONTENT_WIDTH,
      align: "justify" as const,
      lineGap: BODY_LINE_GAP,
      indent: 18,
    };
    const height = d.heightOfString(text, options);
    this.ensureSpace(BODY_BEFORE + height + BODY_AFTER);
    d.font("Body").fontSize(BODY_SIZE).fillColor(INK);
    this.y += BODY_BEFORE;
    d.text(text, MARGIN, this.y, options);
    this.y = d.y + BODY_AFTER;
  }

  private async richBody(nodes: EbookRichTextNode[]) {
    for (const node of nodes) {
      if (node.type === "paragraph") {
        this.richParagraph(node.content ?? []);
        continue;
      }
      if (node.type === "heading") {
        const text = richTextPlainText(node.content ?? []).trim();
        if (!text) continue;
        const level = Number(node.attrs?.level ?? 3);
        this.heading(text, level <= 2 ? H3_SIZE : 14, 12, 6);
        continue;
      }
      if (node.type === "bulletList" || node.type === "orderedList") {
        await this.richList(node, 0);
        continue;
      }
      if (node.type === "image") {
        await this.richImage(node);
        continue;
      }
      if (node.content?.length) {
        await this.richBody(node.content);
      }
    }
  }

  private richParagraph(nodes: EbookRichTextNode[], left = 0) {
    const runs = richTextRuns(nodes).filter((run) => run.text.length > 0);
    if (runs.length === 0) return;
    const plain = runs.map((run) => run.text).join("");
    if (!plain.trim()) return;

    const d = this.doc;
    const x = MARGIN + left;
    const options = {
      width: CONTENT_WIDTH - left,
      align: "justify" as const,
      lineGap: BODY_LINE_GAP,
      indent: left === 0 ? 18 : 0,
    };
    d.font("Body").fontSize(BODY_SIZE);
    const height = d.heightOfString(plain, options);
    this.ensureSpace(BODY_BEFORE + height + BODY_AFTER);
    this.y += BODY_BEFORE;

    runs.forEach((run, index) => {
      const isLast = index === runs.length - 1;
      const marks = richTextMarksOf({ type: "text", text: run.text, marks: run.marks });
      const font =
        marks.bold && marks.italic
          ? "BoldItalic"
          : marks.bold
            ? "Bold"
            : marks.italic
              ? "Italic"
              : "Body";
      d.font(font).fontSize(BODY_SIZE).fillColor(INK);
      if (index === 0) {
        d.text(run.text, x, this.y, { ...options, continued: !isLast });
      } else {
        d.text(run.text, { ...options, continued: !isLast });
      }
    });

    this.y = d.y + BODY_AFTER;
  }

  private async richList(node: EbookRichTextNode, level: number) {
    const ordered = node.type === "orderedList";
    const items = node.content ?? [];
    let position = 1;

    for (const item of items) {
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
      this.richParagraph(
        [{ type: "text", text: `${marker} ` }, ...inline],
        16 + level * 16,
      );

      for (const child of nested) {
        await this.richList(child, level + 1);
      }
      position += 1;
    }
  }

  private async richImage(node: EbookRichTextNode) {
    const src = richTextImageSrc(node);
    if (!src) return;
    const buffer = await loadImage(src, this.images);
    if (!buffer) return;
    const info = imageInfoOf(buffer);
    if (!info) return;

    const scale = Math.min(
      CONTENT_WIDTH / info.width,
      IMAGE_MAX_HEIGHT / info.height,
      1,
    );
    const width = Math.max(1, Math.round(info.width * scale));
    const height = Math.max(1, Math.round(info.height * scale));

    this.ensureSpace(IMAGE_BEFORE + height + IMAGE_AFTER);
    this.y += IMAGE_BEFORE;
    this.doc.image(buffer, MARGIN + (CONTENT_WIDTH - width) / 2, this.y, {
      width,
      height,
    });
    this.y += height + IMAGE_AFTER;
  }

  private drawCover() {
    const d = this.doc;
    this.page = 0;
    this.y = TOP + 48;

    d.font("Bold")
      .fontSize(12)
      .fillColor(INK)
      .text(`${this.ebook.brand} · ${this.ebook.niche}`, MARGIN, this.y, {
        width: CONTENT_WIDTH,
        align: "center",
        lineGap: 2,
      });
    this.y = d.y + 18;

    this.rule(this.y);
    this.y += 18;

    d.font("Bold")
      .fontSize(COVER_TITLE_SIZE)
      .fillColor(INK)
      .text(this.ebook.title, MARGIN, this.y, {
        width: CONTENT_WIDTH,
        align: "left",
        lineGap: 4,
      });
    this.y = d.y + 18;

    this.rule(this.y);
    this.y += 18;

    d.font("Body")
      .fontSize(COVER_DESCRIPTION_SIZE)
      .fillColor(INK)
      .text(this.ebook.description, MARGIN, this.y, {
        width: CONTENT_WIDTH,
        align: "left",
        lineGap: 5,
      });
  }

  private drawContents(pageMap: PageMap) {
    this.addPage("DAFTAR ISI");
    this.heading("Daftar Isi", H1_SIZE, 0, 12);

    tocEntriesOf(this.ebook).forEach((entry) => {
      this.tocEntry(entry, pageMap);
    });
  }

  private tocEntry(entry: TocEntry, pageMap: PageMap) {
    const d = this.doc;
    const indent = entry.level === 2 ? 18 : 0;
    const numberArea = 34;
    const maxTextWidth = CONTENT_WIDTH - indent - numberArea;
    const pageNumber = pageMap[entry.key];
    const numberText = pageNumber === undefined ? "" : String(pageNumber);

    d.font("Body").fontSize(TOC_SIZE).fillColor(INK);
    const textHeight = d.heightOfString(entry.label, {
      width: maxTextWidth,
      lineGap: TOC_LINE_GAP,
    });
    const singleLineHeight = d.heightOfString(entry.label, {
      width: maxTextWidth,
      lineGap: 0,
    });
    const lineHeight = d.currentLineHeight(true);
    const lines = Math.max(1, Math.round(singleLineHeight / lineHeight));

    this.ensureSpace(textHeight + TOC_AFTER);

    const startY = this.y;
    d.font("Body").fontSize(TOC_SIZE).fillColor(INK);
    d.text(entry.label, MARGIN + indent, startY, {
      width: maxTextWidth,
      lineGap: TOC_LINE_GAP,
    });

    if (lines === 1) {
      const textWidth = d.widthOfString(entry.label);
      const numberWidth = numberText ? d.widthOfString(numberText) : 0;
      const startX = MARGIN + indent + textWidth + 4;
      const endX = PAGE_WIDTH - MARGIN - numberWidth - 4;
      if (endX > startX) {
        d.save();
        d.dash(0.6, { space: 2 });
        d.moveTo(startX, startY + 10)
          .lineTo(endX, startY + 10)
          .lineWidth(0.5)
          .strokeColor("#9AA3A6")
          .stroke();
        d.undash();
        d.restore();
      }
    }

    if (numberText) {
      const numberY =
        lines === 1
          ? startY
          : startY + (lineHeight + TOC_LINE_GAP) * (lines - 1);
      d.font("Body")
        .fontSize(TOC_SIZE)
        .fillColor(INK)
        .text(numberText, PAGE_WIDTH - MARGIN - numberArea, numberY, {
          width: numberArea,
          align: "right",
          lineBreak: false,
        });
    }

    this.y = startY + textHeight + TOC_AFTER;
  }

  private drawIntroduction() {
    this.addPage("PENDAHULUAN");
    this.pageMap.intro = this.page;
    this.heading("Pendahuluan", H1_SIZE, 0, 6);
    this.ebook.introduction.forEach((text) => this.paragraph(text));
  }

  private async drawChapters() {
    for (const [index, chapter] of this.ebook.chapters.entries()) {
      this.addPage(`${index + 1}. ${chapter.title}`);
      this.pageMap[`chapter-${index}`] = this.page;

      this.y += 12;
      this.doc
        .font("Bold")
        .fontSize(CHAPTER_NUMBER_SIZE)
        .fillColor(GOLD)
        .text(`${String(index + 1).padStart(2, "0")}.`, MARGIN, this.y, {
          width: CONTENT_WIDTH,
          lineGap: 2,
        });
      this.y = this.doc.y + 2;
      this.doc
        .font("Bold")
        .fontSize(H2_SIZE)
        .fillColor(INK)
        .text(chapter.title, MARGIN, this.y, {
          width: CONTENT_WIDTH,
          lineGap: 2,
        });
      this.y = this.doc.y + 12;

      if (chapter.body !== undefined) {
        await this.richBody(chapter.body);
      } else {
        (chapter.intro ?? []).forEach((text) => this.paragraph(text));

        chapter.sections.forEach((section) => {
          const keepWith = section.paragraphs[0]
            ? this.paragraphHeight(section.paragraphs[0])
            : 0;
          this.heading(section.title, H3_SIZE, 6, 6, INK, keepWith);
          section.paragraphs.forEach((text) => this.paragraph(text));
        });
      }

      if (chapter.references?.length) {
        this.heading("Research Reference", BODY_SIZE, BODY_BEFORE, 2, MUTED);
        chapter.references.forEach((reference) =>
          this.paragraph(referenceLine(reference)),
        );
      }
    }
  }

  private drawConclusion() {
    this.addPage("KESIMPULAN");
    this.pageMap.conclusion = this.page;
    this.heading("Kesimpulan", H1_SIZE, 0, 6);
    this.ebook.conclusion.forEach((text) => this.paragraph(text));
  }

  private drawReferences() {
    this.addPage("REFERENSI");
    this.pageMap.references = this.page;
    this.heading("Referensi", H1_SIZE, 0, 6);
    this.ebook.references.forEach((reference, index) => {
      this.paragraph(`[${index + 1}] ${reference.title} ${reference.url}`);
    });
  }

  private drawAbout() {
    this.addPage("ABOUT");
    this.pageMap.about = this.page;
    this.heading("About", H1_SIZE, 0, 6);
    this.ebook.about.forEach((text) => this.paragraph(text));
  }
}

async function renderOnce(
  ebook: EbookContent,
  pageMap: PageMap,
  images: ImageCache,
) {
  return new PdfBook(ebook, images).render(pageMap);
}

export async function generateEbookPdf(ebook: EbookContent): Promise<Buffer> {
  let pageMap: PageMap = {};
  let buffer: Buffer | undefined;
  // The layout is rendered up to five times to settle TOC page numbers, so
  // remote images are fetched once and reused across passes.
  const images: ImageCache = new Map();

  for (let pass = 0; pass < 5; pass += 1) {
    const result = await renderOnce(ebook, pageMap, images);
    buffer = result.buffer;
    if (JSON.stringify(result.pageMap) === JSON.stringify(pageMap)) {
      break;
    }
    pageMap = result.pageMap;
  }

  if (!buffer) {
    throw new Error("Gagal membuat PDF.");
  }

  return buffer;
}

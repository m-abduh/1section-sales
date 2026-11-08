import path from "node:path";
import PDFDocument from "pdfkit";
import { imageInfoOf } from "./image";
import {
  richTextImageSrc,
  richTextIsEmpty,
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
// 14.628pt (single line for Montserrat 12pt) + 7.3pt ≈ 1.5 line spacing,
// matching the DOCX "line: 360, lineRule: auto" setting.
const BODY_LINE_GAP = 7.3;
const BODY_BEFORE = 0;
const BODY_AFTER = 6;

const H1_SIZE = 20;
const H2_SIZE = 18;
const H3_SIZE = 14;
// Generous breathing room around level 1/2 headings so sections read clearly.
const H1_BEFORE = 32;
const H1_AFTER = 32;
// A preceding paragraph already leaves BODY_AFTER (6pt), so 14 + 6 = 20.
const H2_BEFORE = 14;
const H2_AFTER = 20;
// Chapter openers are not preceded by a paragraph, so pad them directly.
const CHAPTER_TITLE_BEFORE = 32;
const CHAPTER_TITLE_AFTER = 32;
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
    await this.drawCover();
    this.drawContents(pageMap);
      await this.drawIntroduction();
      await this.drawChapters();
      await this.drawConclusion();
      this.drawReferences();
      await this.drawAbout();
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
      if (node.type === "blockquote") {
        await this.richBlockquote(node);
        continue;
      }
      if (node.type === "heading") {
        const text = richTextPlainText(node.content ?? []).trim();
        if (!text) continue;
        const level = Number(node.attrs?.level ?? 3);
        if (level <= 2) {
          this.heading(text, H2_SIZE, H2_BEFORE, H2_AFTER);
        } else {
          this.heading(text, H3_SIZE, 10, 12);
        }
        continue;
      }
      if (node.type === "bulletList" || node.type === "orderedList") {
        await this.richList(node, 0);
        continue;
      }
      if (node.type === "table") {
        await this.richTable(node);
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

  private async richTable(node: EbookRichTextNode) {
    const rows = (node.content ?? []).filter(
      (child) => child.type === "tableRow",
    );
    if (rows.length === 0) return;

    const cellsOf = (row: EbookRichTextNode) =>
      (row.content ?? []).filter(
        (cell) => cell.type === "tableCell" || cell.type === "tableHeader",
      );

    const texts = rows.map((row) => cellsOf(row).map(tableCellText));
    const columns = Math.max(...texts.map((row) => row.length));
    if (columns === 0) return;

    const headerRow = cellsOf(rows[0]).some(
      (cell) => cell.type === "tableHeader",
    );

    const padding = 5;
    const size = 9.5;
    const lineGap = 2;

    this.doc.font("Body").fontSize(size);
    const desired = Array.from({ length: columns }, (_, column) => {
      let width = 64;
      for (const row of texts) {
        const text = row[column] ?? "";
        for (const line of text.split("\n")) {
          width = Math.max(width, this.doc.widthOfString(line) + padding * 2);
        }
      }
      return Math.min(width, 200);
    });
    const desiredTotal = desired.reduce((total, width) => total + width, 0);
    const widths = desired.map((width) => (width / desiredTotal) * CONTENT_WIDTH);

    const rowHeights = texts.map((row) => {
      let height = 26;
      for (let column = 0; column < columns; column += 1) {
        this.doc.font("Body").fontSize(size);
        height = Math.max(
          height,
          this.doc.heightOfString(row[column] || " ", {
            width: Math.max(12, widths[column] - padding * 2),
            lineGap,
          }) +
            padding * 2,
        );
      }
      return height;
    });

    const drawRow = (rowIndex: number) => {
      const height = rowHeights[rowIndex];
      const top = this.y;
      const isHeader = headerRow && rowIndex === 0;

      if (isHeader) {
        this.doc
          .save()
          .rect(MARGIN, top, CONTENT_WIDTH, height)
          .fill("#F4F4F5")
          .restore();
      }

      let x = MARGIN;
      for (let column = 0; column < columns; column += 1) {
        this.doc
          .rect(x, top, widths[column], height)
          .lineWidth(0.5)
          .strokeColor("#D4D4D8")
          .stroke();
        this.doc
          .font(isHeader ? "Bold" : "Body")
          .fontSize(size)
          .fillColor(INK)
          .text(texts[rowIndex]?.[column] ?? "", x + padding, top + padding, {
            width: Math.max(12, widths[column] - padding * 2),
            lineGap,
          });
        x += widths[column];
      }
      this.y = top + height;
    };

    this.y += BODY_BEFORE;
    for (let row = 0; row < rows.length; row += 1) {
      if (this.y + rowHeights[row] > BOTTOM) {
        this.addPage(this.section);
        if (headerRow && row > 0) drawRow(0);
      }
      drawRow(row);
    }
    this.y += BODY_AFTER;
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

  private async richBlockquote(node: EbookRichTextNode) {
    const d = this.doc;
    const runs = richTextRuns(node.content ?? []);
    const plain = runs.map((r) => r.text).join("");
    if (!plain.trim()) return;

    const QUOTE_INDENT = 28;
    const x = MARGIN + QUOTE_INDENT;
    const options = {
      width: CONTENT_WIDTH - QUOTE_INDENT,
      align: "justify" as const,
      lineGap: BODY_LINE_GAP,
      indent: 0,
    };

    d.font("Body").fontSize(BODY_SIZE);
    const height = d.heightOfString(plain, options);
    this.ensureSpace(12 + height + 12);
    this.y += 12;

    d.save();
    d.strokeColor(GOLD);
    d.lineWidth(2);
    d.lineCap("round");
    d.moveTo(MARGIN + 12, this.y).lineTo(MARGIN + 12, this.y + height);
    d.stroke();
    d.restore();

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
      d.font(font).fontSize(BODY_SIZE).fillColor(MUTED);
      if (index === 0) {
        d.text(run.text, x, this.y, { ...options, continued: !isLast });
      } else {
        d.text(run.text, { ...options, continued: !isLast });
      }
    });

    this.y = d.y + 12;
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
      this.richListItem(marker, inline, 16 + level * 16);

      for (const child of nested) {
        await this.richList(child, level + 1);
      }
      position += 1;
    }
  }

  /**
   * List items use a hanging indent (marker sits left, wrapped lines align
   * under the item text) and skip the paragraph before/after spacing so
   * consecutive items stay tight, like a Word list.
   */
  private richListItem(
    marker: string,
    nodes: EbookRichTextNode[],
    left: number,
  ) {
    const runs = richTextRuns(nodes).filter((run) => run.text.length > 0);
    const plain = runs.map((run) => run.text).join("");
    if (!plain.trim()) return;

    const d = this.doc;
    d.font("Body").fontSize(BODY_SIZE);
    const hang = Math.max(14, d.widthOfString(`${marker} `) + 2);
    const x = MARGIN + left;
    const textX = x + hang;
    const options = {
      width: CONTENT_WIDTH - left - hang,
      align: "justify" as const,
      lineGap: BODY_LINE_GAP,
      indent: 0,
    };

    const height = d.heightOfString(plain, options);
    this.ensureSpace(height);
    d.font("Body").fontSize(BODY_SIZE).fillColor(INK);
    d.text(marker, x, this.y, { lineBreak: false });

    runs.forEach((run, index) => {
      const isLast = index === runs.length - 1;
      const marks = richTextMarksOf({
        type: "text",
        text: run.text,
        marks: run.marks,
      });
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
        d.text(run.text, textX, this.y, { ...options, continued: !isLast });
      } else {
        d.text(run.text, { ...options, continued: !isLast });
      }
    });

    this.y = d.y;
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

  private async drawCover() {
    const coverUrl = this.ebook.cover?.renderedUrl;
    const buffer = coverUrl ? await loadImage(coverUrl, this.images) : null;

    if (buffer) {
      this.page = 0;
      this.y = TOP;
      this.doc.image(buffer, 0, 0, {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });

      // Keep the legacy typographic cover as a second page so the exported
      // book stacks the designed cover on top of the old one.
      this.doc.addPage();
      this.page += 1;
      this.section = "COVER";
      this.y = TOP + 48;
    } else {
      this.page = 0;
      this.y = TOP + 48;
    }

    this.drawCoverText();
  }

  private drawCoverText() {
    const d = this.doc;

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
    this.addPage("TABLE OF CONTENTS");
    this.heading("Table of Contents", H1_SIZE, H1_BEFORE, H1_AFTER);

    tocEntriesOf(this.ebook).forEach((entry) => {
      this.tocEntry(entry, pageMap);
    });
  }

  private tocEntry(entry: TocEntry, pageMap: PageMap) {
    const d = this.doc;
    const levelIndent = entry.level === 2 ? 18 : 0;
    const numberArea = 34;
    const pageNumber = pageMap[entry.key];
    const numberText = pageNumber === undefined ? "" : String(pageNumber);

    // Split "01. Title" so wrapped lines line up with the title, not the number.
    const labelMatch = /^(\d+\.)\s+(.+)$/s.exec(entry.label);
    const prefix = labelMatch ? labelMatch[1] : "";
    const title = labelMatch ? labelMatch[2] : entry.label;

    d.font("Body").fontSize(TOC_SIZE).fillColor(INK);
    const startX = MARGIN + levelIndent;
    // Fixed number column so every title lines up on the same x position.
    const prefixWidth = prefix ? d.widthOfString("00.") + 6 : 0;
    const titleX = startX + prefixWidth;
    const titleWidth = PAGE_WIDTH - MARGIN - numberArea - 6 - titleX;

    const lineHeight = d.currentLineHeight(true);
    const step = lineHeight + TOC_LINE_GAP;

    // Wrap manually so we always know the last line (where the leaders go).
    const lines: string[] = [];
    let currentLine = "";
    for (const word of title.split(/\s+/).filter(Boolean)) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (currentLine && d.widthOfString(candidate) > titleWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) lines.push(currentLine);
    if (lines.length === 0) lines.push("");

    const textHeight = lineHeight + (lines.length - 1) * step;
    this.ensureSpace(textHeight + TOC_AFTER);

    const startY = this.y;
    if (prefix) {
      d.font("Body")
        .fontSize(TOC_SIZE)
        .fillColor(INK)
        .text(prefix, startX, startY, { lineBreak: false });
    }
    lines.forEach((line, index) => {
      d.font("Body")
        .fontSize(TOC_SIZE)
        .fillColor(INK)
        .text(line, titleX, startY + index * step, { lineBreak: false });
    });

    // Dotted leader on the final line, so wrapped titles still reach the page
    // number instead of losing their dots.
    const lastY = startY + (lines.length - 1) * step;
    const lastLine = lines[lines.length - 1] ?? "";
    const lastLineWidth = d.widthOfString(lastLine);
    const numberWidth = numberText ? d.widthOfString(numberText) : 0;
    const dotStartX = titleX + lastLineWidth + 4;
    const dotEndX = PAGE_WIDTH - MARGIN - numberWidth - 4;
    if (numberText && dotEndX > dotStartX) {
      d.save();
      d.dash(0.6, { space: 2 });
      d.moveTo(dotStartX, lastY + 10)
        .lineTo(dotEndX, lastY + 10)
        .lineWidth(0.5)
        .strokeColor("#9AA3A6")
        .stroke();
      d.undash();
      d.restore();
    }

    if (numberText) {
      d.font("Body")
        .fontSize(TOC_SIZE)
        .fillColor(INK)
        .text(numberText, PAGE_WIDTH - MARGIN - numberArea, lastY, {
          width: numberArea,
          align: "right",
          lineBreak: false,
        });
    }

    this.y = startY + textHeight + TOC_AFTER;
  }

  private async drawIntroduction() {
    this.addPage("INTRODUCTION");
    this.pageMap.intro = this.page;
    this.heading("Introduction", H1_SIZE, H1_BEFORE, H1_AFTER);

    const body = this.ebook.introductionBody;
    if (body && !richTextIsEmpty(body)) {
      await this.richBody(body);
      return;
    }
    this.ebook.introduction.forEach((text) => this.paragraph(text));
  }

  private async drawChapters() {
    for (const [index, chapter] of this.ebook.chapters.entries()) {
      this.addPage(`${index + 1}. ${chapter.title}`);
      this.pageMap[`chapter-${index}`] = this.page;

      this.y += CHAPTER_TITLE_BEFORE;
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
      this.y = this.doc.y + CHAPTER_TITLE_AFTER;

      if (chapter.body !== undefined) {
        await this.richBody(chapter.body);
      } else {
        (chapter.intro ?? []).forEach((text) => this.paragraph(text));

        chapter.sections.forEach((section) => {
          const keepWith = section.paragraphs[0]
            ? this.paragraphHeight(section.paragraphs[0])
            : 0;
          this.heading(section.title, H3_SIZE, 10, 12, INK, keepWith);
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

  private async drawConclusion() {
    this.addPage("CONCLUSION");
    this.pageMap.conclusion = this.page;
    this.heading("Conclusion", H1_SIZE, H1_BEFORE, H1_AFTER);
    const body = this.ebook.conclusionBody;
    if (body && !richTextIsEmpty(body)) {
      await this.richBody(body);
      return;
    }
    this.ebook.conclusion.forEach((text) => this.paragraph(text));
  }

  private drawReferences() {
    this.addPage("REFERENCES");
    this.pageMap.references = this.page;
    this.heading("References", H1_SIZE, H1_BEFORE, H1_AFTER);
    this.ebook.references.forEach((reference, index) => {
      this.paragraph(`[${index + 1}] ${reference.title} ${reference.url}`);
    });
  }

  private async drawAbout() {
    this.addPage("ABOUT");
    this.pageMap.about = this.page;
    this.heading("About", H1_SIZE, H1_BEFORE, H1_AFTER);
    const body = this.ebook.aboutBody;
    if (body && !richTextIsEmpty(body)) {
      await this.richBody(body);
      return;
    }
    this.ebook.about.forEach((text) => this.paragraph(text));
  }
}

/** Flattens a table cell into plain text, keeping list markers and breaks. */
function tableCellText(cell: EbookRichTextNode): string {
  return (cell.content ?? [])
    .map((block) => {
      if (block.type === "bulletList" || block.type === "orderedList") {
        const ordered = block.type === "orderedList";
        return (block.content ?? [])
          .map((item, index) => {
            const text = richTextPlainText(item.content ?? []).trim();
            if (!text) return "";
            return `${ordered ? `${index + 1}.` : "•"} ${text}`;
          })
          .filter(Boolean)
          .join("\n");
      }
      return richTextPlainText([block]).trim();
    })
    .filter(Boolean)
    .join("\n");
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

import { z } from "zod";
import { richTextIsEmpty } from "./rich-text";
import type { EbookRichTextNode, EbookRichTextValue } from "./types";

const paragraph = z.string().trim().min(1).max(4000);
const brief = z.string().trim().max(12000).optional();

const richTextValue: z.ZodType<EbookRichTextValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(richTextValue),
  ]),
);

const richTextAttrs = z.record(richTextValue);

const richTextMark = z.object({
  type: z.string().trim().min(1).max(30),
  attrs: richTextAttrs.optional(),
});

const richTextNode: z.ZodType<EbookRichTextNode> = z.lazy(() =>
  z.object({
    type: z.string().trim().min(1).max(40),
    attrs: richTextAttrs.optional(),
    content: z.array(richTextNode).max(500).optional(),
    text: z.string().max(20000).optional(),
    marks: z.array(richTextMark).max(20).optional(),
  }),
);

const richTextBody = z.array(richTextNode).max(400).optional();

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format #RRGGBB.");

const coverBackground = z.discriminatedUnion("type", [
  z.object({ type: z.literal("solid"), color: hexColor }),
  z.object({
    type: z.literal("gradient"),
    from: hexColor,
    to: hexColor,
    angle: z.number().min(0).max(360).optional(),
  }),
  z.object({
    type: z.literal("image"),
    url: z.string().url().max(600),
    overlay: z.number().min(0).max(1).optional(),
  }),
]);

const cover = z
  .object({
    template: z.enum(["minimal", "editorial", "bold", "gradient", "photo"]),
    accent: hexColor,
    background: coverBackground,
    showDescription: z.boolean(),
    showBadge: z.boolean(),
    renderedUrl: z.string().url().max(600).optional(),
    renderedHash: z.string().max(80).optional(),
  })
  .optional();

export const ebookReferenceSchema = z.object({
  title: z.string().trim().min(1).max(400),
  url: z.string().trim().min(1).max(600),
});

export const ebookChapterReferenceSchema = z.object({
  title: z.string().trim().min(1).max(400),
  url: z.string().trim().max(600).optional(),
});

export const ebookChapterSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    brief,
    intro: z.array(paragraph).max(8).optional(),
    sections: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(200),
          paragraphs: z.array(paragraph).min(1).max(6),
        }),
      )
      .max(6),
    body: richTextBody,
    references: z.array(ebookChapterReferenceSchema).max(20).optional(),
  })
  .refine(
    (chapter) => chapter.sections.length > 0 || !richTextIsEmpty(chapter.body),
    {
      message: "Bab harus punya isi teks atau sub-bagian.",
      path: ["sections"],
    },
  );

export const ebookSchema = z.object({
  brand: z.string().trim().min(1).max(80).default("1section"),
  niche: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1200),
  metadataBrief: brief,
  introduction: z.array(paragraph).min(1).max(60),
  introductionBody: richTextBody,
  introductionBrief: brief,
  chapters: z
    .array(ebookChapterSchema)
    .min(1, "Ebook harus berisi minimal 1 bab.")
    .max(30, "Ebook maksimal berisi 30 bab."),
  conclusion: z.array(paragraph).min(1).max(60),
  conclusionBrief: brief,
  conclusionBody: richTextBody,
  references: z.array(ebookReferenceSchema).min(1).max(20),
  referencesBrief: brief,
  about: z.array(paragraph).min(1).max(60),
  aboutBrief: brief,
  aboutBody: richTextBody,
  cover,
});

export type EbookContentInput = z.input<typeof ebookSchema>;

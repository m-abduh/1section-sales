import { z } from "zod";
import type { EbookRichTextNode } from "./types";

const paragraph = z.string().trim().min(1).max(4000);

const richTextAttrs = z.record(
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

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

export const ebookSchema = z.object({
  brand: z.string().trim().min(1).max(80).default("1section"),
  niche: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1200),
  introduction: z.array(paragraph).min(1).max(8),
  chapters: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        intro: z.array(paragraph).max(8).optional(),
        sections: z
          .array(
            z.object({
              title: z.string().trim().min(1).max(200),
              paragraphs: z.array(paragraph).min(1).max(6),
            }),
          )
          .min(1)
          .max(6),
        body: richTextBody,
        references: z
          .array(
            z.object({
              title: z.string().trim().min(1).max(400),
              url: z.string().trim().max(600).optional(),
            }),
          )
          .max(20)
          .optional(),
      }),
    )
    .min(1, "Ebook harus berisi minimal 1 bab.")
    .max(30, "Ebook maksimal berisi 30 bab."),
  conclusion: z.array(paragraph).min(1).max(8),
  references: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(400),
        url: z.string().trim().min(1).max(600),
      }),
    )
    .min(1)
    .max(20),
  about: z.array(paragraph).min(1).max(8),
});

export type EbookContentInput = z.input<typeof ebookSchema>;

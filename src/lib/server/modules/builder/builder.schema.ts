import { z } from "zod";

export const generateEbookSchema = z.object({
  prompt: z.string().trim().min(20, "Brief minimal 20 karakter.").max(10000),
  brand: z.string().trim().min(1).max(80).default("1section"),
  niche: z.string().trim().min(2, "Niche wajib diisi.").max(120),
  title: z.string().trim().max(200).optional(),
});

const partBrief = z.string().trim().min(20, "Brief minimal 20 karakter.").max(12000);
const partBase = {
  brand: z.string().trim().min(1).max(80).default("1section"),
  niche: z.string().trim().min(2).max(120),
  bookTitle: z.string().trim().max(200).optional(),
};

export const generateEbookPartSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("chapter"),
    ...partBase,
    chapterTitle: z.string().trim().max(200).optional(),
    brief: partBrief,
    index: z.number().int().min(0).max(39),
    total: z.number().int().min(1).max(40),
  }),
  z.object({
    kind: z.literal("section"),
    ...partBase,
    section: z.enum(["introduction", "conclusion", "about"]),
    brief: partBrief,
  }),
  z.object({
    kind: z.literal("references"),
    ...partBase,
    brief: partBrief,
  }),
  z.object({
    kind: z.literal("metadata"),
    ...partBase,
    brief: partBrief,
    currentTitle: z.string().trim().max(200).optional(),
  }),
]);

export const createEbookProjectSchema = z.object({
  content: z.unknown(),
  prompt: z.string().trim().max(10000).optional(),
});

export const updateEbookProjectSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  status: z.enum(["draft", "final"]).optional(),
  content: z.unknown().optional(),
});

export const publishEbookProjectSchema = z.object({
  nicheId: z.string().min(1),
  name: z.string().trim().min(2).max(160).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung")
    .optional(),
  summary: z.string().max(300).nullable().optional(),
  description: z.string().max(20000).nullable().optional(),
  priceAmount: z.number().int().min(0),
  compareAtAmount: z.number().int().min(0).nullable().optional(),
  level: z.enum(["FOUNDATIONS", "PRACTICAL", "ADVANCED"]).optional(),
  features: z.array(z.string().min(1).max(200)).max(30).optional(),
  active: z.boolean().optional(),
});

export type GenerateEbookInput = z.infer<typeof generateEbookSchema>;
export type PublishEbookProjectInput = z.infer<typeof publishEbookProjectSchema>;

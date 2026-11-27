import { z } from "zod";

export const productFileSchema = z.object({
  name: z.string().min(1).max(200),
  provider: z.enum(["CLOUDINARY", "LOCAL", "EXTERNAL"]).optional(),
  storageKey: z.string().max(500).optional().nullable(),
  resourceType: z.string().max(50).optional().nullable(),
  format: z.string().max(20).optional().nullable(),
  bytes: z.number().int().min(0).optional().nullable(),
  checksum: z.string().max(128).optional().nullable(),
  fileUrl: z.string().max(1000).optional().nullable(),
  assetFileId: z.string().max(64).optional().nullable(),
});

export const learningLevelSchema = z.enum([
  "FOUNDATIONS",
  "PRACTICAL",
  "ADVANCED",
]);

export const createProductSchema = z.object({
  nicheId: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens")
    .optional(),
  name: z.string().min(2).max(160),
  summary: z.string().max(300).optional().nullable(),
  description: z.string().max(20000).optional().nullable(),
  audience: z.string().max(1000).optional().nullable(),
  notFor: z.string().max(1000).optional().nullable(),
  outcome: z.string().max(1000).optional().nullable(),
  learnings: z.array(z.string().min(1).max(300)).max(50).optional(),
  limitations: z.string().max(2000).optional().nullable(),
  license: z.string().max(2000).optional().nullable(),
  sampleUrl: z.string().max(500).optional().nullable(),
  level: learningLevelSchema.optional(),
  coverImage: z.string().max(500).optional().nullable(),
  pageCount: z.number().int().min(1).max(10000).optional().nullable(),
  priceAmount: z.number().int().min(0),
  compareAtAmount: z.number().int().min(0).optional().nullable(),
  currency: z.string().length(3).optional(),
  paddlePriceId: z.string().max(120).optional().nullable(),
  features: z.array(z.string().min(1).max(200)).max(30).optional(),
  files: z.array(productFileSchema).max(50).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listProductsQuerySchema = z.object({
  niche: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

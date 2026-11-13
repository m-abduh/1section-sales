import { z } from "zod";

export const createNicheSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens")
    .optional(),
  name: z.string().min(2).max(120),
  tagline: z.string().max(240).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Accent color must be a hex value")
    .optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateNicheSchema = createNicheSchema.partial();

export const nicheSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const nicheIdParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateNicheInput = z.infer<typeof createNicheSchema>;
export type UpdateNicheInput = z.infer<typeof updateNicheSchema>;

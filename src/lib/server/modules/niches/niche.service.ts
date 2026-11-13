import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { slugify } from "../../utils/slug";
import type { CreateNicheInput, UpdateNicheInput } from "./niche.schema";

export function listPublicNiches() {
  return prisma.niche.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: { where: { active: true } } } },
    },
  });
}

export function listAdminNiches() {
  return prisma.niche.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

export async function getNicheBySlug(slug: string, onlyActive = true) {
  const niche = await prisma.niche.findUnique({
    where: { slug },
    include: {
      products: {
        where: onlyActive ? { active: true } : {},
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          nicheId: true,
          slug: true,
          name: true,
          summary: true,
          description: true,
          audience: true,
          notFor: true,
          outcome: true,
          learnings: true,
          limitations: true,
          license: true,
          sampleUrl: true,
          level: true,
          coverImage: true,
          priceAmount: true,
          compareAtAmount: true,
          currency: true,
          features: true,
          active: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
          files: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, name: true, sortOrder: true, format: true },
          },
        },
      },
    },
  });

  if (!niche || (onlyActive && !niche.active)) {
    throw ApiError.notFound("Niche not found");
  }

  return niche;
}

export async function getNicheById(id: string) {
  const niche = await prisma.niche.findUnique({ where: { id } });
  if (!niche) {
    throw ApiError.notFound("Niche not found");
  }
  return niche;
}

async function ensureSlugAvailable(slug: string, ignoreId?: string) {
  const existing = await prisma.niche.findUnique({ where: { slug } });
  if (existing && existing.id !== ignoreId) {
    throw ApiError.conflict(`Niche slug "${slug}" is already used`);
  }
}

export async function createNiche(input: CreateNicheInput) {
  const slug = input.slug ?? slugify(input.name);
  if (!slug) {
    throw ApiError.badRequest("Unable to generate a slug from the provided name");
  }
  await ensureSlugAvailable(slug);

  const data: Prisma.NicheCreateInput = {
    slug,
    name: input.name,
    tagline: input.tagline ?? null,
    description: input.description ?? null,
    accentColor: input.accentColor ?? "#6366F1",
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
  };

  return prisma.niche.create({ data });
}

export async function updateNiche(id: string, input: UpdateNicheInput) {
  await getNicheById(id);

  if (input.slug) {
    await ensureSlugAvailable(input.slug, id);
  }

  const data: Prisma.NicheUpdateInput = {};
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.name !== undefined) data.name = input.name;
  if (input.tagline !== undefined) data.tagline = input.tagline;
  if (input.description !== undefined) data.description = input.description;
  if (input.accentColor !== undefined) data.accentColor = input.accentColor;
  if (input.active !== undefined) data.active = input.active;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  return prisma.niche.update({ where: { id }, data });
}

export async function deleteNiche(id: string) {
  await getNicheById(id);
  await prisma.niche.delete({ where: { id } });
}

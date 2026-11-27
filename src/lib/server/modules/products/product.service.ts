import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { slugify } from "../../utils/slug";
import type { CreateProductInput, UpdateProductInput } from "./product.schema";

const publicFileSelect = {
  id: true,
  name: true,
  sortOrder: true,
  format: true,
} satisfies Prisma.ProductFileSelect;

// Public product payloads must never expose storage references or Paddle IDs.
const publicProductSelect = {
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
  pageCount: true,
  priceAmount: true,
  compareAtAmount: true,
  currency: true,
  features: true,
  active: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  niche: { select: { id: true, slug: true, name: true, accentColor: true } },
  files: { orderBy: { sortOrder: "asc" }, select: publicFileSelect },
} satisfies Prisma.ProductSelect;

export function listPublicProducts(nicheSlug?: string) {
  return prisma.product.findMany({
    where: {
      active: true,
      ...(nicheSlug ? { niche: { slug: nicheSlug, active: true } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: publicProductSelect,
  });
}

export function listAdminProducts() {
  return prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      niche: { select: { id: true, slug: true, name: true } },
      files: { orderBy: { sortOrder: "asc" } },
      _count: { select: { orderItems: true } },
    },
  });
}

export async function getPublicProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: publicProductSelect,
  });

  if (!product || !product.active) {
    throw ApiError.notFound("Product not found");
  }

  return product;
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }
  return product;
}

async function assertNicheExists(nicheId: string) {
  const niche = await prisma.niche.findUnique({ where: { id: nicheId } });
  if (!niche) {
    throw ApiError.badRequest("Selected niche does not exist");
  }
}

async function ensureSlugAvailable(slug: string, ignoreId?: string) {
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing && existing.id !== ignoreId) {
    throw ApiError.conflict(`Product slug "${slug}" is already used`);
  }
}

type ProductFileInputShape = {
  name: string;
  provider?: "CLOUDINARY" | "LOCAL" | "EXTERNAL";
  storageKey?: string | null;
  resourceType?: string | null;
  format?: string | null;
  bytes?: number | null;
  checksum?: string | null;
  fileUrl?: string | null;
  assetFileId?: string | null;
};

function toProductFileCreate(file: ProductFileInputShape, index: number) {
  return {
    name: file.name,
    provider: file.provider ?? "EXTERNAL",
    storageKey: file.storageKey ?? null,
    resourceType: file.resourceType ?? null,
    format: file.format ?? null,
    bytes: file.bytes ?? null,
    checksum: file.checksum ?? null,
    fileUrl: file.fileUrl ?? null,
    assetFileId: file.assetFileId ?? null,
    sortOrder: index,
  };
}

export async function createProduct(input: CreateProductInput) {
  await assertNicheExists(input.nicheId);

  const slug = input.slug ?? slugify(input.name);
  if (!slug) {
    throw ApiError.badRequest("Unable to generate a slug from the provided name");
  }
  await ensureSlugAvailable(slug);

  const data: Prisma.ProductCreateInput = {
    niche: { connect: { id: input.nicheId } },
    slug,
    name: input.name,
    summary: input.summary ?? null,
    description: input.description ?? null,
    audience: input.audience ?? null,
    notFor: input.notFor ?? null,
    outcome: input.outcome ?? null,
    learnings: input.learnings ?? [],
    limitations: input.limitations ?? null,
    license: input.license ?? null,
    sampleUrl: input.sampleUrl ?? null,
    level: input.level ?? "FOUNDATIONS",
    coverImage: input.coverImage ?? null,
    pageCount: input.pageCount ?? null,
    priceAmount: input.priceAmount,
    compareAtAmount: input.compareAtAmount ?? null,
    currency: input.currency ?? "USD",
    paddlePriceId: input.paddlePriceId ?? null,
    features: input.features ?? [],
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
  };

  if (input.files && input.files.length > 0) {
    data.files = {
      create: input.files.map((file, index) => toProductFileCreate(file, index)),
    };
  }

  return prisma.product.create({ data });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await getProductById(id);

  if (input.nicheId) {
    await assertNicheExists(input.nicheId);
  }
  if (input.slug) {
    await ensureSlugAvailable(input.slug, id);
  }

  const data: Prisma.ProductUpdateInput = {};
  if (input.nicheId) data.niche = { connect: { id: input.nicheId } };
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.name !== undefined) data.name = input.name;
  if (input.summary !== undefined) data.summary = input.summary;
  if (input.description !== undefined) data.description = input.description;
  if (input.audience !== undefined) data.audience = input.audience;
  if (input.notFor !== undefined) data.notFor = input.notFor;
  if (input.outcome !== undefined) data.outcome = input.outcome;
  if (input.learnings !== undefined) data.learnings = input.learnings;
  if (input.limitations !== undefined) data.limitations = input.limitations;
  if (input.license !== undefined) data.license = input.license;
  if (input.sampleUrl !== undefined) data.sampleUrl = input.sampleUrl;
  if (input.level !== undefined) data.level = input.level;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage;
  if (input.pageCount !== undefined) data.pageCount = input.pageCount;
  if (input.priceAmount !== undefined) data.priceAmount = input.priceAmount;
  if (input.compareAtAmount !== undefined) data.compareAtAmount = input.compareAtAmount;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.paddlePriceId !== undefined) data.paddlePriceId = input.paddlePriceId;
  if (input.features !== undefined) data.features = input.features;
  if (input.active !== undefined) data.active = input.active;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  if (input.files !== undefined) {
    data.files = {
      deleteMany: {},
      create: input.files.map((file, index) => toProductFileCreate(file, index)),
    };
  }

  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: string) {
  await getProductById(id);
  await prisma.product.delete({ where: { id } });
}

import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { slugify } from "../../utils/slug";
import { generateEbookPdf } from "../../../ebook/pdf";
import { ebookSchema } from "../../../ebook/schema";
import type { EbookContent } from "../../../ebook/types";
import { hasCloudinary } from "../../config/env";
import { uploadPdfBuffer } from "../../lib/cloudinary";
import { upsertAssetFile } from "../assets/asset.service";
import * as productService from "../products/product.service";
import { syncProductToPaddle } from "../paddle/paddle-catalog.service";
import type { PublishEbookProjectInput } from "./builder.schema";

const listSelect = {
  id: true,
  title: true,
  status: true,
  productId: true,
  createdAt: true,
  updatedAt: true,
  content: true,
} as const;

export function listEbookProjects() {
  return prisma.ebookProject.findMany({
    orderBy: { updatedAt: "desc" },
    select: listSelect,
  });
}

export async function getEbookProject(id: string) {
  const project = await prisma.ebookProject.findUnique({ where: { id } });
  if (!project) {
    throw ApiError.notFound("Ebook project not found");
  }
  return project;
}

export function parseProjectContent(raw: unknown): EbookContent {
  const parsed = ebookSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(422, "Konten ebook tidak valid.", {
      code: "INVALID_CONTENT",
      details: parsed.error.issues,
    });
  }
  return parsed.data;
}

export function createEbookProject(input: {
  title: string;
  prompt: string;
  content: EbookContent;
}) {
  return prisma.ebookProject.create({
    data: {
      title: input.title,
      prompt: input.prompt,
      content: input.content,
      status: "draft",
    },
  });
}

export async function updateEbookProject(
  id: string,
  input: {
    title?: string;
    status?: string;
    content?: EbookContent;
  },
) {
  await getEbookProject(id);

  return prisma.ebookProject.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
    },
  });
}

export async function deleteEbookProject(id: string) {
  await getEbookProject(id);
  await prisma.ebookProject.delete({ where: { id } });
}

function summarize(text: string, max: number) {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Renders the ebook to PDF, uploads it to private storage, then creates (or
 * updates) the catalog product that buyers can purchase.
 */
export async function publishEbookProject(
  id: string,
  input: PublishEbookProjectInput,
) {
  const project = await getEbookProject(id);
  const content = parseProjectContent(project.content);

  if (!hasCloudinary) {
    throw new ApiError(
      503,
      "Cloudinary belum dikonfigurasi. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET untuk menyimpan PDF.",
      { code: "STORAGE_NOT_CONFIGURED" },
    );
  }

  const buffer = await generateEbookPdf(content);
  const name = input.name?.trim() || content.title;
  const uploaded = await uploadPdfBuffer(buffer, `${slugify(name) || "ebook"}.pdf`);
  const asset = await upsertAssetFile({
    storageKey: uploaded.storageKey,
    provider: uploaded.provider,
    resourceType: uploaded.resourceType,
    format: uploaded.format,
    mimeType: "application/pdf",
    bytes: uploaded.bytes,
    checksum: uploaded.checksum,
  });

  const fileInput = {
    name: name,
    provider: uploaded.provider,
    storageKey: uploaded.storageKey,
    resourceType: uploaded.resourceType,
    format: uploaded.format,
    bytes: uploaded.bytes,
    checksum: uploaded.checksum,
    assetFileId: asset.id,
  };

  const productInput = {
    nicheId: input.nicheId,
    slug: input.slug,
    name,
    summary: input.summary ?? summarize(content.description, 300),
    description: input.description ?? content.description,
    outcome: input.outcome ?? null,
    audience: input.audience ?? null,
    notFor: input.notFor ?? null,
    learnings: input.learnings ?? [],
    limitations:
      input.limitations ??
      "This material is for educational purposes only and does not constitute personalized professional advice.",
    license:
      input.license ?? "Personal use only. Do not redistribute or resell the files.",
    sampleUrl: input.sampleUrl ?? null,
    level: input.level ?? "FOUNDATIONS",
    coverImage: content.cover?.renderedUrl ?? null,
    priceAmount: input.priceAmount,
    compareAtAmount: input.compareAtAmount ?? null,
    currency: "USD",
    features: input.features ?? [],
    files: [fileInput],
    active: input.active ?? false,
    sortOrder: 0,
  };

  const product = project.productId
    ? await productService.updateProduct(project.productId, productInput)
    : await productService.createProduct(productInput);

  try {
    await syncProductToPaddle(product.id);
  } catch (error) {
    // Publishing should still succeed when Paddle is temporarily unavailable;
    // the product page exposes a manual "Sync to Paddle" action.
    console.warn(
      `[paddle] auto-sync after builder publish failed for product ${product.id}:`,
      error instanceof Error ? error.message : error,
    );
  }

  await prisma.ebookProject.update({
    where: { id: project.id },
    data: { status: "final", productId: product.id },
  });

  return productService.getProductById(product.id);
}

import "dotenv/config";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { checksumOf, uploadPdfBuffer } from "../src/lib/server/lib/cloudinary";
import { niches, products } from "./seed-data";

const prisma = new PrismaClient();

const pdfDir = path.resolve(process.cwd(), process.env.SEED_PDF_DIR ?? "pdf");

/**
 * Sample guide slugs that were replaced by the current catalogue. Removing
 * them keeps `db:seed` idempotent on databases seeded before the rewrite.
 * Product removal is safe: order items keep their snapshots and only lose the
 * optional product reference (`onDelete: SetNull`).
 */
const legacyProductSlugs = [
  "budgeting-with-irregular-income",
  "customer-discovery-sprint",
  "habit-rebuild-kit",
  "skill-plan-for-target-role",
  "learn-a-hard-subject-alone",
  "routine-that-survives-a-busy-week",
  "choose-tools-with-confidence",
  "calmer-daily-routines",
  "break-the-repeating-argument",
  "understand-risk-before-returns",
];

async function attachPdf(
  productId: string,
  seedProduct: { name: string; pdfFile?: string },
) {
  if (!seedProduct.pdfFile) return;

  const filePath = path.join(pdfDir, seedProduct.pdfFile);
  if (!existsSync(filePath)) {
    console.warn(`[seed] pdf not found, skipped: ${seedProduct.pdfFile}`);
    return;
  }

  const buffer = await readFile(filePath);
  const checksum = checksumOf(buffer);

  // Reuse an existing asset for the same bytes so repeated seeds do not upload
  // duplicate files to Cloudinary.
  let asset = await prisma.assetFile.findFirst({
    where: { provider: "CLOUDINARY", mimeType: "application/pdf", checksum },
    orderBy: { createdAt: "desc" },
  });

  if (!asset) {
    const uploaded = await uploadPdfBuffer(buffer, seedProduct.pdfFile);
    asset = await prisma.assetFile.create({
      data: {
        storageKey: uploaded.storageKey,
        provider: uploaded.provider,
        resourceType: uploaded.resourceType,
        format: uploaded.format,
        mimeType: "application/pdf",
        bytes: uploaded.bytes,
        checksum: uploaded.checksum,
      },
    });
    console.log(`[seed] uploaded pdf: ${seedProduct.pdfFile}`);
  }

  const fileData = {
    name: seedProduct.name,
    provider: "CLOUDINARY" as const,
    storageKey: asset.storageKey,
    resourceType: asset.resourceType,
    format: asset.format,
    bytes: asset.bytes,
    checksum: asset.checksum,
    fileUrl: null,
    assetFileId: asset.id,
  };

  await prisma.productFile.upsert({
    where: { productId_sortOrder: { productId, sortOrder: 0 } },
    update: fileData,
    create: { productId, sortOrder: 0, ...fileData },
  });
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@1section.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminName = process.env.ADMIN_NAME ?? "Administrator";

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { name: adminName, passwordHash },
    create: { email: adminEmail, name: adminName, passwordHash, role: "admin" },
  });
  console.log(`[seed] admin ready: ${adminEmail}`);

  for (const nicheData of niches) {
    const niche = await prisma.niche.upsert({
      where: { slug: nicheData.slug },
      update: {
        name: nicheData.name,
        tagline: nicheData.tagline,
        description: nicheData.description,
        audience: nicheData.audience,
        problems: nicheData.problems,
        accentColor: nicheData.accentColor,
        sortOrder: nicheData.sortOrder,
        active: true,
      },
      create: { ...nicheData, active: true },
    });

    const nicheProducts = products.filter((p) => p.nicheSlug === nicheData.slug);
    for (const productData of nicheProducts) {
      const { nicheSlug: _nicheSlug, pdfFile: _pdfFile, ...rest } = productData;
      const product = await prisma.product.upsert({
        where: { slug: productData.slug },
        update: {
          nicheId: niche.id,
          ...rest,
          features: rest.features,
          active: true,
        },
        create: {
          nicheId: niche.id,
          ...rest,
          currency: "USD",
          features: rest.features,
          active: true,
        },
      });

      await attachPdf(product.id, productData);
    }
    console.log(`[seed] niche "${nicheData.slug}" with ${nicheProducts.length} product(s)`);
  }

  const removed = await prisma.product.deleteMany({
    where: { slug: { in: legacyProductSlugs } },
  });
  if (removed.count > 0) {
    console.log(`[seed] removed ${removed.count} legacy product(s)`);
  }

  console.log("[seed] done");
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

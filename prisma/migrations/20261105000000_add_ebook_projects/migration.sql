-- CreateTable
CREATE TABLE "ebook_projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ebook_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ebook_projects_productId_key" ON "ebook_projects"("productId");

-- CreateIndex
CREATE INDEX "ebook_projects_createdAt_idx" ON "ebook_projects"("createdAt");

-- AddForeignKey
ALTER TABLE "ebook_projects" ADD CONSTRAINT "ebook_projects_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

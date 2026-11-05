"use client";

import { useParams } from "next/navigation";
import { EbookPreview } from "@/components/admin/builder/ebook-preview";

export default function AdminBuilderPreviewPage() {
  const params = useParams<{ id: string }>();
  return <EbookPreview projectId={params.id} />;
}

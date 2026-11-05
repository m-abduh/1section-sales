"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EbookEditor } from "@/components/admin/builder/ebook-editor";
import { useEbookProject } from "@/hooks/use-builder";
import { getApiErrorMessage } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";

export default function AdminBuilderEditorPage() {
  const params = useParams<{ id: string }>();
  const project = useEbookProject(params.id);

  if (project.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <Spinner /> Loading ebook...
      </div>
    );
  }

  if (project.isError || !project.data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-fg-muted">
        {project.isError ? getApiErrorMessage(project.error) : "Ebook tidak ditemukan."}{" "}
        <Link href="/admin/builder" className="font-medium text-fg underline">
          Kembali ke builder
        </Link>
      </div>
    );
  }

  return (
    <EbookEditor
      key={project.data.id}
      projectId={project.data.id}
      initialContent={project.data.content}
      initialStatus={project.data.status === "final" ? "final" : "draft"}
      updatedAt={project.data.updatedAt}
    />
  );
}

"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  Clock3,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useDeleteEbookProject,
  useEbookProjects,
} from "@/hooks/use-builder";
import { getApiErrorMessage } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function AdminBuilderPage() {
  const projects = useEbookProjects();
  const deleteProject = useDeleteEbookProject();

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Hapus ebook "${title}"?`)) return;
    try {
      await deleteProject.mutateAsync(id);
    } catch (error) {
      window.alert(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Product Builder"
        title="Ebook Studio"
        description="Ubah brief menjadi ebook siap jual: editor berpaginasi, preview PDF A5, download DOCX, lalu publish ke katalog."
        actions={
          <Link href="/admin/builder/new">
            <Button>
              <Plus className="size-4" />
              New ebook
            </Button>
          </Link>
        }
      />

      {projects.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading ebooks...
        </div>
      ) : null}

      {projects.isError ? (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {getApiErrorMessage(projects.error)}
        </p>
      ) : null}

      {projects.data && projects.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface-muted text-fg-muted">
            <BookOpenText className="size-5" />
          </span>
          <p className="mt-4 text-sm font-medium text-fg">Belum ada ebook</p>
          <p className="mt-1 max-w-sm text-xs text-fg-muted">
            Mulai dari brief singkat atau pakai konten contoh untuk melihat
            struktur ebook lengkap.
          </p>
          <Link href="/admin/builder/new" className="mt-5">
            <Button>
              <Plus className="size-4" />
              Buat ebook
            </Button>
          </Link>
        </div>
      ) : null}

      {projects.data && projects.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.data.map((project) => {
            const chapters = project.content?.chapters?.length ?? 0;
            const references = project.content?.references?.length ?? 0;
            return (
              <article
                key={project.id}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-fg-muted/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ring-1 ring-inset ${
                      project.status === "final"
                        ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400"
                    }`}
                  >
                    {project.status === "final" ? "Selesai" : "Draft"}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-fg-muted">
                    <Clock3 className="size-3" />
                    {formatRelative(project.updatedAt)}
                  </span>
                </div>

                <h2 className="mt-4 line-clamp-2 text-base font-semibold leading-snug text-fg">
                  {project.title}
                </h2>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
                  {project.content?.niche ?? "Ebook"}
                </p>
                <p className="mt-3 line-clamp-3 flex-1 text-xs leading-relaxed text-fg-muted">
                  {project.content?.description ?? project.prompt}
                </p>

                <div className="mt-4 flex items-center gap-3 text-[11px] text-fg-muted">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="size-3" />
                    {chapters} bab
                  </span>
                  <span className="size-1 rounded-full bg-border" />
                  <span>{references} referensi</span>
                  {project.productId ? (
                    <>
                      <span className="size-1 rounded-full bg-border" />
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        Published
                      </span>
                    </>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <Link
                    href={`/admin/builder/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-fg transition group-hover:underline"
                  >
                    Buka editor
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/builder/${project.id}/preview`}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-fg-muted transition hover:bg-surface-muted hover:text-fg"
                    >
                      Preview
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(project.id, project.title)}
                      className="rounded-lg p-1.5 text-fg-muted transition hover:bg-red-500/10 hover:text-red-600"
                      aria-label={`Hapus ${project.title}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

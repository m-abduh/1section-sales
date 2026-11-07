"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import type { EbookChapter, EbookContent, EbookCover } from "@/lib/ebook/types";
import {
  richTextFromChapter,
  richTextFromParagraphs,
  richTextIsEmpty,
  richTextToParagraphs,
} from "@/lib/ebook/rich-text";
import {
  COVER_HEIGHT,
  COVER_WIDTH,
  coverFingerprint,
  isCoverStale,
} from "@/lib/ebook/cover";
import { captureCoverElement } from "@/lib/ebook/capture-cover";
import {
  generateEbookChapterPart,
  generateEbookMetadataPart,
  generateEbookReferencesPart,
  generateEbookSectionPart,
  useCreateEbookContent,
  useUpdateEbookProject,
  useUploadBuilderImage,
  type EbookStatus,
} from "@/hooks/use-builder";
import { useAdminNiches } from "@/hooks/use-admin-niches";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/admin/modal";
import { RichTextEditor } from "@/components/admin/builder/rich-text-editor";
import { CoverBuilder } from "@/components/admin/builder/cover-builder";
import { EbookCoverDesign } from "@/components/admin/builder/ebook-cover";
import { Spinner } from "@/components/ui/spinner";

type PageKey =
  | "metadata"
  | "introduction"
  | `chapter-${number}`
  | "conclusion"
  | "references"
  | "about";

type EditorPage = {
  key: PageKey;
  label: string;
  shortLabel: string;
};

/**
 * Friendly checks before the first save of a blank ebook. The API still does
 * the authoritative validation; this only explains what is missing.
 */
function missingRequiredFields(content: EbookContent): string | null {
  if (!content.niche.trim()) return "Pilih niche/kategori dulu sebelum menyimpan.";
  if (!content.title.trim()) return "Isi judul ebook dulu sebelum menyimpan.";
  if (!content.description.trim()) return "Isi deskripsi cover dulu sebelum menyimpan.";

  const intro = content.introductionBody?.length
    ? richTextToParagraphs(content.introductionBody)
    : content.introduction;
  if (!intro.some((text) => text.trim())) return "Pendahuluan masih kosong.";

  for (const [index, chapter] of content.chapters.entries()) {
    if (!chapter.title.trim()) return `Judul bab ${index + 1} masih kosong.`;
    const hasBody = !richTextIsEmpty(chapter.body);
    const hasSections = chapter.sections.some(
      (section) =>
        section.title.trim() &&
        section.paragraphs.some((text) => text.trim()),
    );
    if (!hasBody && !hasSections) return `Isi bab ${index + 1} masih kosong.`;
  }

  if (!content.conclusion.some((text) => text.trim())) {
    return "Kesimpulan masih kosong.";
  }
  if (
    !content.references.some(
      (reference) => reference.title.trim() && reference.url.trim(),
    )
  ) {
    return "Isi minimal satu referensi lengkap (judul dan URL).";
  }
  if (!content.about.some((text) => text.trim())) {
    return "Bagian about masih kosong.";
  }
  return null;
}

export function EbookEditor({
  projectId,
  initialContent,
  initialStatus,
  updatedAt = "",
}: {
  /** Kosong berarti editor kosong: draft baru dibuat saat pengguna menyimpan. */
  projectId?: string;
  initialContent: EbookContent;
  initialStatus: EbookStatus;
  updatedAt?: string;
}) {
  const router = useRouter();
  const updateProject = useUpdateEbookProject();
  const createProject = useCreateEbookContent();
  const uploadCover = useUploadBuilderImage();
  const coverNodeRef = useRef<HTMLDivElement | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    projectId ?? null,
  );
  const [content, setContent] = useState<EbookContent>(initialContent);
  const [status, setStatus] = useState<EbookStatus>(initialStatus);
  const [pageIndex, setPageIndex] = useState(0);
  const [dirty, setDirty] = useState(!projectId);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(updatedAt);
  const [partBusy, setPartBusy] = useState<string | null>(null);
  const [partError, setPartError] = useState<{
    key: string;
    message: string;
  } | null>(null);

  const pages = useMemo<EditorPage[]>(
    () => [
      { key: "metadata", label: "Cover & metadata", shortLabel: "Cover" },
      { key: "introduction", label: "Introduction", shortLabel: "Introduction" },
      ...content.chapters.map<EditorPage>((chapter, index) => ({
        key: `chapter-${index}`,
        label: `${String(index + 1).padStart(2, "0")}. ${chapter.title || "Chapter without title"}`,
        shortLabel: `Chapter ${index + 1}`,
      })),
      { key: "conclusion", label: "Conclusion", shortLabel: "Conclusion" },
      { key: "references", label: "References", shortLabel: "References" },
      { key: "about", label: "About", shortLabel: "About" },
    ],
    [content.chapters],
  );

  const safePageIndex = Math.min(pageIndex, pages.length - 1);
  const page = pages[safePageIndex];

  function patchContent(
    next: EbookContent | ((previous: EbookContent) => EbookContent),
  ) {
    setContent(next);
    setDirty(true);
    setNotice(null);
    setError(null);
    setCoverError(null);
  }

  async function runPart<T>(
    key: string,
    task: () => Promise<T>,
  ): Promise<T | null> {
    setPartBusy(key);
    setPartError(null);
    setNotice(null);
    try {
      return await task();
    } catch (caught) {
      setPartError({ key, message: getApiErrorMessage(caught) });
      return null;
    } finally {
      setPartBusy(null);
    }
  }

  async function generateMetadata() {
    const result = await runPart("metadata", () =>
      generateEbookMetadataPart({
        brand: content.brand,
        niche: content.niche,
        brief: content.metadataBrief ?? "",
        currentTitle: content.title,
      }),
    );
    if (!result) return;
    patchContent((previous) => ({
      ...previous,
      title: result.title,
      description: result.description,
    }));
    setNotice("AI mengisi judul dan deskripsi cover. Periksa lalu simpan.");
  }

  async function generateIntroduction() {
    const result = await runPart("introduction", () =>
      generateEbookSectionPart({
        section: "introduction",
        brand: content.brand,
        niche: content.niche,
        bookTitle: content.title,
        brief: content.introductionBrief ?? "",
      }),
    );
    if (!result) return;
    patchContent((previous) => ({
      ...previous,
      introduction: result.paragraphs,
      introductionBody: richTextFromParagraphs(result.paragraphs),
    }));
    setNotice("AI mengisi pendahuluan. Periksa lalu simpan.");
  }

  async function generateConclusion() {
    const result = await runPart("conclusion", () =>
      generateEbookSectionPart({
        section: "conclusion",
        brand: content.brand,
        niche: content.niche,
        bookTitle: content.title,
        brief: content.conclusionBrief ?? "",
      }),
    );
    if (!result) return;
    patchContent((previous) => ({
      ...previous,
      conclusion: result.paragraphs,
    }));
    setNotice("AI mengisi kesimpulan. Periksa lalu simpan.");
  }

  async function generateAbout() {
    const result = await runPart("about", () =>
      generateEbookSectionPart({
        section: "about",
        brand: content.brand,
        niche: content.niche,
        bookTitle: content.title,
        brief: content.aboutBrief ?? "",
      }),
    );
    if (!result) return;
    patchContent((previous) => ({ ...previous, about: result.paragraphs }));
    setNotice("AI mengisi about. Periksa lalu simpan.");
  }

  async function generateReferences() {
    const result = await runPart("references", () =>
      generateEbookReferencesPart({
        brand: content.brand,
        niche: content.niche,
        bookTitle: content.title,
        brief: content.referencesBrief ?? "",
      }),
    );
    if (!result) return;
    patchContent((previous) => ({
      ...previous,
      references: result.references,
    }));
    setNotice("AI mengisi daftar referensi. Periksa lalu simpan.");
  }

  async function generateChapter(index: number) {
    const chapter = content.chapters[index];
    if (!chapter) return;
    const result = await runPart(`chapter-${index}`, () =>
      generateEbookChapterPart({
        brand: content.brand,
        niche: content.niche,
        bookTitle: content.title,
        chapterTitle: chapter.title,
        brief: chapter.brief ?? "",
        index,
        total: content.chapters.length,
      }),
    );
    if (!result) return;
    patchContent((previous) => ({
      ...previous,
      chapters: previous.chapters.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              title: result.title || item.title,
              intro: result.intro,
              sections: result.sections,
              body: richTextFromChapter(result),
              references: result.references?.length
                ? result.references
                : item.references,
            }
          : item,
      ),
    }));
    setNotice("AI mengisi bab ini. Periksa judul, isi, dan referensinya lalu simpan.");
  }

  async function renderCover(next: EbookContent): Promise<EbookCover | null> {
    const node = coverNodeRef.current;
    if (!next.cover || !node) return null;

    setCoverBusy(true);
    setCoverError(null);
    try {
      const file = await captureCoverElement(node);
      const uploaded = await uploadCover.mutateAsync(file);
      return {
        ...next.cover,
        renderedUrl: uploaded.url,
        renderedHash: coverFingerprint(next),
      };
    } catch (caught) {
      setCoverError(getApiErrorMessage(caught));
      return null;
    } finally {
      setCoverBusy(false);
    }
  }

  async function persistContent(): Promise<string | null> {
    setSaving(true);
    setError(null);
    setNotice(null);
    let nextContent = content;
    try {
      if (!activeProjectId) {
        const missing = missingRequiredFields(nextContent);
        if (missing) {
          setError(missing);
          return null;
        }
      }

      if (content.cover && isCoverStale(content)) {
        setNotice("Memperbarui gambar cover…");
        const rendered = await renderCover(content);
        if (rendered) {
          nextContent = { ...content, cover: rendered };
          setContent(nextContent);
        }
      }

      if (!activeProjectId) {
        const created = await createProject.mutateAsync({
          content: nextContent,
        });
        setActiveProjectId(created.id);
        setDirty(false);
        setSavedAt(created.updatedAt);
        setNotice("Draft baru dibuat dan konten tersimpan.");
        router.replace(`/admin/builder/${created.id}`);
        return created.id;
      }

      const project = await updateProject.mutateAsync({
        id: activeProjectId,
        input: { content: nextContent },
      });
      setDirty(false);
      setSavedAt(project.updatedAt);
      setNotice("Perubahan tersimpan.");
      return activeProjectId;
    } catch (caught) {
      setError(getApiErrorMessage(caught));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    const id =
      activeProjectId && !dirty
        ? activeProjectId
        : await persistContent();
    if (!id) return;
    router.push(`/admin/builder/${id}/preview`);
  }

  async function handleStatus() {
    const id =
      activeProjectId && !dirty
        ? activeProjectId
        : await persistContent();
    if (!id) return;
    const next: EbookStatus = status === "final" ? "draft" : "final";
    setStatusBusy(true);
    setError(null);
    setNotice(null);
    try {
      const project = await updateProject.mutateAsync({
        id,
        input: { status: next },
      });
      setStatus(next);
      setSavedAt(project.updatedAt);
      setNotice(
        next === "final"
          ? "Ebook ditandai selesai. PDF sudah bisa dibuat."
          : "Ebook dikembalikan ke draft.",
      );
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setStatusBusy(false);
    }
  }

  function goTo(index: number) {
    setPageIndex(Math.max(0, Math.min(pages.length - 1, index)));
  }

  function deleteChapter(index: number) {
    const total = content.chapters.length;
    if (total <= 1) return;
    patchContent((previous) => ({
      ...previous,
      chapters: previous.chapters.filter(
        (_unused, itemIndex) => itemIndex !== index,
      ),
    }));
    setPageIndex(Math.min(index + 1, total + 3));
  }

  function addChapter() {
    const newChapter: EbookChapter = {
      title: "New Chapter",
      sections: [],
    };
    patchContent((previous) => ({
      ...previous,
      chapters: [...previous.chapters, newChapter],
    }));
    setPageIndex(2 + content.chapters.length);
  }

  const busy = saving || statusBusy;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/builder"
          className="inline-flex items-center gap-2 text-xs font-medium text-fg-muted transition hover:text-fg"
        >
          <ArrowLeft className="size-3.5" />
          Product Builder
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ring-1 ring-inset ${
              status === "final"
                ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400"
            }`}
          >
            {status === "final" ? "Selesai" : "Draft"}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleStatus}
            disabled={busy}
          >
            {statusBusy ? (
              <Spinner />
            ) : status === "final" ? (
              <Undo2 className="size-3.5" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            {status === "final" ? "Kembali ke draft" : "Tandai selesai"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void persistContent()}
            disabled={busy}
          >
            {saving ? <Spinner /> : <Save className="size-3.5" />}
            Simpan
          </Button>
          <Button size="sm" onClick={handlePreview} disabled={busy}>
            <Eye className="size-3.5" />
            Preview &amp; Export
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={addChapter}
            disabled={busy}
          >
            <Plus className="size-3.5" />
            Tambah Bab
          </Button>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Editor ebook
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {content.title}
        </h1>
        <p className="mt-1 text-xs text-fg-muted">
          {[content.niche.trim(), `${content.chapters.length} bab`]
            .filter(Boolean)
            .join(" · ")}{" "}
          ·{" "}
          {activeProjectId
            ? `terakhir diperbarui ${formatDate(savedAt)}${
                dirty ? " · ada perubahan belum disimpan" : ""
              }`
            : "belum disimpan ke database"}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs leading-relaxed text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-3">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-fg-muted">
              Halaman ebook
            </p>
            <nav className="mt-1 space-y-0.5">
              {pages.map((item, index) => {
                const chapterIndex = index - 2;
                const isChapter =
                  chapterIndex >= 0 && chapterIndex < content.chapters.length;
                return (
                  <div key={item.key} className="group relative">
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 pr-8 text-left text-[11px] leading-snug transition ${
                        safePageIndex === index
                          ? "bg-surface-muted font-semibold text-fg"
                          : "text-fg-muted hover:bg-surface-muted/70 hover:text-fg"
                      }`}
                    >
                      <span className="w-5 shrink-0 font-mono text-[10px] text-fg-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="line-clamp-2">{item.label}</span>
                    </button>
                    {isChapter && content.chapters.length > 1 ? (
                      <button
                        type="button"
                        aria-label={`Hapus ${item.shortLabel}`}
                        title={`Hapus ${item.shortLabel}`}
                        onClick={() => setPendingDelete(chapterIndex)}
                        className="absolute right-1 top-1.5 grid size-6 place-items-center rounded-md text-fg-muted opacity-0 transition hover:bg-red-500/10 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <PageHeading
              eyebrow={`Halaman ${safePageIndex + 1} dari ${pages.length}`}
              title={page.label}
            />
            <div className="mt-5">
              {page.key === "metadata" ? (
                <div className="space-y-6">
                  <CoverBuilder
                    content={content}
                    busy={busy || coverBusy}
                    stale={isCoverStale(content)}
                    error={coverError}
                    onChange={(cover) =>
                      patchContent((previous) => ({ ...previous, cover }))
                    }
                    onRender={() => void persistContent()}
                  />
                  <PartBrief
                    label="Brief cover & metadata"
                    value={content.metadataBrief ?? ""}
                    onChange={(metadataBrief) =>
                      patchContent((previous) => ({
                        ...previous,
                        metadataBrief,
                      }))
                    }
                    onGenerate={() => void generateMetadata()}
                    busy={partBusy === "metadata"}
                    error={
                      partError?.key === "metadata" ? partError.message : null
                    }
                    hint="AI akan mengisi judul dan deskripsi cover dari brief ini. Brand dan niche tetap seperti yang kamu pilih."
                  />
                  <div className="border-t border-border pt-5">
                    <MetadataPage content={content} onChange={patchContent} />
                  </div>
                </div>
              ) : null}
              {page.key === "introduction" ? (
                <div className="space-y-4">
                  <PartBrief
                    label="Brief pendahuluan"
                    value={content.introductionBrief ?? ""}
                    onChange={(introductionBrief) =>
                      patchContent((previous) => ({
                        ...previous,
                        introductionBrief,
                      }))
                    }
                    onGenerate={() => void generateIntroduction()}
                    busy={partBusy === "introduction"}
                    error={
                      partError?.key === "introduction"
                        ? partError.message
                        : null
                    }
                    hint="AI akan mengisi kolom pendahuluan di bawah dari brief ini."
                  />
                  <div>
                    <p className="mb-2 text-[11px] text-fg-muted">
                      Tulis pendahuluan dengan format tebal, sub-judul, daftar,
                      tabel, atau gambar.
                    </p>
                    <RichTextEditor
                      value={
                        content.introductionBody ??
                        richTextFromParagraphs(content.introduction)
                      }
                      onChange={(introductionBody) =>
                        patchContent((previous) => {
                          const paragraphs =
                            richTextToParagraphs(introductionBody);
                          return {
                            ...previous,
                            introductionBody,
                            introduction: paragraphs.length
                              ? paragraphs
                              : previous.introduction,
                          };
                        })
                      }
                      placeholder="Tulis pendahuluan…"
                    />
                  </div>
                </div>
              ) : null}
              {page.key.startsWith("chapter-") ? (
                <ChapterEditor
                  key={page.key}
                  chapter={
                    content.chapters[Number(page.key.split("-")[1])] ?? {
                      title: "",
                      sections: [],
                    }
                  }
                  canDelete={content.chapters.length > 1}
                  onRequestDelete={() =>
                    setPendingDelete(Number(page.key.split("-")[1]))
                  }
                  generating={partBusy === page.key}
                  briefError={
                    partError?.key === page.key ? partError.message : null
                  }
                  onGenerate={() =>
                    void generateChapter(Number(page.key.split("-")[1]))
                  }
                  onChange={(chapter) => {
                    const index = Number(page.key.split("-")[1]);
                    patchContent((previous) => ({
                      ...previous,
                      chapters: previous.chapters.map((item, itemIndex) =>
                        itemIndex === index ? chapter : item,
                      ),
                    }));
                  }}
                />
              ) : null}
              {page.key === "conclusion" ? (
                <div className="space-y-4">
                  <PartBrief
                    label="Brief kesimpulan"
                    value={content.conclusionBrief ?? ""}
                    onChange={(conclusionBrief) =>
                      patchContent((previous) => ({
                        ...previous,
                        conclusionBrief,
                      }))
                    }
                    onGenerate={() => void generateConclusion()}
                    busy={partBusy === "conclusion"}
                    error={
                      partError?.key === "conclusion" ? partError.message : null
                    }
                    hint="AI akan mengisi kolom kesimpulan di bawah dari brief ini."
                  />
                  <ParagraphList
                    values={content.conclusion}
                    max={8}
                    onChange={(conclusion) =>
                      patchContent({ ...content, conclusion })
                    }
                  />
                </div>
              ) : null}
              {page.key === "references" ? (
                <div className="space-y-4">
                  <PartBrief
                    label="Brief referensi"
                    value={content.referencesBrief ?? ""}
                    onChange={(referencesBrief) =>
                      patchContent((previous) => ({
                        ...previous,
                        referencesBrief,
                      }))
                    }
                    onGenerate={() => void generateReferences()}
                    busy={partBusy === "references"}
                    error={
                      partError?.key === "references" ? partError.message : null
                    }
                    hint="AI akan mengisi daftar referensi di bawah dari brief ini."
                  />
                  <ReferencesPage content={content} onChange={patchContent} />
                </div>
              ) : null}
              {page.key === "about" ? (
                <div className="space-y-4">
                  <PartBrief
                    label="Brief about"
                    value={content.aboutBrief ?? ""}
                    onChange={(aboutBrief) =>
                      patchContent((previous) => ({ ...previous, aboutBrief }))
                    }
                    onGenerate={() => void generateAbout()}
                    busy={partBusy === "about"}
                    error={
                      partError?.key === "about" ? partError.message : null
                    }
                    hint="AI akan mengisi kolom about di bawah dari brief ini."
                  />
                  <ParagraphList
                    values={content.about}
                    max={8}
                    onChange={(about) => patchContent({ ...content, about })}
                  />
                </div>
              ) : null}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goTo(safePageIndex - 1)}
              disabled={safePageIndex === 0}
            >
              <ChevronLeft className="size-3.5" />
              Sebelumnya
            </Button>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-fg-muted">
                {dirty ? "Belum disimpan" : "Tersimpan"}
              </span>
              <div className="flex items-center gap-1">
                {pages.map((item, index) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-label={`Buka ${item.shortLabel}`}
                    onClick={() => goTo(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === safePageIndex
                        ? "w-5 bg-fg"
                        : "w-1.5 bg-border hover:bg-fg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => goTo(safePageIndex + 1)}
              disabled={safePageIndex === pages.length - 1}
            >
              Berikutnya
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-muted/60 px-4 py-3">
            <p className="text-xs text-fg-muted">
              {dirty
                ? "Simpan perubahan sebelum preview agar hasil export ikut terbaru."
                : "Semua perubahan sudah tersimpan."}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void persistContent()}
                disabled={busy}
              >
                {saving ? <Spinner /> : <Save className="size-3.5" />}
                Simpan
              </Button>
              <Button size="sm" onClick={handlePreview} disabled={busy}>
                <Eye className="size-3.5" />
                Preview PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {content.cover ? (
        <div
          ref={coverNodeRef}
          aria-hidden
          className="pointer-events-none fixed left-[-20000px] top-0"
          style={{ width: COVER_WIDTH, height: COVER_HEIGHT }}
        >
          <EbookCoverDesign content={content} cover={content.cover} />
        </div>
      ) : null}

      <Modal
        open={pendingDelete !== null}
        title="Hapus bab ini?"
        onClose={() => setPendingDelete(null)}
      >
        <p className="text-xs leading-relaxed text-fg-muted">
          Bab{" "}
          <span className="font-semibold text-fg">
            {pendingDelete !== null
              ? content.chapters[pendingDelete]?.title || "tanpa judul"
              : ""}
          </span>{" "}
          beserta seluruh isi dan gambarnya akan dihapus. Tindakan ini tidak
          bisa dibatalkan setelah perubahan disimpan.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPendingDelete(null)}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (pendingDelete !== null) deleteChapter(pendingDelete);
              setPendingDelete(null);
            }}
          >
            <Trash2 className="size-3.5" />
            Hapus bab
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function PageHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-fg">{title}</h2>
    </div>
  );
}

function MetadataPage({
  content,
  onChange,
}: {
  content: EbookContent;
  onChange: (content: EbookContent) => void;
}) {
  const niches = useAdminNiches();
  const options = niches.data ?? [];
  const matchedNiche = options.find(
    (niche) =>
      niche.name.trim().toLowerCase() === content.niche.trim().toLowerCase(),
  );
  const nicheValue = matchedNiche?.name ?? content.niche;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand">
          <Input
            value={content.brand}
            onChange={(event) =>
              onChange({ ...content, brand: event.target.value })
            }
            placeholder="1section"
          />
        </Field>
        <Field
          label="Niche / kategori"
          hint={
            niches.isLoading
              ? "Memuat daftar niche…"
              : niches.isError
                ? "Gagal memuat niche. Coba muat ulang halaman."
                : "Diambil dari daftar Niche di dashboard."
          }
        >
          <select
            value={nicheValue}
            onChange={(event) =>
              onChange({ ...content, niche: event.target.value })
            }
            disabled={niches.isLoading}
            className="w-full rounded-lg border-0 bg-card px-3 py-2 text-sm text-fg shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-accent disabled:opacity-60"
          >
            {!content.niche ? <option value="">Pilih niche</option> : null}
            {content.niche && !matchedNiche ? (
              <option value={content.niche}>{content.niche}</option>
            ) : null}
            {options.map((niche) => (
              <option key={niche.id} value={niche.name}>
                {niche.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Judul ebook">
        <Input
          value={content.title}
          onChange={(event) =>
            onChange({ ...content, title: event.target.value })
          }
        />
      </Field>
      <Field label="Deskripsi cover">
        <Textarea
          value={content.description}
          rows={4}
          onChange={(event) =>
            onChange({ ...content, description: event.target.value })
          }
        />
      </Field>
    </div>
  );
}

function ReferencesPage({
  content,
  onChange,
}: {
  content: EbookContent;
  onChange: (content: EbookContent) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-fg-muted">
        Gunakan sumber nyata dan URL yang valid.
      </p>
      {content.references.map((reference, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-surface-muted/40 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
              Referensi {index + 1}
            </p>
            {content.references.length > 1 ? (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...content,
                    references: content.references.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  })
                }
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 transition hover:text-red-700 dark:text-red-400"
              >
                <Trash2 className="size-3" />
                Hapus
              </button>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Judul / sumber">
              <Input
                value={reference.title}
                onChange={(event) =>
                  onChange({
                    ...content,
                    references: updateReference(content.references, index, {
                      title: event.target.value,
                    }),
                  })
                }
              />
            </Field>
            <Field label="URL">
              <Input
                value={reference.url}
                onChange={(event) =>
                  onChange({
                    ...content,
                    references: updateReference(content.references, index, {
                      url: event.target.value,
                    }),
                  })
                }
              />
            </Field>
          </div>
        </div>
      ))}
      {content.references.length < 20 ? (
        <AddButton
          label="Tambah referensi"
          onClick={() =>
            onChange({
              ...content,
              references: [...content.references, { title: "", url: "" }],
            })
          }
        />
      ) : null}
    </div>
  );
}

function updateReference<T extends { title: string }>(
  references: T[],
  index: number,
  patch: Partial<T>,
) {
  return references.map((reference, itemIndex) =>
    itemIndex === index ? { ...reference, ...patch } : reference,
  );
}

function ParagraphList({
  values,
  onChange,
  max,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  max: number;
}) {
  return (
    <div className="space-y-3">
      {values.map((value, index) => (
        <div key={index} className="relative">
          <Textarea
            value={value}
            rows={5}
            onChange={(event) =>
              onChange(
                values.map((item, itemIndex) =>
                  itemIndex === index ? event.target.value : item,
                ),
              )
            }
            className="pr-10"
            placeholder="Tulis paragraf…"
          />
          {values.length > 1 ? (
            <button
              type="button"
              onClick={() =>
                onChange(values.filter((_, itemIndex) => itemIndex !== index))
              }
              className="absolute right-2.5 top-2.5 rounded-md p-1.5 text-fg-muted transition hover:bg-red-500/10 hover:text-red-600"
              aria-label="Hapus paragraf"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      ))}
      {values.length < max ? (
        <AddButton
          label="Tambah paragraf"
          onClick={() => onChange([...values, ""])}
        />
      ) : null}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-card px-3 py-2 text-[11px] font-semibold text-fg-muted transition hover:border-fg-muted hover:text-fg"
    >
      <Plus className="size-3.5" />
      {label}
    </button>
  );
}

const PART_BRIEF_MIN = 20;
const PART_BRIEF_MAX = 12000;

function PartBrief({
  label,
  hint,
  value,
  onChange,
  onGenerate,
  busy,
  error,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  busy: boolean;
  error: string | null;
}) {
  const length = value.trim().length;
  const tooShort = length < PART_BRIEF_MIN;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-fg">{label}</p>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-fg-muted">
            {hint}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onGenerate}
          disabled={busy || tooShort}
        >
          {busy ? <Spinner /> : <Sparkles className="size-3.5" />}
          {busy ? "Mengisi…" : "Isi dengan AI"}
        </Button>
      </div>

      <Textarea
        value={value}
        rows={6}
        maxLength={PART_BRIEF_MAX}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tempel materi atau tulis brief bagian ini…"
        className="mt-3"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="text-fg-muted">
          {tooShort
            ? `Minimal ${PART_BRIEF_MIN} karakter (${PART_BRIEF_MIN - length} lagi).`
            : "Materi dianggap sudah jadi; AI hanya merapikan ke kolom di bawah."}
        </span>
        <span className="tabular-nums text-fg-muted">
          {length.toLocaleString("id-ID")}/{PART_BRIEF_MAX.toLocaleString("id-ID")}
        </span>
      </div>

      {error ? (
        <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-[11px] font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ChapterEditor({
  chapter,
  canDelete,
  onRequestDelete,
  onChange,
  onGenerate,
  generating,
  briefError,
}: {
  chapter: EbookChapter;
  canDelete: boolean;
  onRequestDelete: () => void;
  onChange: (chapter: EbookChapter) => void;
  onGenerate: () => void;
  generating: boolean;
  briefError: string | null;
}) {
  return (
    <div className="space-y-5">
      <PartBrief
        label="Brief bab ini"
        value={chapter.brief ?? ""}
        onChange={(brief) => onChange({ ...chapter, brief })}
        onGenerate={onGenerate}
        busy={generating}
        error={briefError}
        hint="Tempel materi atau brief bab di sini. AI akan mengisi judul, isi bab, dan referensi bab dari brief ini."
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Field label="Judul bab">
            <Input
              value={chapter.title}
              onChange={(event) =>
                onChange({ ...chapter, title: event.target.value })
              }
            />
          </Field>
        </div>
        {canDelete ? (
          <button
            type="button"
            onClick={onRequestDelete}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
          >
            <Trash2 className="size-3.5" />
            Hapus bab
          </button>
        ) : null}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
          Isi bab
        </p>
        <p className="mt-1 text-[11px] text-fg-muted">
          Tulis beberapa paragraf, pakai sub-judul, daftar, atau tabel bila
          perlu, dan sisipkan gambar untuk memperjelas pembahasan.
        </p>
        <div className="mt-2">
          <RichTextEditor
            value={richTextFromChapter(chapter)}
            onChange={(body) => onChange({ ...chapter, body })}
            placeholder="Tulis isi bab…"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
            Referensi bab (opsional)
          </p>
          {chapter.references?.length ? (
            <button
              type="button"
              onClick={() => onChange({ ...chapter, references: undefined })}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 transition hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="size-3" />
              Hapus semua
            </button>
          ) : null}
        </div>

        <div className="mt-3 space-y-3">
          {(chapter.references ?? []).map((reference, referenceIndex) => (
            <div
              key={referenceIndex}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                  Referensi {referenceIndex + 1}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...chapter,
                      references: (chapter.references ?? []).filter(
                        (_unused, itemIndex) => itemIndex !== referenceIndex,
                      ),
                    })
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 transition hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 className="size-3" />
                  Hapus
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Sitasi">
                  <Input
                    value={reference.title}
                    onChange={(event) =>
                      onChange({
                        ...chapter,
                        references: updateReference(
                          chapter.references ?? [],
                          referenceIndex,
                          { title: event.target.value },
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="URL (opsional)">
                  <Input
                    value={reference.url ?? ""}
                    onChange={(event) =>
                      onChange({
                        ...chapter,
                        references: updateReference(
                          chapter.references ?? [],
                          referenceIndex,
                          { url: event.target.value },
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
          {(chapter.references?.length ?? 0) < 20 ? (
            <AddButton
              label="Tambah referensi bab"
              onClick={() =>
                onChange({
                  ...chapter,
                  references: [
                    ...(chapter.references ?? []),
                    { title: "", url: "" },
                  ],
                })
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

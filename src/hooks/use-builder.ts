"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { EbookChapter, EbookContent, EbookReference } from "@/lib/ebook/types";
import type { ProductMetadata } from "@/lib/ebook/groq";
import type { LearningLevel, Product } from "@/lib/types";

export type EbookStatus = "draft" | "final";

export interface EbookProject {
  id: string;
  title: string;
  prompt: string;
  content: EbookContent;
  status: EbookStatus | string;
  productId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateEbookInput {
  prompt: string;
  brand: string;
  niche: string;
  title?: string;
}

export interface UploadedBuilderImage {
  provider: "CLOUDINARY";
  storageKey: string;
  url: string;
  format: string;
  bytes: number;
  checksum: string;
}

export interface PublishEbookInput {
  nicheId: string;
  name?: string;
  slug?: string;
  summary?: string | null;
  description?: string | null;
  audience?: string | null;
  notFor?: string | null;
  outcome?: string | null;
  learnings?: string[];
  limitations?: string | null;
  license?: string | null;
  sampleUrl?: string | null;
  priceAmount: number;
  compareAtAmount?: number | null;
  level?: LearningLevel;
  features?: string[];
  active?: boolean;
}

export const builderKeys = {
  all: ["admin", "builder"] as const,
  detail: (id: string) => ["admin", "builder", id] as const,
};

export function useEbookProjects() {
  return useQuery({
    queryKey: builderKeys.all,
    queryFn: async () => {
      const response = await api.get<{ data: EbookProject[] }>("/admin/builder");
      return response.data.data;
    },
  });
}

export function useEbookProject(id: string) {
  return useQuery({
    queryKey: builderKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<{ data: EbookProject }>(
        `/admin/builder/${id}`,
      );
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

export function useGenerateEbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GenerateEbookInput) => {
      const response = await api.post<{ data: { id: string } }>(
        "/admin/builder",
        input,
      );
      return response.data.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: builderKeys.all }),
  });
}

type GeneratePartBase = {
  brand: string;
  niche: string;
  bookTitle: string;
  brief: string;
};

export async function generateEbookChapterPart(
  input: GeneratePartBase & {
    chapterTitle?: string;
    index: number;
    total: number;
  },
): Promise<EbookChapter> {
  const response = await api.post<{ data: EbookChapter }>(
    "/admin/builder/generate",
    { kind: "chapter", ...input },
  );
  return response.data.data;
}

export async function generateEbookSectionPart(
  input: GeneratePartBase & {
    section: "introduction" | "conclusion" | "about";
  },
): Promise<{ paragraphs: string[] }> {
  const response = await api.post<{ data: { paragraphs: string[] } }>(
    "/admin/builder/generate",
    { kind: "section", ...input },
  );
  return response.data.data;
}

export async function generateEbookReferencesPart(
  input: GeneratePartBase,
): Promise<{ references: EbookReference[] }> {
  const response = await api.post<{ data: { references: EbookReference[] } }>(
    "/admin/builder/generate",
    { kind: "references", ...input },
  );
  return response.data.data;
}

export async function generateEbookMetadataPart(input: {
  brand: string;
  niche: string;
  brief: string;
  currentTitle?: string;
}): Promise<{ title: string; description: string }> {
  const response = await api.post<{
    data: { title: string; description: string };
  }>("/admin/builder/generate", { kind: "metadata", ...input });
  return response.data.data;
}

export function useCreateEbookContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { content: EbookContent }) => {
      const response = await api.post<{
        data: { id: string; updatedAt: string };
      }>("/admin/builder", input);
      return response.data.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: builderKeys.all }),
  });
}

export function useUpdateEbookProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: {
        title?: string;
        status?: EbookStatus;
        content?: EbookContent;
      };
    }) => {
      const response = await api.patch<{ data: EbookProject }>(
        `/admin/builder/${id}`,
        input,
      );
      return response.data.data;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: builderKeys.all });
      queryClient.invalidateQueries({ queryKey: builderKeys.detail(project.id) });
    },
  });
}

export function useUploadBuilderImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post<{ data: UploadedBuilderImage }>(
        "/admin/builder/images",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data.data;
    },
  });
}

export function useDeleteEbookProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/builder/${id}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: builderKeys.all }),
  });
}

export function useGenerateProductMetadata() {
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: {
        brand?: string;
        niche?: string;
        bookTitle?: string;
        description?: string;
        chapters?: { title: string }[];
      };
    }) => {
      const response = await api.post<{ data: ProductMetadata }>(
        `/admin/builder/${id}/product-metadata`,
        input,
      );
      return response.data.data;
    },
  });
}

export function usePublishEbookProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: PublishEbookInput;
    }) => {
      const response = await api.post<{ data: Product }>(
        `/admin/builder/${id}/publish`,
        input,
      );
      return response.data.data;
    },
    onSuccess: (_product, variables) => {
      queryClient.invalidateQueries({ queryKey: builderKeys.all });
      queryClient.invalidateQueries({
        queryKey: builderKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

async function fetchBlob(url: string) {
  const response = await api.get<Blob>(url, { responseType: "blob" });
  return response.data;
}

export function fetchEbookDocx(id: string) {
  return fetchBlob(`/admin/builder/${id}/docx?download=1`);
}

export function fetchEbookPdf(id: string) {
  return fetchBlob(`/admin/builder/${id}/pdf`);
}

function slugifyFilename(value: string, fallback: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || fallback
  );
}

export async function downloadEbookDocx(id: string, title: string) {
  const blob = await fetchEbookDocx(id);
  triggerDownload(blob, `${slugifyFilename(title, "ebook")}.docx`);
}

export async function downloadEbookPdf(id: string, title: string) {
  const blob = await fetchEbookPdf(id);
  triggerDownload(blob, `${slugifyFilename(title, "ebook")}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

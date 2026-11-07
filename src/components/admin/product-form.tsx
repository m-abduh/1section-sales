"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Niche, Product } from "@/lib/types";
import { LEARNING_LEVELS, type LearningLevel } from "@/lib/types";
import {
  useUploadPdf,
  useUploadThumbnail,
  type ProductFileInput,
  type ProductInput,
} from "@/hooks/use-admin-products";
import { getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const schema = z.object({
  nicheId: z.string().min(1, "Select a niche"),
  name: z.string().min(2, "Name is too short").max(160),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and hyphens only")
    .optional(),
  summary: z.string().max(300).optional(),
  description: z.string().max(20000).optional(),
  audience: z.string().max(1000).optional(),
  notFor: z.string().max(1000).optional(),
  outcome: z.string().max(1000).optional(),
  learnings: z.string().max(5000).optional(),
  limitations: z.string().max(2000).optional(),
  license: z.string().max(2000).optional(),
  sampleUrl: z.string().max(500).optional(),
  level: z.enum(["FOUNDATIONS", "PRACTICAL", "ADVANCED"]),
  coverImage: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  compareAt: z.coerce.number().min(0).optional(),
  features: z.string().optional(),
  sortOrder: z.coerce.number().int(),
  active: z.boolean(),
});

export type FormValues = z.infer<typeof schema>;

const LEVEL_LABELS: Record<LearningLevel, string> = {
  FOUNDATIONS: "Foundations",
  PRACTICAL: "Practical",
  ADVANCED: "Advanced",
};

function parseLines(value?: string): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

export const ProductForm = forwardRef<{
  setValue: (name: keyof FormValues, value: FormValues[keyof FormValues], options?: any) => void;
}, {
  product?: Product | null;
  niches: Niche[];
  onSubmit: (input: ProductInput) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  projectId?: string;
  initialValues?: Partial<FormValues>;
}>(({ product, niches, onSubmit, onCancel, isSubmitting, projectId, initialValues }, ref) => {
  const uploadPdf = useUploadPdf();
  const uploadThumbnail = useUploadThumbnail();
  const [files, setFiles] = useState<ProductFileInput[]>(
    product?.files.map((file) => ({
      name: file.name,
      provider: file.provider,
      storageKey: file.storageKey,
      resourceType: file.resourceType,
      format: file.format,
      bytes: file.bytes,
      checksum: file.checksum,
      fileUrl: file.fileUrl,
      assetFileId: file.assetFileId ?? null,
    })) ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const defaults: FormValues = product
    ? {
        nicheId: product.nicheId,
        name: product.name,
        slug: product.slug,
        summary: product.summary ?? "",
        description: product.description ?? "",
        audience: product.audience ?? "",
        notFor: product.notFor ?? "",
        outcome: product.outcome ?? "",
        learnings: (product.learnings ?? []).join("\n"),
        limitations: product.limitations ?? "",
        license: product.license ?? "",
        sampleUrl: product.sampleUrl ?? "",
        level: product.level,
        coverImage: product.coverImage ?? "",
        price: product.priceAmount / 100,
        compareAt: product.compareAtAmount ? product.compareAtAmount / 100 : undefined,
        features: (product.features ?? []).join("\n"),
        sortOrder: product.sortOrder,
        active: product.active,
      }
    : {
        nicheId: niches[0]?.id ?? "",
        name: "",
        slug: "",
        summary: "",
        description: "",
        audience: "",
        notFor: "",
        outcome: "",
        learnings: "",
        limitations: "",
        license: "",
        sampleUrl: "",
        level: "FOUNDATIONS",
        coverImage: "",
        price: 0,
        compareAt: undefined,
        features: "",
        sortOrder: 0,
        active: true,
        ...initialValues,
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const coverImage = watch("coverImage");

  useImperativeHandle(ref, () => ({
    setValue: (name: keyof FormValues, value: unknown, options?: any) => {
      setValue(name, value as any, options);
    },
  }));

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const result = await uploadPdf.mutateAsync(file);
        setFiles((previous) => [
          ...previous,
          {
            name: result.name || stripExtension(file.name),
            provider: result.provider,
            storageKey: result.storageKey,
            resourceType: result.resourceType,
            format: result.format,
            bytes: result.bytes,
            checksum: result.checksum,
            assetFileId: result.assetFileId ?? null,
          },
        ]);
      }
    } catch (error) {
      setUploadError(getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleCoverImage = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setCoverError(null);
    setCoverUploading(true);
    try {
      const result = await uploadThumbnail.mutateAsync(file);
      setValue("coverImage", result.url, { shouldValidate: true });
    } catch (error) {
      setCoverError(getApiErrorMessage(error));
    } finally {
      setCoverUploading(false);
    }
  };

  const updateFileName = (index: number, name: string) => {
    setFiles((previous) =>
      previous.map((file, i) => (i === index ? { ...file, name } : file)),
    );
  };

  const removeFile = (index: number) => {
    setFiles((previous) => previous.filter((_, i) => i !== index));
  };

  const submit = handleSubmit((values) => {
    onSubmit({
      nicheId: values.nicheId,
      name: values.name,
      slug: values.slug || undefined,
      summary: values.summary || null,
      description: values.description || null,
      audience: values.audience || null,
      notFor: values.notFor || null,
      outcome: values.outcome || null,
      learnings: parseLines(values.learnings),
      limitations: values.limitations || null,
      license: values.license || null,
      sampleUrl: values.sampleUrl || null,
      level: values.level,
      coverImage: values.coverImage || null,
      priceAmount: Math.round(values.price * 100),
      compareAtAmount:
        values.compareAt != null && values.compareAt > 0
          ? Math.round(values.compareAt * 100)
          : null,
      currency: "USD",
      features: parseLines(values.features),
      files,
      active: values.active,
      sortOrder: values.sortOrder,
    });
  });

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Niche" error={errors.nicheId?.message}>
          <select
            className="w-full rounded-lg border-0 bg-card px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-accent"
            {...register("nicheId")}
          >
            {niches.map((niche) => (
              <option key={niche.id} value={niche.id}>
                {niche.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Name" error={errors.name?.message}>
          <Input placeholder="Personal Finance Starter Guide" {...register("name")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug" hint="Leave blank to auto-generate" error={errors.slug?.message}>
          <Input placeholder="personal-finance-guide" {...register("slug")} />
        </Field>
        <div className="rounded-lg bg-surface-muted p-3 text-xs text-fg ring-1 ring-border">
          The Paddle product and price are created automatically on save. Paddle
          IDs (`prod_...` / `pri_...`) are stored in the database for you.
        </div>
      </div>

      <Field label="Summary" hint="Short selling point (max 300 chars)" error={errors.summary?.message}>
        <Input placeholder="A practical method to..." {...register("summary")} />
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <Textarea rows={4} {...register("description")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Level" error={errors.level?.message}>
          <select
            className="w-full rounded-lg border-0 bg-card px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-accent"
            {...register("level")}
          >
            {LEARNING_LEVELS.map((level) => (
              <option key={level} value={level}>
                {LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Outcome" hint="What the buyer walks away with" error={errors.outcome?.message}>
          <Input placeholder="Leave with a working budgeting method" {...register("outcome")} />
        </Field>
      </div>

      <Field label="Audience" hint="Who this is for" error={errors.audience?.message}>
        <Input placeholder="Freelancers with irregular income" {...register("audience")} />
      </Field>

      <Field label="Not for" hint="Who should not buy this" error={errors.notFor?.message}>
        <Input placeholder="People looking for investment advice" {...register("notFor")} />
      </Field>

      <Field label="What you will learn" hint="One item per line" error={errors.learnings?.message}>
        <Textarea rows={4} {...register("learnings")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Limitations" error={errors.limitations?.message}>
          <Textarea rows={3} placeholder="Educational material only. Not personalized advice." {...register("limitations")} />
        </Field>
        <Field label="License" error={errors.license?.message}>
          <Textarea rows={3} placeholder="Personal use. Do not redistribute." {...register("license")} />
        </Field>
      </div>

      <Field label="Free sample URL" hint="Optional link to a preview" error={errors.sampleUrl?.message}>
        <Input placeholder="https://..." {...register("sampleUrl")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (USD)" error={errors.price?.message}>
          <Input type="number" step="0.01" min="0" {...register("price")} />
        </Field>
        <Field label="Compare-at (USD)" error={errors.compareAt?.message}>
          <Input type="number" step="0.01" min="0" {...register("compareAt")} />
        </Field>
        <Field label="Sort order" error={errors.sortOrder?.message}>
          <Input type="number" {...register("sortOrder")} />
        </Field>
      </div>

      <Field label="Features" hint="One feature per line">
        <Textarea rows={4} {...register("features")} />
      </Field>

      {!projectId ? (
        <Field
          label="Cover image"
          hint="JPG, PNG or WebP up to 4 MB. Uploaded to Cloudinary."
          error={errors.coverImage?.message}
        >
        <div className="space-y-3">
          {coverImage ? (
            <div className="relative aspect-[16/10] w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface-muted">
              <Image
                src={coverImage}
                alt="Cover preview"
                fill
                unoptimized
                sizes="384px"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition hover:opacity-90">
              {coverImage ? "Replace image" : "Upload image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  void handleCoverImage(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>

            {coverImage ? (
              <button
                type="button"
                onClick={() => setValue("coverImage", "", { shouldValidate: true })}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:text-fg"
              >
                Remove
              </button>
            ) : null}

            {coverUploading ? (
              <span className="flex items-center gap-2 text-xs text-fg-muted">
                <Spinner /> Uploading...
              </span>
            ) : null}
          </div>

          {coverError ? (
            <p className="text-xs text-red-600 dark:text-red-400">{coverError}</p>
          ) : null}
        </div>
      </Field>
      ) : null}

      {!projectId ? (
        <div className="rounded-lg bg-surface-muted p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-fg">Files</p>
            <p className="mt-0.5 text-xs text-fg-muted">
              Upload one or more PDFs. Buyers receive all of them in a single
              purchase.
            </p>
          </div>
          <label className="cursor-pointer rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition hover:opacity-90">
            Add PDFs
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(event) => {
                void handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        {uploading ? (
          <span className="mt-3 flex items-center gap-2 text-xs text-fg-muted">
            <Spinner /> Uploading...
          </span>
        ) : null}
        {uploadError ? (
          <p className="mt-2 text-xs text-red-600">{uploadError}</p>
        ) : null}

        {files.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.storageKey ?? file.fileUrl ?? "file"}-${index}`}
                className="flex items-center gap-2 rounded-lg bg-card p-2 ring-1 ring-border"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded bg-red-50 text-[10px] font-bold text-red-600">
                  PDF
                </span>
                <Input
                  value={file.name}
                  onChange={(event) => updateFileName(index, event.target.value)}
                  placeholder="File name shown to buyers"
                  className="h-8 flex-1 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-fg-muted">No files yet.</p>
        )}
      </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-fg">
        <input type="checkbox" className="size-4" {...register("active")} />
        Active (visible on the landing page)
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? <Spinner /> : null}
          {product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
});

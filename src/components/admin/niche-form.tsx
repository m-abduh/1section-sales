"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Niche } from "@/lib/types";
import type { NicheInput } from "@/hooks/use-admin-niches";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const schema = z.object({
  name: z.string().min(2, "Name is too short").max(120),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and hyphens only")
    .optional(),
  tagline: z.string().max(240).optional(),
  description: z.string().max(5000).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color"),
  active: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  accentColor: "#6366F1",
  active: true,
  sortOrder: 0,
};

export function NicheForm({
  niche,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  niche?: Niche | null;
  onSubmit: (input: NicheInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const defaults: FormValues = niche
    ? {
        name: niche.name,
        slug: niche.slug,
        tagline: niche.tagline ?? "",
        description: niche.description ?? "",
        accentColor: niche.accentColor,
        active: niche.active,
        sortOrder: niche.sortOrder,
      }
    : emptyValues;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const submit = handleSubmit((values) => {
    onSubmit({
      name: values.name,
      slug: values.slug || undefined,
      tagline: values.tagline || null,
      description: values.description || null,
      accentColor: values.accentColor,
      active: values.active,
      sortOrder: values.sortOrder,
    });
  });

  return (
    <form className="space-y-6" onSubmit={submit}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Identity
        </p>
        <div className="mt-3 space-y-4">
          <Field label="Name" error={errors.name?.message}>
            <Input placeholder="Finance" {...register("name")} />
          </Field>

          <Field
            label="Slug"
            hint="Used for subdomain e.g. finance.1section.com"
            error={errors.slug?.message}
          >
            <Input placeholder="finance" {...register("slug")} />
          </Field>

          <Field label="Tagline" error={errors.tagline?.message}>
            <Input placeholder="Short one-liner" {...register("tagline")} />
          </Field>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Content
        </p>
        <div className="mt-3 space-y-4">
          <Field label="Description" error={errors.description?.message}>
            <Textarea rows={4} placeholder="Explain what this niche is about" {...register("description")} />
          </Field>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Settings
        </p>
        <div className="mt-3 space-y-4">
          <Field label="Accent color" error={errors.accentColor?.message}>
            <Input type="color" className="h-9 w-20 p-1" {...register("accentColor")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort order" error={errors.sortOrder?.message}>
              <Input type="number" {...register("sortOrder")} />
            </Field>
            <label className="flex items-center gap-2 pt-6 text-sm text-fg">
              <input type="checkbox" className="size-4" {...register("active")} />
              Active
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : null}
          {niche ? "Save changes" : "Create niche"}
        </Button>
      </div>
    </form>
  );
}

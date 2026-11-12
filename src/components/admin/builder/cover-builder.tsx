"use client";

import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  ExternalLink,
  Eye,
  ImagePlus,
  Loader2,
  RefreshCw,
  Shuffle,
  Sparkles,
  Trash2,
} from "lucide-react";
import type {
  EbookContent,
  EbookCover,
} from "@/lib/ebook/types";
import {
  COVER_ACCENTS,
  COVER_TEMPLATES,
  DEFAULT_COVER,
  coverWithTemplate,
} from "@/lib/ebook/cover";
import { useUploadBuilderImage } from "@/hooks/use-builder";
import { getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import { Spinner } from "@/components/ui/spinner";
import {
  EbookCoverDesign,
  ScaledCover,
} from "@/components/admin/builder/ebook-cover";

const GRADIENT_DIRECTIONS = [
  { angle: 0, label: "Bawah ke atas", Icon: ArrowUp },
  { angle: 45, label: "Kiri bawah ke kanan atas", Icon: ArrowUpRight },
  { angle: 90, label: "Kiri ke kanan", Icon: ArrowRight },
  { angle: 135, label: "Kiri atas ke kanan bawah", Icon: ArrowDownRight },
  { angle: 180, label: "Atas ke bawah", Icon: ArrowDown },
  { angle: 225, label: "Kanan atas ke kiri bawah", Icon: ArrowDownLeft },
  { angle: 270, label: "Kanan ke kiri", Icon: ArrowLeft },
  { angle: 315, label: "Kanan bawah ke kiri atas", Icon: ArrowUpLeft },
] as const;

export function CoverBuilder({
  content,
  busy,
  stale,
  error,
  onChange,
  onRender,
}: {
  content: EbookContent;
  busy: boolean;
  stale: boolean;
  error: string | null;
  onChange: (cover: EbookCover | undefined) => void;
  onRender: () => void;
}) {
  const uploadImage = useUploadBuilderImage();
  const imageInput = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!content.cover) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Sparkles className="size-4 text-fg-muted" />
              Cover desain
            </p>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              Buat cover dari template, lalu hasilnya dipakai di PDF, DOCX, dan
              thumbnail produk. Tanpa cover desain, PDF memakai cover teks
              otomatis.
            </p>
          </div>
          <Button size="sm" onClick={() => onChange({ ...DEFAULT_COVER })}>
            Aktifkan cover desain
          </Button>
        </div>
      </div>
    );
  }

  const cover = content.cover;
  const background = cover.background;

  async function handleBackgroundFile(file: File) {
    setUploadError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Gunakan gambar JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setUploadError("Ukuran gambar maksimal 4 MB.");
      return;
    }
    try {
      const uploaded = await uploadImage.mutateAsync(file);
      onChange({
        ...cover,
        background: { type: "image", url: uploaded.url },
      });
    } catch (caught) {
      setUploadError(getApiErrorMessage(caught));
    }
  }

  function pickImage() {
    if (background.type === "image") return;
    imageInput.current?.click();
  }

  function selectBackground(type: "gradient" | "image") {
    if (type === "image") {
      pickImage();
      return;
    }
    if (background.type === "gradient") return;
    onChange({
      ...cover,
      background:
        background.type === "solid"
          ? {
              type: "gradient",
              from: background.color,
              to: background.color,
              angle: 135,
            }
          : { type: "gradient", from: "#0B1220", to: "#1D4ED8", angle: 135 },
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface-muted/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Sparkles className="size-4 text-fg-muted" />
            Cover desain
          </p>
          <p className="mt-0.5 text-[11px] text-fg-muted">
            Template reusable. Gambar final dirender saat menyimpan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ring-inset ${
              busy
                ? "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-400"
                : stale
                  ? "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400"
            }`}
          >
            {busy ? "Memperbarui…" : stale ? "Perlu diperbarui" : "Sudah diperbarui"}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={onRender}
            disabled={busy}
          >
            {busy ? <Spinner /> : <RefreshCw className="size-3.5" />}
            Simpan &amp; perbarui
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(undefined)}
            disabled={busy}
          >
            <Trash2 className="size-3.5" />
            Hapus
          </Button>
        </div>
      </div>

      {error || uploadError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] leading-relaxed text-red-700 dark:text-red-400">
          {error ?? uploadError}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="group relative block w-full overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
            aria-label="Lihat preview cover ukuran penuh"
          >
            <ScaledCover>
              <EbookCoverDesign content={content} cover={cover} />
            </ScaledCover>
            <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100 group-focus-visible:bg-black/35 group-focus-visible:opacity-100">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold text-white">
                <Eye className="size-3.5" />
                Lihat preview
              </span>
            </span>
          </button>
          <p className="text-[11px] leading-relaxed text-fg-muted">
            Preview A5. Hasil akhir 1748×2480 px (300 dpi) dibuat di browser
            saat menyimpan.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
              Template
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {COVER_TEMPLATES.map((template) => {
                const active = cover.template === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    aria-label={`Template ${template.label}`}
                    aria-pressed={active}
                    title={template.hint}
                    onClick={() =>
                      onChange(coverWithTemplate(cover, template.id))
                    }
                    className={`overflow-hidden rounded-lg border bg-card text-left transition ${
                      active
                        ? "border-fg ring-1 ring-fg"
                        : "border-border hover:border-fg-muted"
                    }`}
                  >
                    <div aria-hidden>
                      <ScaledCover>
                        <EbookCoverDesign
                          content={content}
                          cover={active ? cover : coverWithTemplate(cover, template.id)}
                        />
                      </ScaledCover>
                    </div>
                    <span className="block px-1.5 py-1 text-[10px] font-semibold text-fg">
                      {template.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
              Warna aksen
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {COVER_ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Aksen ${color}`}
                  aria-pressed={cover.accent.toLowerCase() === color.toLowerCase()}
                  onClick={() => onChange({ ...cover, accent: color })}
                  className={`size-7 rounded-full ring-2 ring-offset-2 ring-offset-card transition ${
                    cover.accent.toLowerCase() === color.toLowerCase()
                      ? "ring-fg"
                      : "ring-transparent hover:ring-border"
                  }`}
                  style={{ background: color }}
                />
              ))}
              <label className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-[10px] font-semibold text-fg-muted">
                <input
                  type="color"
                  value={cover.accent}
                  onChange={(event) =>
                    onChange({ ...cover, accent: event.target.value })
                  }
                  className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                {cover.accent}
              </label>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
              Latar cover
            </p>
            <div className="mt-2 inline-flex rounded-lg border border-border bg-card p-0.5">
              {(
                [
                  { id: "gradient", label: "Gradasi" },
                  { id: "image", label: "Gambar" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={background.type === mode.id}
                  onClick={() => selectBackground(mode.id)}
                  className={`rounded-md px-3 py-1 text-[11px] font-semibold transition ${
                    background.type === mode.id
                      ? "bg-fg text-surface"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="mt-3">
              {background.type === "gradient" ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ColorControl
                      label="Dari"
                      value={background.from}
                      onChange={(from) =>
                        onChange({
                          ...cover,
                          background: { ...background, from },
                        })
                      }
                    />
                    <ColorControl
                      label="Ke"
                      value={background.to}
                      onChange={(to) =>
                        onChange({
                          ...cover,
                          background: { ...background, to },
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                      Arah
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {GRADIENT_DIRECTIONS.map(({ angle, label, Icon }) => {
                        const current =
                          (((background.angle ?? 135) % 360) + 360) % 360;
                        const active = current === angle;
                        return (
                          <button
                            key={angle}
                            type="button"
                            title={label}
                            aria-label={`Arah gradasi: ${label}`}
                            aria-pressed={active}
                            onClick={() =>
                              onChange({
                                ...cover,
                                background: { ...background, angle },
                              })
                            }
                            className={`grid size-7 place-items-center rounded-md border transition ${
                              active
                                ? "border-fg bg-fg text-surface"
                                : "border-border bg-card text-fg-muted hover:border-fg-muted hover:text-fg"
                            }`}
                          >
                            <Icon className="size-3.5" />
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        onChange({
                          ...cover,
                          background: { ...background, ...randomGradient() },
                        })
                      }
                    >
                      <Shuffle className="size-3.5" />
                      Acak warna
                    </Button>
                  </div>
                </div>
              ) : null}

              {background.type === "image" ? (
                <div className="space-y-3">
                  <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface">
                              <img
                      src={background.url}
                      alt="Latar cover"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={pickImage}
                      disabled={uploadImage.isPending}
                    >
                      {uploadImage.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="size-3.5" />
                      )}
                      Ganti gambar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        onChange({
                          ...cover,
                          background: {
                            type: "gradient",
                            from: "#111827",
                            to: "#334155",
                            angle: 160,
                          },
                        })
                      }
                    >
                      <Trash2 className="size-3.5" />
                      Hapus gambar
                    </Button>
                  </div>
                </div>
              ) : null}

              {background.type !== "image" ? (
                <p className="mt-2 text-[11px] text-fg-muted">
                  Ingin pakai foto? Klik tab Gambar untuk mengunggah background
                  (JPG/PNG/WebP, maks 4 MB).
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Toggle
              label="Tampilkan deskripsi"
              checked={cover.showDescription}
              onChange={(showDescription) =>
                onChange({ ...cover, showDescription })
              }
            />
          </div>
        </div>
      </div>

      <input
        ref={imageInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleBackgroundFile(file);
        }}
      />

      <Modal
        open={previewOpen}
        title="Preview cover"
        onClose={() => setPreviewOpen(false)}
        wide
      >
        <div className="mx-auto max-w-sm space-y-4">
          <div className="overflow-hidden rounded-xl border border-border shadow-sm">
            <ScaledCover>
              <EbookCoverDesign content={content} cover={cover} />
            </ScaledCover>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-muted">
            <span>
              A5 · 1748×2480 px saat dirender ·{" "}
              {stale ? "perlu diperbarui" : "sudah diperbarui"}
            </span>
            {cover.renderedUrl ? (
              <a
                href={cover.renderedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-fg hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Buka gambar hasil render
              </a>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
      />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
        {label}
      </span>
      <span className="ml-auto font-mono text-[10px] text-fg-muted">{value}</span>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-fg">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-3.5 rounded border-border"
      />
      {label}
    </label>
  );
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const h = ((hue % 360) + 360) % 360;
  const s = saturation / 100;
  const l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

/** Random two-tone gradient in a related hue family, with a random direction. */
function randomGradient() {
  const hue = randomBetween(0, 360);
  const spread = randomBetween(25, 90);
  const direction =
    GRADIENT_DIRECTIONS[Math.floor(Math.random() * GRADIENT_DIRECTIONS.length)];
  return {
    from: hslToHex(
      hue,
      randomBetween(55, 78),
      randomBetween(18, 32),
    ),
    to: hslToHex(
      hue + spread,
      randomBetween(55, 82),
      randomBetween(38, 58),
    ),
    angle: direction.angle,
  };
}

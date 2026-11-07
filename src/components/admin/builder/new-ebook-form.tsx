"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenText,
  Sparkles,
} from "lucide-react";
import { useGenerateEbook } from "@/hooks/use-builder";
import { getApiErrorMessage } from "@/lib/api";
import { richTextToPrompt } from "@/lib/ebook/rich-text";
import type { EbookRichTextNode } from "@/lib/ebook/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/admin/builder/rich-text-editor";
import { Spinner } from "@/components/ui/spinner";

const structure = [
  "Cover: brand, niche, judul, deskripsi",
  "Pendahuluan 2–4 paragraf",
  "Jumlah bab mengikuti outline brief (default 12)",
  "2–4 sub-bagian per bab",
  "Paragraf pembuka dan referensi bab (opsional)",
  "Kesimpulan 2 paragraf",
  "6 referensi dengan URL",
  "About dan disclaimer",
];

export function NewEbookForm({
  groqConfigured,
  groqModel,
}: {
  groqConfigured: boolean;
  groqModel: string;
}) {
  const router = useRouter();
  const generate = useGenerateEbook();
  const [brand, setBrand] = useState("1section");
  const [niche, setNiche] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState<EbookRichTextNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const prompt = richTextToPrompt(brief);

  const loading = generate.isPending ? "ai" : null;

  async function generateWithAi(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (prompt.trim().length < 20) {
      setError("Brief minimal 20 karakter agar AI punya konteks cukup.");
      return;
    }
    if (prompt.length > 10000) {
      setError("Brief maksimal 10.000 karakter.");
      return;
    }
    if (niche.trim().length < 2) {
      setError("Isi niche/kategori ebook dulu, misalnya “Keuangan pribadi”.");
      return;
    }

    try {
      const project = await generate.mutateAsync({
        brand,
        niche,
        title: title.trim() || undefined,
        prompt,
      });
      router.push(`/admin/builder/${project.id}`);
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    }
  }

  function openBlank() {
    setError(null);
    router.push("/admin/builder/blank");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
      <form
        onSubmit={generateWithAi}
        className="rounded-2xl border border-border bg-card p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand">
            <Input
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder="1section"
            />
          </Field>
          <Field label="Niche / kategori">
            <Input
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
              placeholder="Keuangan pribadi"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Judul (opsional)">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Biarkan kosong agar AI memilih judul"
            />
          </Field>
        </div>

        <div className="mt-4 space-y-1.5">
          <span className="block text-sm font-medium text-fg">
            Brief konten
          </span>
          <RichTextEditor
            value={brief}
            onChange={setBrief}
            allowImages={false}
            allowTables={false}
            placeholder="Contoh: Ebook panduan mengelola uang untuk pekerja muda Indonesia. Bahas mencatat pengeluaran, utang, dana darurat, investasi pemula, dan rencana jangka panjang. Gaya bahasa santai tapi serius, berisi langkah praktis."
          />
          <span className="block text-xs text-fg-muted">
            Semakin spesifik brief, semakin konsisten hasilnya. Pakai sub-judul
            dan daftar untuk menyusun outline bab.
          </span>
          <p className="text-right text-[11px] text-fg-muted">
            {prompt.length} / 10.000 karakter
          </p>
        </div>

        {!groqConfigured ? (
          <div className="mt-4 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              <code className="font-mono">GROQ_API_KEY</code> belum diisi. Kamu
              masih bisa mulai dari editor kosong untuk mencoba editor,
              preview, dan export.
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs leading-relaxed text-red-700 dark:text-red-400">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            disabled={loading !== null || !groqConfigured}
            className="flex-1"
          >
            {loading === "ai" ? <Spinner /> : <Sparkles className="size-4" />}
            {loading === "ai" ? "Menyusun ebook…" : "Generate dengan AI"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={openBlank}
            disabled={loading !== null}
          >
            <BookOpenText className="size-4" />
            Mulai kosong
          </Button>
        </div>

        <p className="mt-3 text-[11px] text-fg-muted">
          Mulai kosong membuka editor tanpa isi dan tanpa menyimpan apa pun.
          Draft baru dibuat saat kamu klik{" "}
          <span className="font-medium text-fg">Simpan</span>.
        </p>

        <p className="mt-3 text-[11px] text-fg-muted">
          Model: <span className="font-mono">{groqModel}</span>
        </p>
      </form>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface-muted/60 p-5">
          <h2 className="text-sm font-semibold text-fg">
            Struktur yang dihasilkan
          </h2>
          <ol className="mt-4 space-y-2.5 text-xs text-fg-muted">
            {structure.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-card text-[10px] font-bold text-fg ring-1 ring-border">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-fg">Tips brief yang bagus</h2>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-fg-muted">
            <li>• Sebutkan target pembaca dan level pengalamannya.</li>
            <li>• Tentukan nada: santai, formal, atau coaching.</li>
            <li>• Sebutkan topik yang wajib masuk dan yang dihindari.</li>
            <li>• Tambahkan hasil akhir yang diharapkan pembaca.</li>
          </ul>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-fg">
            <ArrowRight className="size-3.5" />
            Bisa diedit setelah generate
          </div>
        </div>
      </aside>
    </div>
  );
}

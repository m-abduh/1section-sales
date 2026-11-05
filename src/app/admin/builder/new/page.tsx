import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { groqConfig } from "@/lib/ebook/groq";
import { NewEbookForm } from "@/components/admin/builder/new-ebook-form";

export const dynamic = "force-dynamic";

export default function NewEbookPage() {
  const { configured, model } = groqConfig();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/builder"
        className="inline-flex items-center gap-2 text-xs font-medium text-fg-muted transition hover:text-fg"
      >
        <ArrowLeft className="size-3.5" />
        Product Builder
      </Link>

      <div>
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          <Sparkles className="size-4" />
          Ebook baru
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Ceritakan ebook yang kamu mau.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
          Groq akan menyusun konten ke dalam struktur baku 1section: cover,
          pendahuluan, bab sesuai outline brief, kesimpulan, referensi, dan
          about. Setelah itu kamu bisa mengeditnya halaman per halaman.
        </p>
      </div>

      <NewEbookForm groqConfigured={configured} groqModel={model} />
    </div>
  );
}

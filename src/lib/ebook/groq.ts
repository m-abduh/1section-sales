import { ebookSchema } from "./schema";
import type { EbookContent } from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

// The chat assistant already uses GROQ_MODEL, which may be a smaller model.
// Ebook generation benefits from the larger model, so allow an override.
function ebookModel() {
  return process.env.EBOOK_GROQ_MODEL?.trim() || DEFAULT_MODEL;
}
const MAX_ATTEMPTS = 3;

const SYSTEM_PROMPT = `Kamu adalah penulis dan editor ebook profesional untuk brand "1section".

Tugas: ubah brief dari pengguna menjadi ebook dengan struktur BAKU. Brief pengguna adalah sumber utama. Jika brief sudah memuat outline bab, jangan mengubah jumlah, urutan, atau judulnya.

STRUKTUR WAJIB:
- brand: "1section" (kecuali pengguna meminta brand lain)
- niche: kategori/topik singkat
- title: judul ebook yang menarik dan jelas
- description: 1 paragraf ringkas (2-3 kalimat) untuk cover
- introduction: 2-4 paragraf
- chapters:
  - Jika brief memuat outline bab bernomor: gunakan PERSIS jumlah, urutan, dan judul bab dari brief. Jangan memecah satu bab menjadi beberapa bab dan jangan menambah bab baru.
  - Jika brief tidak memuat outline bab: buat tepat 12 bab.
  - Setiap bab: 2-4 sub-bagian. Jika brief memberi sub-poin (A/B/C atau lainnya), jadikan setiap sub-poin sebagai sub-bagian dengan judul persis.
  - Setiap sub-bagian: 1-2 paragraf (utamakan 2 paragraf).
  - "intro": WAJIB diisi jika brief memuat paragraf pembuka sebelum sub-poin. Salin SEMUA paragraf tersebut ke "intro" dan jangan dipindahkan ke sub-bagian.
  - "references": opsional, daftar referensi riset khusus bab jika brief mencantumkannya.
- conclusion: 2 paragraf
- references: 6 referensi umum
- about: 2 paragraf

ATURAN MENGIKUTI BRIEF:
- Brief pengguna adalah sumber utama. Jangan meringkas, membuang, atau menulis ulang paragraf yang sudah diberikan.
- Pertahankan judul bab, judul sub-bagian, urutan, dan isi paragraf dari brief.
- Kamu boleh menambah satu paragraf penjelas di sub-bagian bila perlu, tetapi konten asli dari brief harus tetap ada.
- Jangan menggabungkan dua bab menjadi satu dan jangan memecah satu bab menjadi beberapa bab.

ATURAN BAHASA:
- Tulis isi paragraf dalam bahasa brief. Jika brief berbahasa Indonesia, tulis dalam Bahasa Indonesia.
- Pertahankan bahasa dan ejaan judul bab/sub-bagian persis seperti brief. Jangan menerjemahkan judul yang sudah diberikan.
- Untuk brief berbahasa Indonesia, sapa pembaca dengan "kamu".

ATURAN PENULISAN:
- Setiap paragraf 3-5 kalimat. Praktis, spesifik, dan tidak bertele-tele.
- Jangan menulis nomor urut di awal judul bab atau sub-bagian ("1.", "01.", "Bab 1:"). Nomor ditambahkan otomatis oleh sistem.
- Jangan mengarang data statistik atau kutipan. Jika memakai klaim, pastikan umum dan aman.
- "references" umum harus sumber nyata (lembaga resmi, pemerintah, organisasi kesehatan/keuangan), lengkap dengan URL yang valid.
- Referensi riset per bab: salin sitasi dari brief. Isi "url" hanya jika brief mencantumkan URL.
- Jangan memakai penanda sitasi seperti [1] di dalam paragraf.

FORMAT KELUARAN:
Balas HANYA JSON valid (tanpa markdown, tanpa penjelasan) dengan bentuk berikut:
{
  "brand": "1section",
  "niche": "contoh: Keuangan pribadi",
  "title": "Judul ebook",
  "description": "Ringkasan untuk cover.",
  "introduction": ["paragraf 1", "paragraf 2"],
  "chapters": [
    {
      "title": "Judul bab 1",
      "intro": ["paragraf pembuka bab (opsional)"],
      "sections": [
        { "title": "Judul sub-bagian", "paragraphs": ["paragraf 1", "paragraf 2"] }
      ],
      "references": [
        { "title": "Nama penulis. Judul riset (tahun).", "url": "https://contoh.org/riset" }
      ]
    }
  ],
  "conclusion": ["paragraf 1", "paragraf 2"],
  "references": [
    { "title": "Nama lembaga. Judul sumber.", "url": "https://contoh.org/sumber" }
  ],
  "about": ["paragraf 1", "paragraf 2"]
}

"intro" dan "references" per bab boleh dihilangkan jika tidak relevan. Jumlah item "chapters" harus sama dengan outline brief; jika brief tidak punya outline, tepat 12 bab.`;

export type GenerateInput = {
  prompt: string;
  brand: string;
  niche: string;
  title?: string;
};

export function groqConfig() {
  return {
    configured: Boolean(process.env.GROQ_API_KEY?.trim()),
    model: ebookModel(),
  };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI tidak mengembalikan JSON yang valid.");
  }
  return candidate.slice(start, end + 1);
}

const LEADING_NUMBER = /^(?:bab\s+)?\d{1,2}(?:\.\d{1,2})?\s*[.):\-–—]\s*/i;

function stripLeadingNumber(value: unknown) {
  return typeof value === "string" ? value.replace(LEADING_NUMBER, "").trim() : value;
}

/**
 * The layout adds chapter and section numbers itself. Models sometimes include
 * their own numbering anyway, which would render as "01. 1. Judul" in DOCX and
 * PDF, so remove it before validation.
 */
function stripGeneratedNumbering(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.chapters)) return value;

  record.chapters = record.chapters.map((chapter) => {
    if (!chapter || typeof chapter !== "object") return chapter;
    const entry = { ...(chapter as Record<string, unknown>) };
    entry.title = stripLeadingNumber(entry.title);
    if (Array.isArray(entry.sections)) {
      entry.sections = entry.sections.map((section) => {
        if (!section || typeof section !== "object") return section;
        return {
          ...(section as Record<string, unknown>),
          title: stripLeadingNumber(
            (section as Record<string, unknown>).title,
          ),
        };
      });
    }
    return entry;
  });

  return value;
}

type PromptOutline = {
  count: number;
  items: string[];
};

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Reads an explicit chapter outline from the brief. Only top-level numbered
 * lines count, and the prompt must look like an outline (a matching count in
 * the first line or an outline keyword) so ordinary numbered requirements are
 * not mistaken for chapters.
 */
function extractPromptOutline(prompt: string): PromptOutline | null {
  const lines = prompt.split(/\r?\n/);
  const byNumber = new Map<number, string>();

  for (const line of lines) {
    const cleaned = line
      .replace(/^\s*#{1,6}\s*/, "")
      .replace(/\*\*/g, "")
      .trim();
    const match =
      cleaned.match(/^(\d{1,2})[.)]\s+(.+?)\s*$/) ??
      cleaned.match(/^(?:bab|chapter)\s+(\d{1,2})\s*[:.\-–—]\s*(.+?)\s*$/i);
    if (!match) continue;
    const number = Number(match[1]);
    const title = match[2].trim();
    if (number < 1 || title.length < 3 || title.length > 200) continue;
    if (!byNumber.has(number)) byNumber.set(number, title);
  }

  const numbers = [...byNumber.keys()].sort((a, b) => a - b);
  if (numbers.length < 2 || numbers.length > 30) return null;
  if (!numbers.every((number, index) => number === index + 1)) return null;

  const firstLine = lines.find((line) => line.trim())?.trim() ?? "";
  const headCount = Number(firstLine.match(/^(\d{1,2})\b/)?.[1] ?? 0);
  const hasOutlineKeyword =
    /\b(?:bab|chapter|tips|langkah|cara|strategi|kebiasaan|kesalahan|tanda|prinsip|aturan|step|steps)\b/i.test(
      prompt,
    );

  if (headCount !== numbers.length && !hasOutlineKeyword) return null;

  return {
    count: numbers.length,
    items: numbers.map((number) => byNumber.get(number) ?? ""),
  };
}

async function requestGroq(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function generateEbookWithGroq({
  prompt,
  brand,
  niche,
  title,
}: GenerateInput): Promise<EbookContent> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY belum diatur. Isi variabel tersebut di file .env lalu jalankan ulang server.",
    );
  }

  const model = ebookModel();
  const outline = extractPromptOutline(prompt);
  const expectedChapters = outline?.count ?? 12;
  const outlineInstruction = outline
    ? [
        "OUTLINE WAJIB DARI BRIEF (jangan diubah):",
        ...outline.items.map((item, index) => `${index + 1}. ${item}`),
        `Brief ini mendefinisikan tepat ${outline.count} bab. Kembalikan tepat ${outline.count} bab dengan judul yang sama, urutan yang sama, dan sub-poin yang diberikan sebagai sub-bagian. Jangan memecah atau menambah bab.`,
      ].join("\n")
    : "Brief tidak memuat outline bab. Gunakan tepat 12 bab.";

  const brief = [
    `Brief/topik dari pengguna:\n${prompt.trim()}`,
    outlineInstruction,
    `Brand: ${brand}`,
    `Niche/kategori: ${niche}`,
    title ? `Judul yang diinginkan: ${title}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const baseBody = {
    model,
    temperature: 0.5,
    max_tokens: 8000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: brief },
    ],
  };

  const retryMessage = (detail: string) =>
    `Respons sebelumnya gagal validasi: ${detail}\n\n` +
    `Ulangi dari awal dan hasilkan JSON lengkap. Array "chapters" harus berisi tepat ${expectedChapters} bab. ` +
    (outline
      ? `Gunakan judul dan urutan ini tanpa memecah bab: ${outline.items.join(" | ")}. `
      : "Gunakan 12 bab. ") +
    "Setiap bab memiliki 2-4 sub-bagian, dan setiap sub-bagian memiliki 1-2 paragraf. " +
    "Jangan menambahkan penjelasan apa pun di luar JSON.";

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const body =
      attempt === 1
        ? baseBody
        : {
            ...baseBody,
            messages: [
              ...baseBody.messages,
              { role: "user", content: retryMessage(lastError) },
            ],
          };

    let response = await requestGroq(apiKey, {
      ...body,
      response_format: { type: "json_object" },
    });

    if (!response.ok) {
      const firstError = await response.text();
      const jsonModeUnsupported =
        response.status === 400 &&
        /response_format|json_object|json mode/i.test(firstError);
      if (jsonModeUnsupported) {
        response = await requestGroq(apiKey, body);
      } else {
        throw new Error(
          `Groq menolak permintaan (${response.status}): ${firstError.slice(0, 400)}`,
        );
      }
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Groq menolak permintaan (${response.status}): ${error.slice(0, 400)}`,
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      lastError = "AI tidak mengembalikan konten.";
      continue;
    }

    let raw: unknown;
    try {
      raw = JSON.parse(extractJson(content));
    } catch (error) {
      lastError = `Gagal membaca JSON dari AI: ${
        error instanceof Error ? error.message : "format tidak dikenal"
      }`;
      continue;
    }

    const parsed = ebookSchema.safeParse(stripGeneratedNumbering(raw));
    if (parsed.success) {
      if (parsed.data.chapters.length !== expectedChapters) {
        lastError = `chapters: harus berisi tepat ${expectedChapters} bab sesuai brief, tetapi AI menghasilkan ${parsed.data.chapters.length} bab.`;
        continue;
      }

      if (outline) {
        const mismatched = outline.items
          .map((expected, index) => ({
            expected,
            actual: parsed.data.chapters[index]?.title ?? "",
          }))
          .filter(
            ({ expected, actual }) =>
              normalizeTitle(expected) !== normalizeTitle(actual),
          );

        if (mismatched.length > 0) {
          lastError = mismatched
            .slice(0, 3)
            .map(
              ({ expected, actual }) =>
                `judul bab "${actual}" harus tetap "${expected}"`,
            )
            .join("; ");
          continue;
        }
      }

      return parsed.data;
    }

    lastError = parsed.error.issues
      .slice(0, 4)
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
  }

  throw new Error(
    `Struktur ebook dari AI belum sesuai setelah ${MAX_ATTEMPTS} percobaan: ${lastError}`,
  );
}

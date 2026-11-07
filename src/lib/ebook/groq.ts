import { z } from "zod";
import { ebookChapterSchema, ebookReferenceSchema, ebookSchema } from "./schema";
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
  - "intro": WAJIB diisi jika brief memuat paragraf pembuka sebelum sub-poin. Masukkan SEMUA paragraf tersebut ke "intro" (dalam Bahasa Inggris) dan jangan dipindahkan ke sub-bagian.
  - "references": opsional, daftar referensi riset khusus bab jika brief mencantumkannya.
- conclusion: 2 paragraf
- references: 6 referensi umum
- about: 2 paragraf

ATURAN MENGIKUTI BRIEF:
- Brief pengguna adalah sumber utama. Jangan meringkas, membuang, atau menulis ulang paragraf yang sudah diberikan.
- Pertahankan urutan bab/sub-bagian dan maksud judul dari brief, lalu terjemahkan judulnya ke Bahasa Inggris natural bila brief berbahasa lain.
- Kamu boleh menambah satu paragraf penjelas di sub-bagian bila perlu, tetapi konten asli dari brief harus tetap ada.
- Jangan menggabungkan dua bab menjadi satu dan jangan memecah satu bab menjadi beberapa bab.

ATURAN BAHASA:
- SEMUA output wajib ditulis dalam Bahasa Inggris natural dan idiomatis (international English), meskipun brief/materi berbahasa Indonesia atau bahasa lain.
- Terjemahkan isi dengan setia: jangan menambah, mengurangi, atau mengubah makna.
- Terjemahkan juga judul ebook, judul bab, dan judul sub-bagian ke Bahasa Inggris yang natural. Urutan dan maksudnya tetap sama.
- Gunakan "you" untuk menyapa pembaca. Jangan mencampur Bahasa Indonesia ke dalam output.

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

function requireApiKey() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY belum diatur. Isi variabel tersebut di file .env lalu jalankan ulang server.",
    );
  }
  return apiKey;
}

/** Calls Groq in JSON mode and retries when the response fails validation. */
async function runGroqJson<S extends z.ZodTypeAny>(
  apiKey: string,
  {
    system,
    user,
    maxTokens,
    temperature = 0.4,
    schema,
  }: {
    system: string;
    user: string;
    maxTokens: number;
    temperature?: number;
    schema: S;
  },
): Promise<z.infer<S>> {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const body: Record<string, unknown> = {
      model: ebookModel(),
      temperature,
      max_tokens: maxTokens,
      messages:
        attempt === 1
          ? messages
          : [
              ...messages,
              {
                role: "user",
                content:
                  `Respons sebelumnya belum valid: ${lastError}\n\n` +
                  "Ulangi dan balas HANYA JSON valid tanpa penjelasan.",
              },
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
      lastError = `Gagal membaca JSON: ${
        error instanceof Error ? error.message : "format tidak dikenal"
      }`;
      continue;
    }

    const parsed = schema.safeParse(raw);
    if (parsed.success) {
      return parsed.data;
    }

    lastError = parsed.error.issues
      .slice(0, 4)
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
  }

  throw new Error(
    `Struktur JSON dari AI belum sesuai setelah ${MAX_ATTEMPTS} percobaan: ${lastError}`,
  );
}

const PART_CHAPTER_PROMPT = `Kamu editor ebook profesional untuk brand "1section".

Tugas: ubah BRIEF/MATERI yang diberikan menjadi isi SATU bab ebook yang rapi. Materi dianggap sudah jadi: tugasmu merapikan struktur, bukan menulis ulang dari nol.

ATURAN WAJIB:
- Tulis SEMUA output dalam Bahasa Inggris natural dan idiomatis (international English), meskipun brief/materi berbahasa Indonesia atau bahasa lain.
- Terjemahkan materi dengan setia. Jangan menambah, mengurangi, atau mengubah makna.
- Pertahankan isi, urutan gagasan, istilah teknis, dan nama resmi.
- Jangan meringkas, menghapus, atau menambah fakta/klaim baru.
- Jangan menambah kalimat, contoh, atau opini yang tidak ada di materi. Kamu hanya boleh memecah, mengurutkan ulang jika perlu, dan merapikan kalimat yang sudah ada.
- Kamu hanya boleh memecah materi menjadi 2-4 sub-bagian, memberi judul sub-bagian yang jelas, dan merapikan paragraf.
- Jika materi sudah punya judul/sub-judul, pertahankan maksudnya lalu terjemahkan ke Bahasa Inggris yang natural.
- Panjang paragraf mengikuti materi; jangan menggemukkan paragraf dengan kalimat baru.
- Jangan memakai format markdown seperti ** atau * di dalam paragraf.
- Jangan menulis nomor urut di awal judul.
- "intro" hanya diisi jika materi punya paragraf pembuka sebelum sub-bagian. Jika baris pertama materi adalah judul bab, jadikan itu "title", bukan "intro".
- "references" hanya diisi jika materi mencantumkan sumber; isi URL hanya jika ada.
- Gunakan "you" untuk menyapa pembaca. Jangan mencampur Bahasa Indonesia ke dalam output.

Balas HANYA JSON valid:
{
  "title": "Judul bab",
  "intro": ["paragraf pembuka (opsional)"],
  "sections": [
    { "title": "Judul sub-bagian", "paragraphs": ["paragraf 1", "paragraf 2"] }
  ],
  "references": [{ "title": "Sitasi", "url": "https://contoh.org/sumber" }]
}`;

const PART_SECTION_PROMPT = `Kamu editor ebook profesional untuk brand "1section".

Tugas: tulis SATU bagian ebook berdasarkan BRIEF/MATERI pengguna. Materi sudah jadi; pertahankan isinya dan jangan menambah fakta baru.

ATURAN:
- Untuk "introduction": tulis 2-4 paragraf pembuka yang memperkenalkan ebook, target pembaca, dan manfaatnya.
- Untuk "conclusion": tulis 2 paragraf rangkuman dan ajakan bertindak.
- Untuk "about": tulis 2 paragraf tentang brand dan disclaimer materi edukasi umum.
- Gunakan bahasa materi. Untuk Bahasa Indonesia, sapa pembaca dengan "kamu".
- Jangan memakai format markdown seperti ** atau * di dalam paragraf.
- Jangan menulis nomor urut atau judul bagian di dalam paragraf.

Balas HANYA JSON valid:
{ "paragraphs": ["paragraf 1", "paragraf 2"] }`;

const PART_REFERENCES_PROMPT = `Kamu editor ebook profesional untuk brand "1section".

Tugas: susun daftar referensi untuk ebook berdasarkan BRIEF/MATERI pengguna.

ATURAN:
- Gunakan sumber nyata dan relevan (lembaga resmi, pemerintah, organisasi, jurnal, atau buku).
- Jangan mengarang judul, penulis, atau URL.
- Jika materi sudah mencantumkan sumber, pertahankan sumber tersebut.
- Sertakan URL valid untuk setiap referensi.
- Beri 6 referensi jika tidak ada batasan lain.

Balas HANYA JSON valid:
{ "references": [{ "title": "Nama lembaga. Judul sumber.", "url": "https://contoh.org/sumber" }] }`;

const PART_METADATA_PROMPT = `Kamu editor ebook profesional untuk brand "1section".

Tugas: buat judul dan deskripsi cover berdasarkan BRIEF/MATERI pengguna.

ATURAN:
- "title": judul ebook yang jelas dan menarik.
- "description": 2-3 kalimat untuk cover.
- Pertahankan bahasa materi. Untuk Bahasa Indonesia, tulis dalam Bahasa Indonesia.
- Jangan menambah klaim yang tidak ada di brief.

Balas HANYA JSON valid:
{ "title": "Judul ebook", "description": "Ringkasan untuk cover." }`;

const sectionSchema = z.object({
  paragraphs: z.array(z.string().trim().min(1).max(4000)).min(1).max(8),
});

const referencesSchema = z.object({
  references: z.array(ebookReferenceSchema).min(1).max(20),
});

const metadataSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1200),
});

/** Removes stray markdown emphasis the model sometimes adds to plain paragraphs. */
function cleanText(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Drops model artifacts such as empty or punctuation-only paragraphs. */
function cleanParagraphs(values: string[]): string[] {
  const cleaned = values
    .map(cleanText)
    .filter((value) => /[A-Za-z\u00C0-\u024F]/.test(value) && value.length >= 8);
  const result = cleaned.length
    ? cleaned
    : values.map(cleanText).filter(Boolean);
  if (!result.length) {
    throw new Error(
      "AI mengembalikan paragraf kosong. Coba isi ulang brief lalu generate lagi.",
    );
  }
  return result;
}

type PartBase = {
  brand: string;
  niche: string;
  bookTitle?: string;
};

export type GenerateEbookPartInput =
  | (PartBase & {
      kind: "chapter";
      chapterTitle?: string;
      brief: string;
      index: number;
      total: number;
    })
  | (PartBase & {
      kind: "section";
      section: "introduction" | "conclusion" | "about";
      brief: string;
    })
  | (PartBase & { kind: "references"; brief: string })
  | (PartBase & { kind: "metadata"; brief: string; currentTitle?: string });

const SECTION_LABEL = {
  introduction: "Pendahuluan",
  conclusion: "Kesimpulan",
  about: "About",
} as const;

function partContext(input: PartBase) {
  return [
    `Judul ebook: ${input.bookTitle?.trim() || "(belum ditentukan)"}`,
    `Brand: ${input.brand}`,
    `Niche/kategori: ${input.niche}`,
  ].join("\n");
}

/**
 * Generates one editor part from its brief. The result is shaped to fill the
 * existing editor fields, so the user only needs to review and save.
 */
export async function generateEbookPart(input: GenerateEbookPartInput) {
  const apiKey = requireApiKey();

  if (input.kind === "chapter") {
    const user = [
      partContext(input),
      `Bagian ke-${input.index + 1} dari ${input.total}`,
      input.chapterTitle?.trim()
        ? `Judul bab saat ini: ${input.chapterTitle.trim()}`
        : "Buat judul bab yang ringkas dan jelas dari materi.",
      `BRIEF/MATERI BAGIAN:\n${input.brief}`,
    ].join("\n\n");

    const result = await runGroqJson(apiKey, {
      system: PART_CHAPTER_PROMPT,
      user,
      maxTokens: 5000,
      temperature: 0.2,
      schema: ebookChapterSchema,
    });

    const title = cleanText(result.title);
    const intro = result.intro?.length
      ? cleanParagraphs(result.intro).filter(
          (paragraph) => paragraph.toLowerCase() !== title.toLowerCase(),
        )
      : result.intro;

    return {
      ...result,
      title,
      intro,
      sections: result.sections.map((section) => ({
        title: cleanText(section.title),
        paragraphs: cleanParagraphs(section.paragraphs),
      })),
      references: result.references?.length
        ? result.references.map((reference) => ({
            ...reference,
            title: cleanText(reference.title),
          }))
        : result.references,
    };
  }

  if (input.kind === "section") {
    const user = [
      partContext(input),
      `Bagian yang harus ditulis: ${SECTION_LABEL[input.section]}`,
      `BRIEF/MATERI:\n${input.brief}`,
    ].join("\n\n");

    const result = await runGroqJson(apiKey, {
      system: PART_SECTION_PROMPT,
      user,
      maxTokens: 2500,
      temperature: 0.3,
      schema: sectionSchema,
    });

    return { paragraphs: cleanParagraphs(result.paragraphs) };
  }

  if (input.kind === "references") {
    const user = [
      partContext(input),
      `BRIEF/MATERI:\n${input.brief}`,
    ].join("\n\n");

    const result = await runGroqJson(apiKey, {
      system: PART_REFERENCES_PROMPT,
      user,
      maxTokens: 1800,
      temperature: 0.3,
      schema: referencesSchema,
    });

    return {
      references: result.references.map((reference) => ({
        ...reference,
        title: cleanText(reference.title),
        url: reference.url.replace(/[),.]+$/, ""),
      })),
    };
  }

  const user = [
    partContext(input),
    input.currentTitle?.trim()
      ? `Judul saat ini (boleh dipertahankan jika sudah cocok): ${input.currentTitle.trim()}`
      : "Judul belum ditentukan.",
    `BRIEF/MATERI:\n${input.brief}`,
  ].join("\n\n");

  const result = await runGroqJson(apiKey, {
    system: PART_METADATA_PROMPT,
    user,
    maxTokens: 1200,
    temperature: 0.4,
    schema: metadataSchema,
  });

  return {
    title: cleanText(result.title),
    description: cleanText(result.description),
  };
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

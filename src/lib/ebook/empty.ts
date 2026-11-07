import type { EbookContent } from "./types";

/**
 * Konten awal untuk mulai dari nol. Semua kolom dibiarkan kosong; editor
 * menampilkan satu bab kosong yang bisa langsung diisi. Draft baru disimpan
 * ke database setelah pengguna mengisi kolom wajib dan menekan Simpan.
 */
export function emptyEbook(): EbookContent {
  return {
    brand: "1section",
    niche: "",
    title: "",
    description: "",
    introduction: [""],
    chapters: [
      {
        title: "",
        sections: [],
      },
    ],
    conclusion: [""],
    references: [{ title: "", url: "" }],
    about: [""],
  };
}

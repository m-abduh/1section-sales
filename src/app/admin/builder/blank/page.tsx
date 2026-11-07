"use client";

import { EbookEditor } from "@/components/admin/builder/ebook-editor";
import { emptyEbook } from "@/lib/ebook/empty";

/**
 * Opens a blank editor without touching the database. A draft is only created
 * when the user fills the required fields and clicks Simpan.
 */
export default function BlankEbookPage() {
  return <EbookEditor initialContent={emptyEbook()} initialStatus="draft" />;
}

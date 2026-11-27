"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import {
  Bold,
  Columns3,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Rows3,
  Table as TableIcon,
  Trash2,
  Undo2,
} from "lucide-react";
import type { EbookRichTextNode } from "@/lib/ebook/types";
import { useUploadBuilderImage, generateEbookVisual } from "@/hooks/use-builder";
import { getApiErrorMessage } from "@/lib/api";
import { VisualBlock } from "./visual-block-node";
import { VisualBlockSvg } from "./visual-block";
import { sanitizeEbookSvg } from "@/lib/ebook/visual";
import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis isi bab…",
  allowImages = true,
  allowTables = true,
  visualContext,
}: {
  value: EbookRichTextNode[];
  onChange: (nodes: EbookRichTextNode[]) => void;
  placeholder?: string;
  allowImages?: boolean;
  allowTables?: boolean;
  visualContext?: { brand: string; niche: string; bookTitle: string; chapterTitle?: string };
}) {
  const uploadImage = useUploadBuilderImage();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visualOpen, setVisualOpen] = useState(false);
  const [visualBusy, setVisualBusy] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [visualSvg, setVisualSvg] = useState<string | null>(null);
  const [visualAlt, setVisualAlt] = useState<string>("");
  const [visualSelection, setVisualSelection] = useState<{ text: string; from: number } | null>(null);
  const onChangeRef = useRef(onChange);
  /** Blocks last emitted by the editor itself, used to detect external updates. */
  const lastEmittedRef = useRef<EbookRichTextNode[] | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
      }),
      Image.configure({ inline: false, allowBase64: false }),
      VisualBlock,
      ...(allowTables
        ? [
            Table.configure({ resizable: false }),
            TableRow,
            TableHeader,
            TableCell,
          ]
        : []),
      Placeholder.configure({ placeholder }),
    ],
    content: {
      type: "doc",
      content: value.length ? value : [{ type: "paragraph" }],
    },
    editorProps: {
      attributes: { class: "ebook-rte-content" },
    },
    onUpdate: ({ editor: instance }) => {
      const doc = instance.getJSON();
      const blocks = doc.content ?? [];
      lastEmittedRef.current = blocks;
      onChangeRef.current(blocks);
    },
  });

  // Apply external changes (for example AI generation) to the editor. Without
  // this, Tiptap keeps the content it was initialised with and the generated
  // text never appears in the rich text field.
  useEffect(() => {
    if (!editor) return;
    if (lastEmittedRef.current === value) return;
    const blocks = value.length ? value : [{ type: "paragraph" }];
    editor.commands.setContent(
      { type: "doc", content: blocks },
      { emitUpdate: false },
    );
    lastEmittedRef.current = value;
  }, [editor, value]);

  const editorState = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      bold: instance?.isActive("bold") ?? false,
      italic: instance?.isActive("italic") ?? false,
      heading2: instance?.isActive("heading", { level: 2 }) ?? false,
      heading3: instance?.isActive("heading", { level: 3 }) ?? false,
      bulletList: instance?.isActive("bulletList") ?? false,
      orderedList: instance?.isActive("orderedList") ?? false,
      blockquote: instance?.isActive("blockquote") ?? false,
      inTable: instance?.isActive("table") ?? false,
      canUndo: instance?.can().undo() ?? false,
      canRedo: instance?.can().redo() ?? false,
    }),
  });

  const state = editorState ?? {
    bold: false,
    italic: false,
    heading2: false,
    heading3: false,
      bulletList: false,
      orderedList: false,
      blockquote: false,
    inTable: false,
    canUndo: false,
    canRedo: false,
  };

  async function handleFile(file: File) {
    setError(null);
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Gunakan gambar JPG atau PNG.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Ukuran gambar maksimal 4 MB.");
      return;
    }
    try {
      const uploaded = await uploadImage.mutateAsync(file);
      editor
        ?.chain()
        .focus()
        .setImage({
          src: uploaded.url,
          alt: file.name.replace(/\.[^.]+$/, ""),
        })
        .run();
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    }
  }


  const openVisualize = async () => {
    if (!editor || !visualContext) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const text = editor.state.doc.textBetween(from, to, "\n").trim();
    if (text.length < 10) {
      setVisualError("Select a bit more text to turn into a visual.");
      setVisualSvg(null);
      setVisualAlt("");
      setVisualSelection({ text, from });
      setVisualOpen(true);
      return;
    }
    const selected = { text: text.slice(0, 4000), from };
    setVisualSelection(selected);
    setVisualOpen(true);
    setVisualSvg(null);
    setVisualAlt("");
    setVisualError(null);
    setVisualBusy(true);
    try {
      const res = await generateEbookVisual({
        ...selectedContext(visualContext),
        text: selected.text,
      });
      const svg = sanitizeEbookSvg(res.svg);
      if (!svg) throw new Error("AI returned an invalid SVG. Please try again.");
      setVisualSvg(svg);
      setVisualAlt((res.alt || "Visual").slice(0, 200));
    } catch (caught) {
      setVisualError(getApiErrorMessage(caught));
    } finally {
      setVisualBusy(false);
    }
  };

  const regenerateVisual = async () => {
    if (!visualSelection || !visualContext) return;
    setVisualBusy(true);
    setVisualError(null);
    try {
      const res = await generateEbookVisual({
        ...selectedContext(visualContext),
        text: visualSelection.text,
        instruction: "Create a different visual design/layout/style than before, but keep it faithful to the same content.",
      });
      const svg = sanitizeEbookSvg(res.svg);
      if (!svg) throw new Error("AI returned an invalid SVG. Please try again.");
      setVisualSvg(svg);
      setVisualAlt((res.alt || "Visual").slice(0, 200));
    } catch (caught) {
      setVisualError(getApiErrorMessage(caught));
    } finally {
      setVisualBusy(false);
    }
  };

  const insertVisual = () => {
    if (!editor || !visualSvg || !visualSelection) return;
    const pos = visualSelection.from;
    const resolved = editor.state.doc.resolve(Math.max(0, Math.min(pos, editor.state.doc.content.size)));
    const insertPos = Math.max(0, resolved.before(1));
    editor.chain().focus().insertContentAt(insertPos, { type: "visualBlock", attrs: { svg: visualSvg, alt: visualAlt || "Visual" } }).run();
    setVisualOpen(false);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card focus-within:border-fg-muted">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface-muted/50 px-1.5 py-1.5">
        <ToolbarButton
          label="Bold"
          active={state.bold}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={state.italic}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Judul sub-bagian"
          active={state.heading2}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Judul kecil"
          active={state.heading3}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Daftar poin"
          active={state.bulletList}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Daftar bernomor"
          active={state.orderedList}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={state.blockquote}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-3.5" />
        </ToolbarButton>
        {allowImages ? (
          <>
            <Divider />
            <ToolbarButton
              label="Sisipkan gambar"
              active={false}
              disabled={uploadImage.isPending}
              onClick={() => fileInput.current?.click()}
            >
              {uploadImage.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ImagePlus className="size-3.5" />
              )}
            </ToolbarButton>
          </>
        ) : null}
        {allowTables ? (
          <>
            <Divider />
            <ToolbarButton
              label="Sisipkan tabel"
              active={state.inTable}
              disabled={state.inTable}
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            >
              <TableIcon className="size-3.5" />
            </ToolbarButton>
          </>
        ) : null}
        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton
            label="Undo"
            active={false}
            disabled={!state.canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            active={false}
            disabled={!state.canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 className="size-3.5" />
          </ToolbarButton>
        </div>
      </div>

      {allowTables && state.inTable ? (
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-muted/30 px-2 py-1.5 text-[10px] font-semibold text-fg-muted">
          <span className="mr-1 uppercase tracking-wide">Tabel</span>
          <TableAction
            label="Tambah baris"
            onClick={() => editor?.chain().focus().addRowAfter().run()}
          >
            <Rows3 className="size-3" />+ Baris
          </TableAction>
          <TableAction
            label="Tambah kolom"
            onClick={() => editor?.chain().focus().addColumnAfter().run()}
          >
            <Columns3 className="size-3" />+ Kolom
          </TableAction>
          <TableAction
            label="Hapus baris"
            onClick={() => editor?.chain().focus().deleteRow().run()}
          >
            <Trash2 className="size-3" />Hapus baris
          </TableAction>
          <TableAction
            label="Hapus kolom"
            onClick={() => editor?.chain().focus().deleteColumn().run()}
          >
            <Trash2 className="size-3" />Hapus kolom
          </TableAction>
          <TableAction
            label="Hapus tabel"
            onClick={() => editor?.chain().focus().deleteTable().run()}
          >
            <Trash2 className="size-3" />Hapus tabel
          </TableAction>
        </div>
      ) : null}

      {editor && visualContext ? (
        <BubbleMenu editor={editor} options={{ placement: "top", offset: 8, flip: true }} shouldShow={({ editor: e, state }) => !e.isActive("image") && !e.isActive("visualBlock") && !state.selection.empty}>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); void openVisualize(); }}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-fg shadow-sm hover:bg-surface-muted"
          >
            Turn into visual
          </button>
        </BubbleMenu>
      ) : null}

      <EditorContent editor={editor} className="ebook-rte" />

      <Modal open={visualOpen} title="Turn into visual" onClose={() => { if (!visualBusy) setVisualOpen(false); }}>
        <div className="space-y-4">
          <p className="text-xs text-fg-muted">AI will design a wide horizontal SVG visualization based on the selected text and its context. You can ask for another design before inserting.</p>
          {visualBusy ? <div className="flex items-center gap-2 text-xs text-fg-muted"><Loader2 className="size-4 animate-spin" />Generating visual…</div> : null}
          {visualError ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[11px] font-medium text-red-600 dark:text-red-400">{visualError}</p> : null}
          {visualSvg ? (
            <div className="overflow-hidden rounded-xl border border-border bg-white">
              <div
                role="img"
                aria-label={visualAlt || "Visual"}
                className="[&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-full [&_svg]:block"
                dangerouslySetInnerHTML={{ __html: visualSvg }}
              />
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setVisualOpen(false)} disabled={visualBusy}>Cancel</Button>
            <Button variant="secondary" size="sm" onClick={() => void regenerateVisual()} disabled={visualBusy || !visualSelection}>Use another visual</Button>
            <Button size="sm" onClick={insertVisual} disabled={visualBusy || !visualSvg}>Insert</Button>
          </div>
        </div>
      </Modal>

      {allowImages ? (
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void handleFile(file);
          }}
        />
      ) : null}

      {error ? (
        <p className="border-t border-border px-3 py-2 text-[11px] text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-7 place-items-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-fg text-surface"
          : "text-fg-muted hover:bg-surface-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function TableAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded px-1.5 py-1 transition hover:bg-surface-muted hover:text-fg"
    >
      {children}
    </button>
  );
}

function selectedContext(ctx: { brand: string; niche: string; bookTitle: string; chapterTitle?: string }) {
  return {
    brand: ctx.brand || "1section",
    niche: ctx.niche,
    bookTitle: ctx.bookTitle,
    chapterTitle: ctx.chapterTitle,
  };
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-border" />;
}

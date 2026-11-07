"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
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
  Redo2,
  Rows3,
  Table as TableIcon,
  Trash2,
  Undo2,
} from "lucide-react";
import type { EbookRichTextNode } from "@/lib/ebook/types";
import { useUploadBuilderImage } from "@/hooks/use-builder";
import { getApiErrorMessage } from "@/lib/api";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis isi bab…",
  allowImages = true,
  allowTables = true,
}: {
  value: EbookRichTextNode[];
  onChange: (nodes: EbookRichTextNode[]) => void;
  placeholder?: string;
  allowImages?: boolean;
  allowTables?: boolean;
}) {
  const uploadImage = useUploadBuilderImage();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
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

      <EditorContent editor={editor} className="ebook-rte" />

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

function Divider() {
  return <span className="mx-1 h-4 w-px bg-border" />;
}

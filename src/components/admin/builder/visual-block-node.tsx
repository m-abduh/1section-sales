import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { sanitizeEbookSvg, visualAltOf, visualSpecOf } from "@/lib/ebook/visual";
import { VisualBlockSvg } from "./visual-block";

function VisualNodeView({ node }: NodeViewProps) {
  const rawSvg = typeof node.attrs.svg === "string" ? node.attrs.svg : "";
  const svg = sanitizeEbookSvg(rawSvg);
  const spec = visualSpecOf(node as any);
  const alt = visualAltOf(node as any);

  return (
    <NodeViewWrapper className="visual-block-node my-3" contentEditable={false}>
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        {svg ? (
          <div
            role="img"
            aria-label={alt}
            className="[&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-full [&_svg]:block"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : spec ? (
          <VisualBlockSvg spec={spec} />
        ) : (
          <div className="p-4 text-xs text-fg-muted">Invalid visual</div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const VisualBlock = Node.create({
  name: "visualBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      svg: { default: null },
      alt: { default: null },
      spec: { default: null }, // legacy/backward compat
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-visual-block="1"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-visual-block": "1" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VisualNodeView);
  },
});

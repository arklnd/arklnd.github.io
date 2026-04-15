import type { Root } from "mdast";
import { visit } from "unist-util-visit";

/**
 * Remark plugin that converts ```mermaid code blocks into
 * raw HTML <div class="mermaid"> nodes so Shiki doesn't
 * syntax-highlight them and Mermaid.js can render them client-side.
 */
export function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "mermaid" || index == null || !parent) return;

      parent.children[index] = {
        type: "html",
        value: `<div class="mermaid">\n${node.value}\n</div>`,
      } as any;
    });
  };
}

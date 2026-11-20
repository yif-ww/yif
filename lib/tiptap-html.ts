// lib/tiptap-html.ts — turns the blog editor's stored content (TipTap JSON)
// into safe HTML for the mobile app.
//
// Written by hand instead of using TipTap's own renderer, which needs a
// browser DOM. Every piece of text is escaped, only known node and mark types
// are produced, and links and images must use http(s). Anything else is
// dropped, so stored content can never inject markup into the app.

type Node = {
  type?: string;
  text?: string;
  content?: unknown;
  attrs?: Record<string, unknown>;
  marks?: { type?: string; attrs?: Record<string, unknown> }[];
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only absolute http(s) URLs are allowed in links and images. */
export function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function children(node: Node): Node[] {
  return Array.isArray(node.content) ? (node.content as Node[]) : [];
}

function renderText(node: Node): string {
  let html = escapeHtml(node.text ?? "");
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        html = `<strong>${html}</strong>`;
        break;
      case "italic":
        html = `<em>${html}</em>`;
        break;
      case "strike":
        html = `<s>${html}</s>`;
        break;
      case "code":
        html = `<code>${html}</code>`;
        break;
      case "link": {
        const href = safeUrl(mark.attrs?.href);
        if (href) html = `<a href="${escapeHtml(href)}">${html}</a>`;
        break;
      }
      default:
        break;
    }
  }
  return html;
}

function renderNode(node: Node): string {
  const inner = () => children(node).map(renderNode).join("");
  switch (node.type) {
    case "text":
      return renderText(node);
    case "paragraph":
      return `<p>${inner()}</p>`;
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 2, 1), 4);
      return `<h${level}>${inner()}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${inner()}</ul>`;
    case "orderedList":
      return `<ol>${inner()}</ol>`;
    case "listItem":
      return `<li>${inner()}</li>`;
    case "blockquote":
      return `<blockquote>${inner()}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${inner()}</code></pre>`;
    case "hardBreak":
      return "<br>";
    case "horizontalRule":
      return "<hr>";
    case "image": {
      const src = safeUrl(node.attrs?.src);
      if (!src) return "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`;
    }
    case "doc":
      return inner();
    default:
      // Unknown node types keep their text but lose their markup.
      return inner();
  }
}

export function tiptapToHtml(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  return renderNode(content as Node);
}

/** Plain text of the content, for reading-time estimates and previews. */
export function tiptapToText(content: unknown): string {
  const parts: string[] = [];
  const walk = (node: Node) => {
    if (node.type === "text" && node.text) parts.push(node.text);
    children(node).forEach(walk);
  };
  if (content && typeof content === "object") walk(content as Node);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function readingMinutes(text: string): number {
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

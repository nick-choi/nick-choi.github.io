import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";
import tasks from "markdown-it-task-lists";
import hljs from "highlight.js";
import sanitize from "sanitize-html";
import path from "node:path";
import type { Page } from "../src/types";

export function pageUrl(id: string, base: string) {
  return `${base}p/${id.split("/").map(encodeURIComponent).join("/")}/`;
}
export function slug(s: string) {
  return (
    s
      .trim()
      .normalize("NFC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s+/g, "-") || "section"
  );
}
export function resolveRef(
  ref: string,
  current: string,
  ids: string[],
  relative = false,
): string | undefined {
  let name = ref.replace(/^\^/, "").replace(/\.md$/i, "");
  if (!name) return current;
  if (name.startsWith("/")) {
    const rooted = name.slice(1);
    return ids.includes(rooted) ? rooted : undefined;
  }
  if (relative || name.startsWith(".")) {
    name = path.posix.normalize(
      path.posix.join(path.posix.dirname(current), name),
    );
    return ids.includes(name) ? name : undefined;
  }
  name = name.replace(/^\//, "");
  if (ids.includes(name)) return name;
  const candidates = ids.filter(
    (id) =>
      id.toLowerCase() === name.toLowerCase() ||
      id.toLowerCase().endsWith("/" + name.toLowerCase()),
  );
  const exact = candidates.filter(
    (id) => id === name || id.endsWith("/" + name),
  );
  const result = exact.length ? exact : candidates;
  return result.length === 1 ? result[0] : undefined;
}
export function renderMarkdown(
  source: string,
  current: string,
  ids: string[],
  assets: string[],
  base: string,
) {
  const toc: Page["toc"] = [],
    links = new Set<string>(),
    warnings: string[] = [];
  const md: MarkdownIt = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: false,
    highlight(code, lang): string {
      const executable =
        /^(space-lua|space-lua-script|space-lua-widget|query|template|space-style|space-script)$/i.test(
          lang,
        );
      const safeLang = lang.replace(/[^\w-]/g, "");
      const body = hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang }).value
        : md.utils.escapeHtml(code);
      return `<pre class="code-block"><span class="code-language">${md.utils.escapeHtml(safeLang || "text")}${executable ? " · 실행 안 함" : ""}</span><code class="hljs language-${safeLang}">${body}</code></pre>`;
    },
  })
    .use(footnote)
    .use(tasks, { enabled: false, label: false });
  const link = (raw: string, relative = false) => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      decoded = raw;
    }
    const match = /^(.*?)(?:#(.*)|@(\d+|[lL]\d+(?:[cC]\d+)?))?$/.exec(decoded)!;
    const target = resolveRef(match[1], current, ids, relative);
    if (!target) return undefined;
    links.add(target);
    if (match[3])
      warnings.push(`Position reference ${raw} resolves to page start`);
    return (
      pageUrl(target, base) +
      (match[2] ? "#" + encodeURIComponent(slug(match[2])) : "")
    );
  };
  const asset = (raw: string, relative: boolean) => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      return undefined;
    }
    const found = resolveRef(decoded, current, assets, relative);
    return found
      ? `${base}media/${found.split("/").map(encodeURIComponent).join("/")}`
      : undefined;
  };
  md.inline.ruler.before("link", "wikilink", (state, silent) => {
    const rest = state.src.slice(state.pos);
    const m = /^(!?)\[\[([^\]\n]+)\]\]/.exec(rest);
    if (!m) return false;
    if (!silent) {
      const [ref, ...alias] = m[2].split("|");
      const label = alias.join("|") || ref;
      const url = m[1] ? asset(ref, false) : link(ref);
      if (m[1] && url && /\.(png|jpe?g|gif|webp|avif)$/i.test(ref)) {
        const token = state.push("html_inline", "", 0);
        token.content = `<img src="${md.utils.escapeHtml(url)}" alt="${md.utils.escapeHtml(label)}" loading="lazy">`;
      } else if (url) {
        const open = state.push("link_open", "a", 1);
        open.attrSet("href", url);
        open.attrSet("class", "wiki-link");
        const text = state.push("text", "", 0);
        text.content = label;
        state.push("link_close", "a", -1);
      } else {
        warnings.push(`Unresolved wiki reference: ${ref}`);
        const token = state.push("html_inline", "", 0);
        token.content = `<span class="missing-link" title="공개 대상이 없거나 이름이 중복됩니다">${md.utils.escapeHtml(label)}</span>`;
      }
    }
    state.pos += m[0].length;
    return true;
  });
  md.core.ruler.push("viewer", (state) => {
    const seen = new Map<string, number>();
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];
      if (token.type === "heading_open") {
        const next = state.tokens[i + 1];
        const text =
          next.children
            ?.filter((t) => t.type === "text" || t.type === "code_inline")
            .map((t) => t.content)
            .join("") || next.content;
        const key = slug(text),
          n = seen.get(key) || 0;
        seen.set(key, n + 1);
        const id = key + (n ? "-" + n : "");
        token.attrSet("id", id);
        toc.push({ id, text, level: Number(token.tag.slice(1)) });
      }
      for (const child of token.children || []) {
        if (child.type === "link_open" && !child.attrGet("class")) {
          const href = child.attrGet("href") || "";
          if (!/^[a-z][a-z\d+.-]*:/i.test(href) && !href.startsWith("//")) {
            const url = link(href, true) || asset(href, true);
            if (url) child.attrSet("href", url);
            else {
              child.attrSet("href", "#");
              child.attrSet("class", "missing-link");
              warnings.push(`Unresolved Markdown link: ${href}`);
            }
          } else {
            child.attrSet("rel", "noopener noreferrer");
          }
        }
        if (child.type === "image") {
          const src = child.attrGet("src") || "";
          const url = asset(src, true);
          if (url) child.attrSet("src", url);
          else {
            child.attrSet("src", "");
            warnings.push(`Image not in public assets: ${src}`);
          }
          child.attrSet("loading", "lazy");
        }
      }
    }
  });
  const html = sanitize(md.render(source), {
    allowedTags: [...sanitize.defaults.allowedTags, "img", "input"],
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      "*": ["class", "id", "title"],
      a: ["href", "rel", "class", "id"],
      img: ["src", "alt", "title", "loading"],
      input: ["type", "disabled", "checked"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
  });
  return { html, toc, links: [...links], warnings };
}

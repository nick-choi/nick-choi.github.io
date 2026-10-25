import {
  readdir,
  readFile,
  mkdir,
  writeFile,
  copyFile,
  lstat,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { renderToString } from "react-dom/server";
import { parse } from "yaml";
import config from "../viewer.config";
import { App } from "../src/App";
import { renderMarkdown, pageUrl } from "./markdown";
import type { Page, SiteData, Summary } from "../src/types";

const base = config.base;
if (!/^\/(?:[A-Za-z0-9._~-]+\/)*$/.test(base))
  throw Error("BASE_PATH must be / or /repository-name/");
const root = path.resolve(config.contentDir),
  dist = path.resolve("dist");
if (root === process.cwd() || dist.startsWith(root + path.sep))
  throw Error("contentDir must be a dedicated directory");
if ((await lstat(root)).isSymbolicLink())
  throw Error("Symlink content root is forbidden");
const files: string[] = [];
async function walk(dir: string) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink())
      throw Error(`Symlinks are forbidden in public content: ${full}`);
    if (entry.isDirectory()) await walk(full);
    else if (entry.isFile())
      files.push(path.relative(root, full).split(path.sep).join("/"));
  }
}
await walk(root);
const sources = files.filter((f) => f.endsWith(".md"));
const assets = files.filter((f) => /\.(png|jpe?g|gif|webp|avif|pdf)$/i.test(f));
const ids = sources.map((f) => f.slice(0, -3));
if (!ids.includes(config.home))
  throw Error(`Home page ${config.home}.md missing`);
const raw = new Map<string, string>();
const pages: Page[] = [];
for (const file of sources) {
  const id = file.slice(0, -3);
  let body = await readFile(path.join(root, file), "utf8");
  let meta: Record<string, unknown> = {};
  const fm = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(body);
  if (fm) {
    meta = parse(fm[1]) || {};
    body = body.slice(fm[0].length);
  }
  raw.set(id, body);
  pages.push({
    id,
    title: typeof meta.title === "string" ? meta.title : id.split("/").at(-1)!,
    description: typeof meta.description === "string" ? meta.description : "",
    text: body,
    url: pageUrl(id, base),
    html: "",
    toc: [],
    links: [],
    backlinks: [],
  });
}
const warnings: string[] = [];
for (const page of pages) {
  const result = renderMarkdown(raw.get(page.id)!, page.id, ids, assets, base);
  Object.assign(page, {
    html: result.html,
    toc: result.toc,
    links: result.links,
  });
  warnings.push(...result.warnings.map((w) => `${page.id}: ${w}`));
}
const summaries: Summary[] = pages.map(
  ({ id, title, url, description, text }) => ({
    id,
    title,
    url,
    description,
    text,
  }),
);
for (const page of pages)
  page.backlinks = summaries
    .filter(
      (p) =>
        p.id !== page.id &&
        pages.find((x) => x.id === p.id)!.links.includes(page.id),
    )
    .map((p) => ({ ...p, text: "" }));
const shell = await readFile(path.join(dist, "index.html"), "utf8");
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const json = (data: unknown) =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
async function output(page: Page, target: string) {
  const data: SiteData = {
    title: config.title,
    base,
    home: pageUrl(config.home, base),
    page: { ...page, text: "" },
    pages: summaries.map((p) => ({ ...p, text: "" })),
  };
  const html = shell
    .replace("<!--ssr-->", () => renderToString(<App data={data} />))
    .replace("__VIEWER_DATA__", () => json(data))
    .replace(
      /<title>.*?<\/title>/,
      () => `<title>${escape(page.title)} · ${escape(config.title)}</title>`,
    );
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
}
await rm(path.join(dist, "p"), { recursive: true, force: true });
await rm(path.join(dist, "media"), { recursive: true, force: true });
for (const page of pages)
  await output(page, path.join(dist, "p", page.id, "index.html"));
await output(
  pages.find((p) => p.id === config.home)!,
  path.join(dist, "index.html"),
);
for (const file of assets) {
  const dest = path.join(dist, "media", file);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(path.join(root, file), dest);
}
await writeFile(path.join(dist, "search-index.json"), json(summaries));
await writeFile(path.join(dist, ".nojekyll"), "");
await writeFile(
  path.join(dist, "404.html"),
  `<!doctype html><html lang="ko"><meta charset="utf-8"><title>Page not found</title><h1>공개 문서를 찾을 수 없습니다</h1><a href="${escape(base)}">홈으로</a></html>`,
);
await writeFile(
  path.join(dist, "build-report.json"),
  JSON.stringify(
    { pages: pages.length, assets: assets.length, base, warnings },
    null,
    2,
  ),
);
console.log(
  `Generated ${pages.length} static pages, ${assets.length} assets at ${base}. Warnings: ${warnings.length}`,
);
for (const w of warnings) console.warn(w);

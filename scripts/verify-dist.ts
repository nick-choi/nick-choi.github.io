import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const report = JSON.parse(
  await readFile(path.join(root, "build-report.json"), "utf8"),
);
const base: string = report.base;
let documents = 0,
  links = 0;
async function validate(file: string) {
  const html = await readFile(file, "utf8");
  documents++;
  if (file.endsWith("404.html")) return;
  if (!html.includes('id="viewer-data"'))
    throw Error(`Missing static page data: ${file}`);
  if (html.includes("__VIEWER_DATA__") || html.includes("<!--ssr-->"))
    throw Error(`Unrendered page: ${file}`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1];
    if (!href || href.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(href))
      continue;
    if (!href.startsWith(base))
      throw Error(`Incorrect base path: ${href} in ${file}`);
    const [pathname, hash] = href.split("#");
    const target = path.join(
      root,
      decodeURIComponent(pathname.slice(base.length)),
    );
    let actual = target;
    try {
      if ((await stat(target)).isDirectory())
        actual = path.join(target, "index.html");
      await stat(actual);
    } catch {
      throw Error(`Missing target ${href} in ${file}`);
    }
    if (hash && actual.endsWith(".html")) {
      const content = await readFile(actual, "utf8");
      const id = decodeURIComponent(hash);
      if (!content.includes(`id="${id}"`))
        throw Error(`Missing fragment ${href}`);
    }
    links++;
  }
}
async function walk(dir: string) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full);
    else if (e.name.endsWith(".html")) await validate(full);
  }
}
await walk(root);
console.log(
  `Verified ${documents} HTML files and ${links} local references at ${base}`,
);

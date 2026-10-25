import { test, expect } from "bun:test";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const script = path.resolve(import.meta.dir, "../scripts/generate.tsx");
async function fixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "viewer-test-"));
  await mkdir(path.join(dir, "content/public"), { recursive: true });
  await mkdir(path.join(dir, "dist"));
  await writeFile(
    path.join(dir, "dist/index.html"),
    '<html><head><title>Test</title></head><body><div id="root"><!--ssr--></div><script type="application/json">__VIEWER_DATA__</script></body></html>',
  );
  await writeFile(
    path.join(dir, "content/public/Home.md"),
    '---\ntitle: "</script><script>alert(1)</script>"\n---\n# Home\n\n[[Other]]',
  );
  await writeFile(
    path.join(dir, "content/public/Other.md"),
    "# Other\n\nSTATIC_BODY_SENTINEL\n\n[[Home]]",
  );
  await writeFile(path.join(dir, "content/private.md"), "PRIVATE_SENTINEL");
  await writeFile(
    path.join(dir, "content/public/.secret.md"),
    "HIDDEN_SENTINEL",
  );
  await writeFile(path.join(dir, "content/public/secret.env"), "ENV_SENTINEL");
  return dir;
}
async function generate(dir: string) {
  const proc = Bun.spawn([process.execPath, script], {
    cwd: dir,
    env: { ...process.env, BASE_PATH: "/project/" },
    stdout: "pipe",
    stderr: "pipe",
  });
  const code = await proc.exited;
  return { code, err: await new Response(proc.stderr).text() };
}
test("generator prerenders only public Markdown and safely embeds data", async () => {
  const dir = await fixture();
  try {
    expect((await generate(dir)).code).toBe(0);
    const home = await readFile(path.join(dir, "dist/index.html"), "utf8");
    const other = await readFile(
      path.join(dir, "dist/p/Other/index.html"),
      "utf8",
    );
    const search = await readFile(
      path.join(dir, "dist/search-index.json"),
      "utf8",
    );
    expect(other).toContain("STATIC_BODY_SENTINEL");
    expect(home).toContain("/project/p/Other/");
    expect(home).not.toContain("</script><script>alert");
    expect(home).toContain("\\u003c/script>");
    expect(search).not.toContain("PRIVATE_SENTINEL");
    expect(search).not.toContain("HIDDEN_SENTINEL");
    expect(search).not.toContain("ENV_SENTINEL");
    const report = JSON.parse(
      await readFile(path.join(dir, "dist/build-report.json"), "utf8"),
    );
    expect(report.pages).toBe(2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("public directory symlinks fail closed", async () => {
  const dir = await fixture();
  try {
    await symlink("../private.md", path.join(dir, "content/public/leak.md"));
    const result = await generate(dir);
    expect(result.code).not.toBe(0);
    expect(result.err).toContain("Symlinks are forbidden");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

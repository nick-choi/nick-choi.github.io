import { describe, expect, test } from "bun:test";
import { renderMarkdown, resolveRef, pageUrl } from "../scripts/markdown";
const ids = [
  "Home",
  "Guide/Markdown",
  "Guide/Start",
  "A/Duplicate",
  "B/Duplicate",
  "한글/노트",
];
const render = (s: string) =>
  renderMarkdown(s, "Guide/Markdown", ids, ["assets/test.png"], "/notes/");
describe("SilverBullet-style link resolution", () => {
  test("exact, suffix, case, caret, relative and ambiguous", () => {
    expect(resolveRef("Home", "Guide/Markdown", ids)).toBe("Home");
    expect(resolveRef("start", "Guide/Markdown", ids)).toBe("Guide/Start");
    expect(resolveRef("^Guide/Start", "Home", ids)).toBe("Guide/Start");
    expect(resolveRef("../Home.md", "Guide/Markdown", ids, true)).toBe("Home");
    expect(resolveRef("Duplicate", "Home", ids)).toBeUndefined();
    expect(resolveRef("Private", "Home", ids)).toBeUndefined();
    expect(resolveRef("/Home.md", "Guide/Markdown", ids, true)).toBe("Home");
  });
  test("wiki aliases, heading links and Unicode paths", () => {
    const result = render(
      "[[Home|홈]] [[Guide/Start#첫 단계|시작]] [[한글/노트]]",
    );
    expect(result.html).toContain('href="/notes/p/Home/"');
    expect(result.html).toContain(">홈</a>");
    expect(result.html).toContain("#%EC%B2%AB-%EB%8B%A8%EA%B3%84");
    expect(result.links).toEqual(["Home", "Guide/Start", "한글/노트"]);
    expect(pageUrl("한글/노트", "/notes/")).toContain("%ED%95%9C%EA%B8%80");
  });
  test("links in inline and fenced code stay literal", () => {
    const r = render("`[[Home]]`\n\n```text\n[[Home]]\n```");
    expect(r.links).toHaveLength(0);
    expect(r.html).not.toContain("wiki-link");
  });
  test("relative Markdown links and media respect the base", () => {
    const r = render(
      "[홈](../Home.md)\n\n![img](../assets/test.png)\n\n![[test.png|test]]",
    );
    expect(r.html).toContain('href="/notes/p/Home/"');
    expect(
      r.html.match(/src="\/notes\/media\/assets\/test.png"/g),
    ).toHaveLength(2);
  });
  test("unpublished and ambiguous targets are inert", () => {
    expect(render("[[Private]] [[Duplicate]]").html).not.toContain("<a");
    expect(render("[[Private]]").warnings).toHaveLength(1);
  });
});
describe("static and safe rendering", () => {
  test("raw HTML and scripts cannot become executable", () => {
    const r = render(
      "<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n[bad](javascript:alert(1))",
    );
    expect(r.html).not.toContain("<script>");
    expect(r.html).not.toContain("<img src=x");
    expect(r.html).not.toContain('href="javascript:');
  });
  test("Space Lua and expressions remain text", () => {
    const r = render(
      '```space-lua\nerror("NEVER_EXECUTE")\n```\n\n${os.execute("NEVER_EXECUTE")}',
    );
    expect(r.html).toContain("실행 안 함");
    expect(r.html).toContain("NEVER_EXECUTE");
    expect(r.html).toContain("${os.execute");
  });
  test("tasks disabled, footnotes and syntax highlight", () => {
    const r = render(
      "- [x] Done\n- [ ] Todo\n\n```typescript\nconst value = 42;\n```\n\nHello[^n]\n\n[^n]: Footnote",
    );
    expect(r.html.match(/disabled/g)).toHaveLength(2);
    expect(r.html).toContain("hljs-keyword");
    expect(r.html).toContain("footnote");
  });
  test("heading slugs are stable and duplicates distinct", () => {
    const r = render("# 한글 제목\n\n## Repeat\n\n## Repeat");
    expect(r.toc.map((t) => t.id)).toEqual(["한글-제목", "repeat", "repeat-1"]);
  });
  test("external images and undeclared assets are excluded", () => {
    const r = render(
      "![x](https://example.com/x.png)\n\n![secret](../../private.png)",
    );
    expect(r.html).not.toContain('src="https:');
    expect(r.html).not.toContain('src="../../');
    expect(r.warnings).toHaveLength(2);
  });
});

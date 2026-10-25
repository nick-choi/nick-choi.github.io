import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Search,
  PanelLeft,
  List,
  Sun,
  Moon,
  X,
  FileText,
  ChevronRight,
  Link,
  LockKeyhole,
} from "lucide-react";
import type { SiteData, Summary } from "./types";

export function App({ data }: { data: SiteData }) {
  const { page, pages } = data;
  const [left, setLeft] = useState(false),
    [right, setRight] = useState(false),
    [picker, setPicker] = useState(false),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(0),
    [theme, setTheme] = useState("light"),
    [index, setIndex] = useState<Summary[]>(pages),
    [searchState, setSearchState] = useState("");
  const trigger = useRef<HTMLElement | null>(null),
    input = useRef<HTMLInputElement>(null),
    dialog = useRef<HTMLDivElement>(null);
  const open = () => {
    trigger.current = document.activeElement as HTMLElement;
    setQuery("");
    setSelected(0);
    setPicker(true);
  };
  const close = () => {
    setPicker(false);
    trigger.current?.focus();
  };
  useEffect(() => {
    let saved = "";
    try {
      saved = localStorage.getItem("viewer-theme") || "";
    } catch {}
    const choice =
      saved ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(choice);
    document.documentElement.dataset.theme = choice;
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
      if (e.key === "Escape") {
        setPicker(false);
        setLeft(false);
        setRight(false);
        trigger.current?.focus();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  useEffect(() => {
    if (!picker) return;
    input.current?.focus();
    if (index.some((p) => p.text)) return;
    const abort = new AbortController();
    setSearchState("본문 검색 색인을 불러오는 중…");
    fetch(data.base + "search-index.json", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((v: Summary[]) => {
        setIndex(v);
        setSearchState("");
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setSearchState(
            "본문 색인을 불러오지 못했습니다. 제목 검색은 가능합니다.",
          );
      });
    return () => abort.abort();
  }, [picker]);
  const results = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return index
      .map((p) => ({
        p,
        score: terms.reduce(
          (n, t) =>
            n +
            (p.id.toLocaleLowerCase().includes(t) ? 10 : 0) +
            (p.text.toLocaleLowerCase().includes(t) ? 1 : 0),
          0,
        ),
      }))
      .filter(({ p }) =>
        terms.every((t) =>
          (p.id + " " + p.title + " " + p.text).toLocaleLowerCase().includes(t),
        ),
      )
      .sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id))
      .map((x) => x.p);
  }, [index, query]);
  const changeTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("viewer-theme", next);
    } catch {}
  };
  return (
    <>
      <a className="skip-link" href="#document">
        본문으로 이동
      </a>
      <header id="sb-top">
        <div className="top-inner">
          <button
            className="icon-button"
            aria-label="문서 탐색"
            aria-expanded={left}
            onClick={() => setLeft(!left)}
          >
            <PanelLeft size={19} />
          </button>
          <button
            className="page-title"
            aria-label="페이지 선택"
            onClick={open}
            title="페이지 선택 (⌘/Ctrl K)"
          >
            {page.id}
            <ChevronRight size={17} />
          </button>
          <div className="actions">
            <a className="icon-button" href={data.home} aria-label="홈">
              <Home size={18} />
            </a>
            <button className="icon-button" aria-label="검색" onClick={open}>
              <Search size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="테마 전환"
              onClick={changeTheme}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              className="icon-button"
              aria-label="목차"
              aria-expanded={right}
              onClick={() => setRight(!right)}
            >
              <List size={19} />
            </button>
          </div>
        </div>
      </header>
      <div
        className={`workspace ${left ? "left-open" : ""} ${right ? "right-open" : ""}`}
      >
        {left && (
          <aside className="navigation" aria-label="문서 목록">
            <div className="panel-header">
              <span>
                Pages <small>{pages.length}</small>
              </span>
              <button
                className="icon-button"
                aria-label="탐색 닫기"
                onClick={() => setLeft(false)}
              >
                <X size={16} />
              </button>
            </div>
            <button className="find-button" onClick={open}>
              <Search size={15} /> 페이지 찾기 <kbd>⌘ K</kbd>
            </button>
            <nav>
              {pages.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  className={page.id === p.id ? "active" : ""}
                  aria-current={page.id === p.id ? "page" : undefined}
                >
                  <FileText size={15} />
                  <span>{p.id}</span>
                </a>
              ))}
            </nav>
            <div className="space-label">
              <LockKeyhole size={13} /> Public space · Read only
            </div>
          </aside>
        )}
        <main id="document" tabIndex={-1}>
          <article
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
          <section className="backlinks" aria-label="역링크">
            <h2>
              <Link size={15} /> Linked mentions{" "}
              <span>{page.backlinks.length}</span>
            </h2>
            {page.backlinks.length ? (
              page.backlinks.map((p) => (
                <a key={p.id} href={p.url}>
                  <FileText size={14} />
                  {p.id}
                  <ChevronRight size={14} />
                </a>
              ))
            ) : (
              <p>이 문서를 가리키는 공개 문서가 없습니다.</p>
            )}
          </section>
          <footer>
            <span>
              <LockKeyhole size={12} /> 읽기 전용
            </span>
            <a href={data.base + "licenses/SilverBullet-MIT.txt"}>
              SilverBullet UI · MIT
            </a>
            <a href={data.base + "licenses/THIRD-PARTY-NOTICES.txt"}>
              라이선스
            </a>
          </footer>
        </main>
        {right && (
          <aside className="outline" aria-label="목차 패널">
            <div className="panel-header">
              <span>On this page</span>
              <button
                className="icon-button"
                aria-label="목차 닫기"
                onClick={() => setRight(false)}
              >
                <X size={16} />
              </button>
            </div>
            <nav>
              {page.toc.map((t) => (
                <a
                  key={t.id}
                  href={"#" + encodeURIComponent(t.id)}
                  style={{ paddingLeft: 12 + (t.level - 1) * 12 }}
                  onClick={() => {
                    if (innerWidth < 800) setRight(false);
                  }}
                >
                  {t.text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>
      <div className="bottom-bar">
        <span>{page.id}</span>
        <span>
          {pages.length} public pages <span className="dot">·</span> Static
          viewer
        </span>
        <div>
          <button aria-label="뒤로" onClick={() => history.back()}>
            <ArrowLeft size={14} />
          </button>
          <button aria-label="앞으로" onClick={() => history.forward()}>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      {picker && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="picker"
            role="dialog"
            aria-modal="true"
            aria-label="페이지 검색"
            ref={dialog}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const nodes = dialog.current?.querySelectorAll<HTMLElement>(
                  "button,input,[href]",
                );
                if (nodes?.length) {
                  const first = nodes[0],
                    last = nodes[nodes.length - 1];
                  if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                  } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                  }
                }
              }
            }}
          >
            <div className="picker-header">
              <span>Open page</span>
              <button
                className="icon-button"
                aria-label="검색 닫기"
                onClick={close}
              >
                <X size={18} />
              </button>
            </div>
            <div className="picker-input">
              <Search size={20} />
              <input
                ref={input}
                aria-label="문서 검색어"
                placeholder="페이지 이름 또는 본문 검색…"
                value={query}
                aria-controls="search-results"
                aria-activedescendant={
                  results[selected] ? "result-" + selected : undefined
                }
                role="combobox"
                aria-expanded="true"
                aria-autocomplete="list"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelected((n) => Math.min(n + 1, results.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelected((n) => Math.max(n - 1, 0));
                  }
                  if (e.key === "Enter" && results[selected])
                    location.href = results[selected].url;
                }}
              />
              <kbd>esc</kbd>
            </div>
            {searchState && (
              <p role="status" className="search-state">
                {searchState}
              </p>
            )}
            <div id="search-results" role="listbox" className="results">
              {results.length ? (
                results.map((p, i) => (
                  <a
                    id={"result-" + i}
                    key={p.id}
                    role="option"
                    aria-selected={selected === i}
                    className={selected === i ? "selected" : ""}
                    href={p.url}
                    onMouseEnter={() => setSelected(i)}
                    ref={(el) => {
                      if (el && selected === i)
                        el.scrollIntoView({ block: "nearest" });
                    }}
                  >
                    <FileText size={19} />
                    <div>
                      <strong>{p.id}</strong>
                      <p>
                        {query && p.text
                          ? snippet(p.text, query)
                          : p.description || "공개 Markdown 문서"}
                      </p>
                    </div>
                    <span className="enter">↵</span>
                  </a>
                ))
              ) : (
                <p className="empty">“{query}” 검색 결과가 없습니다.</p>
              )}
            </div>
            <div className="picker-help">
              <span>
                ↑ ↓ 선택 <span className="dot">·</span> ↵ 열기
              </span>
              <span>{results.length} pages</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function snippet(text: string, q: string) {
  const pos = text
    .toLowerCase()
    .indexOf(q.trim().toLowerCase().split(/\s+/)[0]);
  const start = Math.max(0, pos - 30);
  return (
    (start ? "…" : "") + text.slice(start, start + 120).replace(/\n/g, " ")
  );
}

# SilverBullet Static Viewer

SilverBullet에서 선택한 Markdown을 읽기 전용 HTML로 변환하는 독립 프로젝트입니다. **TypeScript + React + Vite + Bun**으로 구현했습니다. Quartz/MkDocs 테마를 사용하지 않습니다.

SilverBullet 공식 오픈소스의 상단 바, 문서 폭과 글꼴, 색상, WikiLink 표현, Page Picker UX를 참고했습니다. 원본 편집기를 실행하거나 SilverBullet 서버를 연결하지 않습니다.

## 실행

Bun 1.4.4와 Node.js 24를 설치한 뒤 실행합니다. 의존성 설치·TypeScript 검사·Vite 빌드·정적 생성은 Bun으로 실행하며, Vite 미리보기는 Node.js를 사용합니다:

```sh
bun install --frozen-lockfile
bun test
bun run build
bun run dev
```

터미널의 URL을 여세요. `dev`와 `preview`는 **생성된 dist를 제공**합니다. 문서·코드 변경 뒤 `bun run build`를 다시 실행하고 새로고침하세요. 현재 자동 감시/HMR은 제공하지 않습니다. `file://`로 직접 열지 말고 HTTP 서버를 사용하세요.

## 공개 문서 선택

```text
content/
  public/                 # 이 폴더만 배포 입력
    Home.md
    Guide/
      Getting Started.md
      Markdown.md
    assets/
      palette.png
```

`viewer.config.ts`에서 `contentDir`, `home`, 사이트 이름을 바꿀 수 있습니다. `content/public/`에 **의도적으로 복사한 공개 문서만** 넣으세요. 원래 SilverBullet Space 전체를 이 경로로 지정하지 마세요. 비공개 문서는 GitHub 저장소에도 커밋하지 않는 것이 좋습니다.

- 하위 폴더를 포함한 `.md`가 각각 HTML로 생성됩니다.
- 지원 첨부 파일: PNG, JPG/JPEG, GIF, WebP, AVIF, PDF.
- 숨김 파일/폴더는 제외하고 심볼릭 링크가 있으면 빌드에 실패합니다.
- HTML, SVG, JS, CSS, 설정 파일 및 그 외 확장자의 첨부는 복사하지 않습니다.
- 미리 만들어진 `public/`은 **Vite의 신뢰된 앱 자산 폴더**입니다. 라이선스와 폰트만 넣었으며, 여기에 넣은 파일은 Vite가 그대로 배포합니다. 개인 파일을 넣지 마세요.
- 검색 색인에는 선택한 Markdown의 **전체 본문**이 들어갑니다. 숨겨야 할 내용은 공개 문서 자체에서 제거해야 합니다. YAML frontmatter는 제거한 뒤 제목/설명만 사용합니다.
- 누락/중복 링크와 이미지 문제는 콘솔 및 `dist/build-report.json`에 기록됩니다.

선택적 YAML frontmatter:

```yaml
---
title: 표시할 제목
description: 검색 결과에 표시할 설명
---
```

상단 Page Picker에는 SilverBullet처럼 파일 경로가 표시됩니다. HTML 문서 제목과 검색 메타데이터에는 `title`을 사용합니다.

## 기능

| 구분      | 지원                                                                        |
| --------- | --------------------------------------------------------------------------- |
| 문서      | 문서별 사전 렌더링 HTML, 직접 접속/새로고침, 링크 탐색                      |
| WikiLink  | `[[Page]]`, `[[Page\|별칭]]`, `[[Page#제목]]`, `[[#제목]]`, caret 메타 경로 |
| 이름 해석 | 정확한 경로 우선 → 대소문자 무시 suffix/name 매칭, 정확한 대소문자 우선     |
| 상대 링크 | `[제목](../Page.md)`, 루트 경로 링크, URL 인코딩/공백/한글 경로             |
| 이미지    | `![설명](../assets/image.png)`, `![[image.png\|설명]]`                      |
| Markdown  | 제목, 표, 인용, 목록, 비활성 작업 체크박스, 각주, 취소선, 링크 자동 감지    |
| 코드      | highlight.js 언어별 하이라이트, 미지원 언어는 일반 코드                     |
| 탐색      | Page Picker, 문서 목록, 목차, 역링크, 브라우저 앞/뒤 이동                   |
| 검색      | 제목/경로 + 전체 본문, 공백으로 구분한 단어 AND 검색, 키보드 선택           |
| 읽기 환경 | 라이트/다크, 로컬 테마 저장, 반응형 화면, 인쇄 CSS, 접근성 레이블/포커스    |

### 원본과의 차이 및 비실행 원칙

- React 읽기 전용 UI이며 CodeMirror 라이브 편집기 전체를 이식한 것은 아닙니다. 화면 구성·글꼴·치수·색상을 원본에 맞췄으며 편집 상태, 플러그인별 화면까지 동일하지는 않습니다.
- Space Lua, query, template, Space Style, script와 `${...}`는 **실행하지 않습니다**. 코드 블록/텍스트로 표시합니다. Lua VM, 플러그인 로더, eval, 편집 API가 없습니다.
- 원시 HTML은 escape하고 생성 HTML도 sanitize합니다. Markdown에서 외부 이미지는 로드하지 않으며 선택한 공개 첨부 이미지로 바꿔야 합니다. 외부 일반 링크는 사용할 수 있습니다.
- 이름이 중복된 WikiLink는 임의로 문서를 선택하지 않고 비활성 경고로 표시합니다. 명시적인 전체 경로로 고치세요. 원본의 모호한 링크 선택 UI는 제공하지 않습니다.
- 페이지 transclusion `![[Page]]`, `$anchor` 전역 객체 참조, 태그/객체 데이터베이스, 커스텀 문법/플러그인, 동적 쿼리, 수식/Mermaid 렌더링은 지원하지 않습니다.
- `Page@123`, `Page@L12C4`는 문서 처음으로 이동하고 경고를 기록합니다. 제목 참조는 slug 기반이며 반복 제목에는 `-1`, `-2`가 붙습니다. 원본의 위치 참조를 재현하지 않습니다.
- 검색은 브라우저가 정적 JSON 색인을 읽습니다. 대규모 Space를 위한 분할/압축 색인이나 형태소·오타 검색은 제공하지 않습니다.
- 문서가 바뀌면 **빌드 전체를 다시 실행**해야 합니다. 생성기는 이전 `p/`와 `media/`를 지우므로 공개에서 제거한 문서가 다음 빌드에 남지 않습니다.

## GitHub Pages 배포

1. 이 프로젝트를 새 GitHub 저장소의 루트에 넣습니다. `bun.lock`, `.github/workflows/pages.yml`도 커밋합니다. `node_modules`는 커밋하지 않습니다.
2. 저장소 **Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택합니다.
3. `main` 브랜치에 push하거나 Actions에서 워크플로를 직접 실행합니다. 다른 기본 브랜치라면 workflow의 `branches`를 수정하세요.
4. 워크플로가 테스트 → 빌드 → artifact 업로드 → Pages 배포를 수행합니다. `configure-pages`의 `base_path`로 URL 접두사를 자동 설정합니다.

직접 빌드할 때:

```sh
# 사용자 사이트 username.github.io 또는 도메인 루트
bun run build

# username.github.io/my-notes/ 프로젝트 사이트
BASE_PATH=/my-notes/ bun run build
BASE_PATH=/my-notes/ bun run preview
```

`BASE_PATH`는 `/`로 시작하고 끝나야 합니다. 빌드/미리보기 때 같은 값을 쓰세요. macOS/Linux 기준이며 Windows PowerShell은 `$env:BASE_PATH='/my-notes/'`로 먼저 설정합니다.

`dist/` 전체가 배포 결과입니다. 경로는 `p/Guide/Markdown/index.html`처럼 생성되며, 실제 URL은 `/my-notes/p/Guide/Markdown/`입니다. HTML/JS/CSS/이미지/폰트/검색 색인/라이선스 URL에 접두사가 반영됩니다. 서버 URL 재작성이나 SPA 404 우회 스크립트는 필요하지 않습니다. `.nojekyll`과 정적 `404.html`도 생성됩니다.

GitHub 계정/저장소 연결이나 실제 push는 이 결과물에 포함되지 않았습니다. 포함한 workflow를 해당 저장소에서 실행하면 됩니다. 공개 설정과 실제 문서 내용은 배포 전에 확인하세요.

## 구조

- `src/App.tsx`: React UI, 검색, Page Picker, 탐색과 테마
- `src/style.css`: SilverBullet에서 참고한 읽기 전용 스타일
- `scripts/markdown.ts`: Markdown 렌더러, 링크와 첨부 해석, HTML 정제
- `scripts/generate.tsx`: 공개 문서 수집, SSR, 역링크/검색 색인 생성
- `scripts/notices.ts`: 설치된 의존성의 라이선스 텍스트 수집
- `tests/`: 링크·비실행·비공개 제외·정적 생성 회귀 테스트
- `public/licenses/`: SilverBullet MIT, 폰트 OFL, 서드파티 고지
- `RESEARCH.md`: 원본 조사 대상, commit 및 구현 대응
- `VERIFICATION.md`: 실제 빌드/브라우저 검증 결과

`bun run check`는 TypeScript 검사, `bun test`는 회귀 테스트입니다. `bun run build`는 타입 검사와 라이선스 수집도 수행합니다.

## 라이선스

프로젝트 코드는 MIT입니다. SilverBullet의 참고/각색한 스타일은 **Copyright 2022 Zef Hemel, MIT** 고지를 유지합니다. iA Writer Mono 원본 폰트는 **SIL Open Font License 1.1**이며 Information Architects/IBM 저작권과 원문 라이선스를 포함합니다. `public/licenses/`는 `dist/licenses/`에도 복사되고 UI 하단에서 접근할 수 있습니다. 독립 프로젝트이며 공식 SilverBullet 배포판이나 상표 사용 승인을 의미하지 않습니다.

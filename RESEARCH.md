# SilverBullet 원본 조사 및 구현 대응

조사일: 2026-10-25 (Asia/Seoul)

공식 저장소 https://github.com/silverbulletmd/silverbullet 의 소스를 직접 clone해 읽었습니다. 기준 commit은 `3ee1f82deedf4d083bb1adde43f131448082abc6`입니다. 이후 upstream 변경과 무관하게 아래 대응을 재현할 수 있습니다.

| 원본 파일 (위 commit 기준)            | 확인한 규칙                                                      | 뷰어 적용                                              |
| ------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| `client/styles/top.scss`              | 높이 55px, 중앙 상단 바, 28px 문서명, 액션 버튼                  | `src/style.css`, `src/App.tsx`                         |
| `client/components/top_bar.tsx`       | 문서명과 액션/탐색 상태                                          | 읽기 전용 문서 선택 버튼과 아이콘 액션                 |
| `client/styles/theme.scss`            | 편집 폭 800px, iA Mono, 라이트/다크 배경/링크/테이블 색상        | 대응 CSS 변수, 테마 스위치                             |
| `client/styles/editor.scss`           | 기본 18px, 제목 1.5/1.2/1.1em, 중앙 문서 여백                    | 읽기 전용 article 스타일                               |
| `client/styles/_markdown_body.scss`   | 회색 목록 bullet, 둥근 WikiLink 배경·padding                     | 각색한 목록 및 링크 CSS                                |
| `client/styles/modals.scss`           | 페이지 선택 모달과 선택 결과 표현                                | 검색 입력, 목록, 선택 배경, 키보드 힌트                |
| `client/markdown_parser/constants.ts` | `[[ref\|alias]]`의 ref/alias 구분                                | markdown-it 인라인 파서                                |
| `client/markdown_renderer/inline.ts`  | WikiLink/일반 링크 및 전용 표현 처리                             | 정적 링크와 이미지 변환 경계 참고                      |
| `docs/Link.md`                        | 정확한 경로 우선, 이름/suffix 조회, 대소문자와 모호성, 상대 링크 | `resolveRef`, 중복 대상은 비활성 경고                  |
| `docs/Markdown/Admonition.md`         | bold 키워드가 있는 인용 표현                                     | 일반 인용 + bold는 보존; 커스텀 admonition 런타임 제외 |
| `docs/Markdown/Anchor.md`             | 원본의 객체 anchor와 위치 참조는 별도 런타임 영역                | 미지원 범위 README에 명시                              |
| `client/fonts/` 및 `LICENSE.md`       | iA Writer Mono, SIL OFL 1.1; SilverBullet MIT                    | 원본 폰트와 라이선스 원문 동봉                         |

공식 코드 permalink 예:

- https://github.com/silverbulletmd/silverbullet/blob/3ee1f82deedf4d083bb1adde43f131448082abc6/client/styles/theme.scss
- https://github.com/silverbulletmd/silverbullet/blob/3ee1f82deedf4d083bb1adde43f131448082abc6/client/styles/top.scss
- https://github.com/silverbulletmd/silverbullet/blob/3ee1f82deedf4d083bb1adde43f131448082abc6/client/styles/editor.scss
- https://github.com/silverbulletmd/silverbullet/blob/3ee1f82deedf4d083bb1adde43f131448082abc6/client/styles/_markdown_body.scss
- https://github.com/silverbulletmd/silverbullet/blob/3ee1f82deedf4d083bb1adde43f131448082abc6/docs/Link.md
- https://github.com/silverbulletmd/silverbullet/blob/3ee1f82deedf4d083bb1adde43f131448082abc6/LICENSE.md

## 구현 선택

원본 프런트엔드는 Preact/CodeMirror 및 서버·플러그인 런타임과 통합되어 있습니다. 요청에 맞춰 React로 별도 UI를 구현하고, 서버·CodeMirror 편집 상태·Lua 런타임 없이 정적 Markdown만 사전 렌더링합니다. 원본 코드를 통째로 실행하는 방식은 사용하지 않았습니다.

라이브 편집 화면의 문법 표시/숨김, 플러그인별 화면, 위젯 실행까지 동일하게 구현한 것은 아닙니다. 중심 문서, 좁은 상단 바, 원본 글꼴, 링크·코드·테이블 색상, Page Picker 상호작용을 우선했습니다.

GitHub Pages는 임의 경로를 SPA에 전달하지 않으므로 문서마다 물리적인 `index.html`을 생성합니다. React는 이미 렌더링된 HTML을 hydrate하고, 검색·패널·테마만 브라우저에서 담당합니다. JavaScript 실행 전에도 본문과 일반 링크는 HTML에 있습니다.

## 라이선스 유지

- 각색한 CSS 머리에 SilverBullet 저작권과 MIT 출처를 명시했습니다.
- `public/licenses/SilverBullet-MIT.txt`는 upstream 라이선스 원문입니다.
- `public/licenses/iA-Writer-Mono.txt`는 Information Architects 및 IBM 고지와 OFL 원문입니다. 폰트 파일은 수정하지 않았습니다.
- 설치된 패키지의 라이선스 텍스트를 빌드 때 수집해 `THIRD-PARTY-NOTICES.txt`로 배포합니다.
- UI에서 원본 라이선스와 통합 고지에 접근할 수 있습니다.
- SilverBullet 로고/상표 이미지는 포함하지 않았습니다. 독립 프로젝트임을 명시합니다.

GitHub Pages 워크플로는 GitHub 공식 문서의 build/upload/deploy 구성을 참고했습니다. 빌드 job에는 `contents: read`, `pages: read`만, 배포 job에는 `pages: write`, `id-token: write`를 부여합니다. `configure-pages` 메타데이터 조회가 비공개 저장소에서도 가능하도록 읽기 권한을 명시했습니다.

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://github.com/actions/configure-pages

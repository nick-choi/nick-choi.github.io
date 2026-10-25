---
title: Home
description: 공개된 노트를 탐색하는 작은 읽기 전용 공간
---
# A space for your notes

생각을 기록하고, 서로 연결하고, 웹에 공유합니다.
SilverBullet에서 쓰던 문서를 **익숙한 모습 그대로** 읽는 공개 공간입니다.

> 이 공간은 읽기 전용입니다. 페이지 이름을 누르거나 `⌘ K`로 문서를 찾아보세요.

## Start here

- [[Guide/Getting Started|시작하기]] — 공개할 문서를 선택하고 배포하기
- [[Guide/Markdown|Markdown 둘러보기]] — 링크, 코드, 이미지와 작업 목록
- [[Journal/First Note|첫 번째 작업 로그]] — 연결되는 노트의 예시

## Keep your own workflow

문서는 여전히 평범한 Markdown 파일입니다. SilverBullet에서 작성한 뒤 공개할 파일만 `content/public/`에 복사하세요. 빌드할 때 정적 HTML과 검색 색인이 만들어집니다.

```typescript
const space = {
  source: "Markdown",
  access: "read-only",
  destination: "GitHub Pages",
};
```

## Small, connected, open

| 기능 | 사용 방법 |
| --- | --- |
| 페이지 탐색 | 상단 문서 이름 또는 ⌘ / Ctrl K |
| 본문 검색 | 검색창에 단어 입력 |
| 문서 연결 | WikiLink와 역링크 |
| 읽기 환경 | 밝은 테마 / 어두운 테마 |

이 뷰어는 SilverBullet의 오픈소스 웹 UI를 참고한 독립 프로젝트입니다. 서버 연결이나 로그인이 필요하지 않습니다.

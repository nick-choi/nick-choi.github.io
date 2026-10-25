---
description: 공개 폴더 구성부터 GitHub Pages 배포까지
---
# 시작하기

[[Home|홈]] / Guide

## 공개할 문서 선택

`content/public/`에 넣은 문서와 지원하는 첨부 파일만 공개됩니다. 개인 Space 전체를 이 폴더로 지정하지 마세요.

1. 공개할 `.md` 문서를 복사합니다.
2. 문서에서 참조하는 이미지도 같은 구조로 복사합니다.
3. `bun run build`로 결과를 확인합니다.

## 로컬에서 읽기

```sh
bun install --frozen-lockfile
bun run build
bun run preview
```

## GitHub Pages

저장소의 Settings → Pages에서 Source를 **GitHub Actions**로 선택하세요. 기본 브랜치에 push하면 포함된 워크플로가 배포합니다.

프로젝트 저장소는 `BASE_PATH=/저장소이름/`, 사용자 사이트는 `/`를 사용합니다. 워크플로가 Pages 설정에서 경로를 자동으로 가져옵니다.

## 연결된 문서

[[Markdown#코드와 실행 문법|실행 문법 처리]]를 확인하고 [[../Journal/First Note|작업 로그]]도 살펴보세요.

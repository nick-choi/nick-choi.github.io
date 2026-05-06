
# Astro 기본 테마 테스트
Astro의 기본 테마(Blog 템플릿)를 사용하여 기존에 가지고 계신 `.md` 파일들을 로컬에서 빌드하고 확인하는 가장 빠른 방법입니다.

---

## 1단계: Astro 블로그 템플릿 설치
먼저 마크다운 처리에 최적화된 공식 블로그 스타터 키트를 생성합니다.

1.  터미널(또는 CMD)을 열고 아래 명령어를 입력합니다.
```bash
    npm create astro@latest -- --template blog
```

2.  설정 질문이 나오면 다음과 같이 선택하세요:
    *   **Where should we create...**: 프로젝트 폴더명 입력 (예: `my-docs`)
    *   **Install dependencies?**: `Yes`
    *   **Initialize a new git repository?**: 선택 사항
    *   **TypeScript?**: `Strict` 또는 `Yes`

3.  생성된 폴더로 이동합니다.
```bash
    cd my-docs   
```

---

## 2단계: Markdown 파일 복사
Astro의 블로그 템플릿은 `src/content/blog/` 폴더 내의 파일을 읽도록 설정되어 있습니다.

*   본인이 가지고 있는 `.md` 파일들을 **`src/content/blog/`** 폴더 안으로 복사하세요.

> **주의 (Frontmatter 확인):** 
> Astro 블로그 템플릿은 각 마크다운 상단에 아래와 같은 형식이 있어야 오류 없이 빌드됩니다. (최소한 `title`과 `pubDate`는 필수입니다.)

```markdown
---
title: "내 문서 제목"
description: "문서 설명"
pubDate: "2024-05-06"
heroImage: "/blog-placeholder-3.jpg"
---
```

---

## 3단계: 로컬 서버 실행 및 확인
이제 코드가 잘 돌아가는지 브라우저에서 미리보기(Preview)를 실행합니다.

1.  **개발 서버 실행:**
```bash
    npm run dev
```
2.  브라우저에서 `[http://localhost](http://localhost):4321/blog`에 접속합니다. 복사한 마크다운 파일들이 목록에 나오는지 확인하세요.

---

## 4단계: 정적 파일로 Build 하기
실제로 배포 가능한 형태의 정적 파일(HTML/CSS)로 변환하고 싶다면 빌드 명령어를 사용합니다.

1.  **프로젝트 빌드:**
```bash
    npm run build
```
2.  빌드가 완료되면 프로젝트 루트에 **`dist/`** 폴더가 생성됩니다. 이 안에 있는 파일들이 실제 웹사이트 구성 요소입니다.
3.  빌드된 결과를 로컬에서 다시 확인하려면:
```bash
    npm run preview
```

---

# 커스텀 테마 만들기
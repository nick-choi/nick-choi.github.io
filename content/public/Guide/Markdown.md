---
description: SilverBullet 문법을 안전한 정적 HTML로 표시하는 예시
---
# Markdown 둘러보기

[[Home|홈]]으로 돌아가기 · [[Getting Started|시작하기]]

## 링크

별칭을 가진 [[Home|WikiLink]], [[#이미지|문서 안의 제목 링크]], [상대 경로 링크](<Getting Started.md>), [외부 링크](https://silverbullet.md)를 지원합니다.

`[[이것은 코드라서 링크로 바꾸지 않습니다]]`

## 코드와 실행 문법

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}
console.log(greet("SilverBullet"));
```

Space Lua 코드는 아래처럼 표시만 합니다. 플러그인, 쿼리, 원격 호출을 실행하지 않습니다.

```space-lua
local private = "이 코드는 실행되지 않습니다"
print(private)
```

인라인 표현식도 일반 텍스트입니다: ${os.execute("never run")}

## 이미지

![작업 공간의 색상 팔레트](../assets/palette.png)

Wiki 이미지도 지원합니다: ![[palette.png|색상 팔레트]]

## 목록과 인용

- [x] 공개 문서 폴더 분리
- [x] 읽기 전용 페이지 생성
- [ ] 다음 작업 로그 작성

> **note** 작업 목록은 상태만 표시하며 변경할 수 없습니다.

**굵은 글씨**, *기울임*, ~~취소선~~, `inline code`.

## 각주

문서 본문에 각주를 넣을 수 있습니다.[^note]

[^note]: SilverBullet 고유의 전체 런타임이 아닌 정적 Markdown 지원 범위를 제공합니다.

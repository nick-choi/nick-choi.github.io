## SilverBullet으로 생성된 문서들 정적인 페이지로 배포하기
* 홈서버에서 기록용으로 silverbullet을 도입하려고 하는데, 심플한 UI가 마음에 들어서 외부에 정적페이지로 공유되면 좋겠다 생각으로 시작하게 되었다.
* 2026-05-01 작업시작

### 1. SpaceLua를 이용해서 Deploy 기능 만들고 github 저장소에 올리기
* SpaceLua란?
    * SilverBullet 환경 내에서 실행되며, 문서 관리 및 자동화 작업을 처리하기 위해 설계된 경량 스크립팅 언어
    * 즉 스크립트를 작성해서 실행할 수 있다. 내부 스크립트로 문서를 내보내고, git 작업까지 일괄처리했다.
  
* 작업된 문서들 중 정적인 페이지로 deploy할 수 있게 스크립트 작성
    * [DeployPages](DeployPages.md) 참고
        * 전체 Pages에서 배포되면 안되는 것들을 제외하고 dist 폴더에 새로 write한다.
        * tags가 private인지 dist 디텍토리 안에 존재하는지 등등 예외처리
        
```
        where not table.includes(p.tags, "private")
          and not p.name:startsWith("Library/")
          and not p.name:startsWith("dist/")    
          and not p.name:startsWith("CONFIG")
          and not p.name:startsWith("SETTINGS")
          and not p.name:startsWith("_")  
```

* deploy 하면 디렉토리 구조가 요롷게 된다.

```
  silverbullet
  └── space
      ├── dist
      │   └── public md files...
      ├── index.md
      └── md files...
```

* github 저장소에 올리기
    * github.io 저장소 설정하는 방법은 웹상에 문서들이 많으니 참고해서 저장소 설정하고 위의 space 디렉토리를 기준으로 하위 모든 폴더들을 커밋,푸시한다.
    * **_단 github.io 에 올라가면 안되는 원본 md 파일들은 .gitignore 에 반드시 추가해야 github 저장소에 공유되지 않는다._**
      
### 2. github workflow를 이용해서 deploy시 mkdocs로 빌드하여 github.io로 배포하기
* mkdocs를 이용해서 github.io 에 이쁘게 나오게 하기
    * 로컬 /space/mkdocs.yml에 생성하기
    
```yaml
site_name: Nick's Digital Garden
theme:
  name: material
  language: ko  # 한국어 검색 지원
  palette:
    - scheme: slate  # 이게 바로 Deep Dark (Slate) 모드입니다
      primary: black
      accent: blue
  features:
    - navigation.tabs
    - navigation.sections
    - search.suggest
    - search.highlight

markdown_extensions:
  - admonition
  - pymdownx.details
  - pymdownx.superfences
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.inlinehilite
  - pymdownx.snippets
```

* github workflow 에서 push 될때마다 mkdocs를 build하고 배포하는 deploy.yml 추가    

```yaml
name: Deploy MkDocs Site
on:
  push:
    branches:
      - main

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.x'

      - name: Install MkDocs and Material Theme
        run: |
          pip install mkdocs-material

      - name: Prepare Docs Folder
        run: |
          # MkDocs는 기본적으로 docs/ 폴더를 바라봅니다.
          # 실버불렛이 만든 dist/ 폴더를 docs/로 이름을 바꿉니다.
          mkdir -p docs
          cp -r dist/* docs/
          # 만약 index.md가 없다면 첫 페이지 에러가 나므로 확인
          [ -f docs/index.md ] || echo "# Welcome" > docs/index.md

      - name: Deploy to GitHub Pages
        run: |
          # 이 명령어 한 줄로 gh-pages 브랜치에 자동으로 HTML이 빌드되어 올라갑니다.
          mkdocs gh-deploy --force
```

### 3. SilverBullet 페이지 하나를 로컬 저장하고 mkdocs의 custom theme으로 맞추기
* mkdocs로 올리면 SilverBullet과는 다른 평범한 UI를 가지고 있게 된다.
* 즉, SilverBullet의 간결한 UI 맛이 없어서 gemini, chatGPT로 확인해보니 SilverBullet 자체의 랜더링이라 mkdocs 에서 맞게하기 어렵다고 한다.

* 그래서 SilverBullet의 첫번째 페이지를 그냥 정적인 파일로 저장한 다음, vscode에서 ai의 도움을 받아 mkdocs의 기본 theme에 다가 SilverBullet의 css를 얻게 변경하였다.

* mkdos-theme 이 적용된 디렉토리 구조

```text
silverbullet
└── space
    ├── dist
    │   └── public files...
    ├── mkdocs-theme #추가된 theme 
    │   ├── css
    │   │   └── base.css
    │   ├── js
    │   └── main.html
    ├── mkdocs.yml
    └── md files...
```

* 임의로 수정된 mkdocs.yml

  ```yaml
  site_name : nickchoi pages
  site_description: Silverbullet-inspired MkDocs Documentation

  theme:
    name: mkdocs
    custom_dir: mkdocs-theme
    language: en

  docs_dir: dist #처음부터 dist로 지정하여 나중 배포시 docs로 복사 단계를 없앰

  # Extra CSS
  extra_css:
  - css/base.css

  # Markdown Extensions
  markdown_extensions:
  - meta
  - tables
  - toc:
      permalink: true
      toc_depth: 3
  - codehilite
  - fenced_code
  - md_in_html
  - attr_list
  - pymdownx.superfences
  - pymdownx.highlight
  - pymdownx.tasklist:
      custom_checkbox: true
  - pymdownx.emoji:
      emoji_index: !!python/name:pymdownx.emoji.twemoji
      emoji_generator: !!python/name:pymdownx.emoji.to_svg

  # Site URL (Update when deploying)
  site_url: [https://nick-choi.github.io/](https://nick-choi.github.io/)

  # Use strict mode
  strict: false

  # Plugins
  plugins:
    - search
  ```

* 마지막으로 workflows/deploy.yml 정리
    * 이전의 docs로 파일복사하는 step 삭제함으로써 배포가 더 빨라짐
    
```yaml
  name: Deploy MkDocs Site
  on:
    push:
      branches:
        - main

  permissions:
    contents: write

  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
          with:
            fetch-depth: 0

        - name: Setup Python
          uses: actions/setup-python@v5
          with:
            python-version: '3.x'

        - name: Install MkDocs and Material Theme
          run: |
            pip install mkdocs-material

        - name: Deploy to GitHub Pages
          run: |
            # mkdocs-theme 폴더가 루트에 그대로 있으므로
            # mkdocs.yml의 'custom_dir: mkdocs-theme/'를 통해 자동으로 참조하여 빌드합니다.
            mkdocs gh-deploy --force
```

### 4. 그 외 개선 필요한 사항들
* [ ] History 기능 - 네비게이션이 불편함. 그러나 mkdocs의 네비는 심플하지 않아서 고민중.
* [ ] Private 저장소에 따로 올리는 기능. github.io 의 저장소는 public 이어야 되는 조건 때문에 2중 관리가 필요
* [ ] tags에 private 이 있으면 .gitignore에 자동으로 추가되는 기능
  * [ ] 차라리 dist를 submodules로 빼서 따로 관리하는 게 보안상 나을지도?

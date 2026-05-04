## SilverBullet.md
* 마크다운(Markdown) 기반의 오픈소스 개인 지식 관리 시스템(PKM, Personal Knowledge Management)

### SilverBullet으로 생성된 문서들 정적인 페이지로 만들기
* 홈서버에서 기록용으로 silverbullet을 도입하려고 하는데, 심플한 UI가 마음에 들어서 외부에 정적페이지로 다른 사람들도 볼 수 있게 하면 좋겠다 생각으로 시작하게 되었다.

#### 1. SpaceLua를 이용해서 Deploy 기능 만들고 github 저장소에 올리기
* SpaceLua란?
    * SilverBullet 환경 내에서 실행되며, 문서 관리 및 자동화 작업을 처리하기 위해 설계된 경량 스크립팅 언어
    * 즉 스크립트를 작성해서 실행할 수 있다. 내부 스크립트로 문서를 내보내고, git 작업까지 일괄처리했다.
  
* 작업된 문서들 중 정적인 페이지로 deploy할 수 있게 스크립트 작성
    * [[DeployPages]] 참고
        * 전체 Pages에서 배포되면 안되는 것들을 제외하고 dist 폴더에 새로 write한다.
        * tags 가 private 등등
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
    │   └── public md files
    ├── index.md
    └── md files
```

* github 저장소에 올리기
    * github.io 저장소 설정하는 방법은 웹상에 문서들이 많으니 참고해서 저장소 설정하고 위의 space 디렉토리를 기준으로 하위 모든 폴더들을 커밋, 푸시한다.
    * 
      
    * 보통 <자신계정>.github.io.git main 브랜치 업로드한다. github.io는 설명해놓은 좋은 문서들이 많다.
      

#### 2. github workflow를 이용해서 deploy시 mkdocs로 빌드하가 github.io로 배포하기
#### 
#### 3. silverbullet 페이지 하나를 로컬 저장하고 mkdocs의 custom theme으로 맞추기
#### 4. 그 외 수정사항들

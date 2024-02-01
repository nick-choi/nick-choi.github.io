---
layout: article
title: More Modern CMake - Variables explained
tags: CMake
permalink: /more-modern-cmake-variables-explained
---

# 변수 설명

## Overview

* 질문
  * 변수는 어떻게 작동하는가?

* 목표
  * 지역 변수에 대해 알아보자.
  * 캐시된 변수가 실행 전반에 걸쳐 지속된다는 점을 이해하라.
  * 글로브(glob)할 줄 알아야 하고, 왜 하면안되는지 알아야 한다.

## 변수

이 연습에서는 **CMakeLists.txt**를 실행하는 대신 CMake 스크립트를 직접 실행한다. 이를 수행하는 명령은 다음과 같다:

```
# example.cmake라는 파일이 있다고 가정한다:
cmake -P example.cmake
```
이렇게 하면, 주변에 작은 빌드들이 많이 생기지 않는다.

### 지역 변수

지역 변수부터 시작하자.
```
# local.cmake
set(MY_VARIABLE "I am a variable")
message(STATUS "${MY_VARIABLE}")
```

여기서는 변수를 설정하는 set 명령과 문자열을 출력하는 message 명령을 볼 수 있다. STATUS 메시지를 출력하고 있는데, 다른 유형이 있다(CMake 3.15+에는 다른 유형이 많이 있다).

#### 변수에 대한 추가 정보

다음을 시도해 보자:
* set에서 따옴표를 제거하자. 무슨 일이 발생하는가?
* message에서 따옴표를 제거하자.무슨 일이 발생하는가? 왜?
* -P 앞에 -DMY_VARIABLE=something을 사용하여 캐시된 변수를 설정해 보자. 어떤 변수가 표시되는가?

### 캐시된 변수

이제 캐시된 변수를 살펴보자. 모든 CMake 빌드의 핵심 요소이다. 빌드에서 캐시된 변수는 커맨드라인 이나 그래픽 툴( **ccmake**, **cmake-gui** 같은)에서 설정된 다음 **CMakeCache.txt**라는 파일에 저장된다. 다시 실행하면 시작하기 전에 캐시가 읽혀지므로 CMake는 실행한 내용을 "기억"한다. 예를 들어 스크립트 모드에서 CMake를 사용하면 캐시를 기록하지 않으므로 더 쉽게 사용할 수 있다. 지난 강의에서 빌드한 예제를 다시 살펴보고 빌드 디렉토리에 있는 **CMakeCache.txt** 파일을 조사해 보자. 첫 번째 실행 시 발견되거나 설정된 컴파일러 위치와 같은 항목이 캐시된다.

캐시된 변수는 다음과 같다:
```
# cache.cmake
set(MY_CACHE_VAR "I am a cached variable" CACHE STRING "Description")
message(STATUS "${MY_CACHE_VAR}")
```

여기서는 변수 유형을 포함해야만 한다. 이전에는 할 필요가 없었지만(하지만 할 수 있었다) - 이것은 그래픽 CMake 툴이 올바른 옵션을 표시하는 데 도움이 된다. 주요 차이점은 **CACHE** 키워드와 설명이다. **cmake -L** 또는 **cmake -LH**를 실행하면 캐시된 모든 변수와 설명이 표시된다.

일반 set 명령은 캐시된 변수가 아직 설정되지 않은 경우에만 설정한다. 이를 통해 **-D**를 사용하여 캐시된 변수를 재정의할 수 있다. 시도해보자:

```
cmake -DMY_CACHE_VAR="command line" -P cache.cmake
```

캐시된 변수가 이미 설정되어 있더라도 **FORCE**를 사용하여 캐시된 변수를 설정할 수 있다. 자주 있으면 안돈다. 캐시된 변수는 전역 변수이므로 때때로 임시 전역 변수로 사용되는 경우가 있다 - **INTERNAL** 키워드는 **STRING FORCE**와 동일하며 목록/GUI에서 변수를 숨긴다.

bool 캐시 변수는 빌드에 매우 일반적이므로 **option**을 사용하여 변수를 만드는 간단한 구문이 있다.

```
option(MY_OPTION "On or off" OFF)
```

### 그 외 변수

**\$ENV\{name\}**을 사용하여 환경 변수를 가져올 수 있다. **if\(DEFINED ENV\{name\}\)**을 사용하여 환경 변수가 정의되었는지 확인할 수 있다\(**\$** 누락에 주의\).

속성은 대상에 연결된 변수의 한 형태이다. **get_property** 및 **set_property** 또는 [**get_target_properties**][] 및 set_target_properties를 사용하여 이에 액세스하고 설정할 수 있다. CMake 버전별로 모든 속성 목록을 볼 수 있다. 프로그래밍 방식으로 이를 얻을 수 있는 방법은 없다.

#### 유용한 팁

변수나 속성을 디버깅할 때 타이핑을 줄일 수 있는 유용한 명령인 **cmake_print_properties** 및 **cmake_print_variables**을 추가하려면 **include(CMakePrintHelpers)** 사용하라.

### 타겟 속성과 변수

타겟을 배웠다; 동작을 제어하는 속성이 붙어 있다. **CXX_EXTENSIONS**와 같은 이러한 속성 중 다수는 **CMAKE_CXX_EXTENSIONS**와 같이 **CMAKE_**로 시작하는 매칭 변수를 가지고 있는데, 이 변수들을 초기화하는 데 사용된다.  따라서 타겟을 만들기 전에 변수를 설정하여 각 타겟에 설정된 속성을 사용할 수 있다.

### Globbing

**string**, **file**, [**lists**][] 등에 도움이 되는 여러 명령이 있다. 가장 흥미로운 것 중 하나를 간단히 살펴보겠다 : glob

```
file(GLOB OUTPUT_VAR *.cxx)
```

이 명령은 패턴과 일치하는 모든 파일의 목록을 만들어서 **OUTPUT_VAR**에 저장한다. 하위 디렉터리를 반복하는 **GLOB_RECURSE**를 사용할 수도 있다. [문서](https://cmake.org/cmake/help/latest/command/file.html?highlight=glob#filesystem)에서 볼 수 있는 몇 가지 유용한 옵션이 있지만 특히 중요한 옵션은 **CONFIGURE_DEPENDS** (CMake 3.12+)이다.

(구성 단계가 아닌)빌드 단계를 다시 실행할 때 **CONFIGURE_DEPENDS**를 설정하지 않으면, 빌드 툴은 이제 glob을 통과하는 새 파일을 추가했는지 확인하지 않는다. 이것이 잘못 작성된 CMake 프로젝트에 파일을 추가하려고 할 때 종종 문제가 발생하는 원인이다. 어떤 사람들은 이 때문에 모든 빌드 전에 **cmake**를 다시 실행하는 습관을 갖고 있다. 수동으로 재구성할 필요가 없다. 빌드 툴은 이 한 가지 예외를 제외하고 필요에 따라 CMake를 다시 실행한다. **CONFIGURE_DEPENDS**를 추가하면 대부분의 빌드 툴이 실제로 glob 검사도 시작한다. CMake의 고전적인 규칙은 "절대 glob하지 않음"이었다. 새로운 규칙은 "절대 glob하지 않지만, 필요한 경우 **CONFIGURE_DEPENDS**를 추가"하는 것이다.

### 더 읽어보기

* [Modern CMake basics/variables](https://cliutils.gitlab.io/modern-cmake/chapters/basics.html)을 기반으로 함
* [CMake's docs](https://cmake.org/cmake/help/latest/index.html)도 읽어볼 것

## 핵심사항

* 지역 변수는 이 디렉터리 이하에서 작동한다.
* 캐시된 변수는 실행 간에 저장된다.
* 환경 변수, 속성 등에 액세스할 수 있다.
* 디스크에서 파일을 수집하기 위해 glob를 사용할 수 있지만 항상 좋은 생각은 아니다.
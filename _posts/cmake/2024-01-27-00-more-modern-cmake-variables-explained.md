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

### Other variables

You can get environment variables with $ENV{name}. You can check to see if an environment variable is defined with if(DEFINED ENV{name}) (notice the missing $).

Properties are a form of variable that is attached to a target; you can use **get_property** and **set_property**, or [**get_target_properties**][] and set_target_properties (stylistic preference) to access and set these. You can see a list of all properties by CMake version; there is no way to get this programmatically.

#### Handy tip

Use **include(CMakePrintHelpers)** to add the useful commands **cmake_print_properties** and **cmake_print_variables** to save yourself some typing when debugging variables and properties.

### Target properties and variables

You have seen targets; they have properties attached that control their behavior. Many of these properties, such as **CXX_EXTENSIONS**, have a matching variable that starts with **CMAKE_**, such as **CMAKE_CXX_EXTENSIONS**, that will be used to initialize them. So you can using set property on each target by setting a variable before making the targets.

### Globbing

There are several commands that help with **string**s, **file**s, [**lists**][], and the like. Let’s take a quick look at one of the most interesting: glob.

```
file(GLOB OUTPUT_VAR *.cxx)
```

This will make a list of all files that match the pattern and put it into **OUTPUT_VAR**. You can also use **GLOB_RECURSE**, which will recurse subdirectories. There are several useful options, which you can look at in the documentation, but one is particularly important: **CONFIGURE_DEPENDS** (CMake 3.12+).

When you rerun the build step (not the configure step), then unless you set **CONFIGURE_DEPENDS**, your build tool will not check to see if you have added any new files that now pass the glob. This is the reason poorly written CMake projects often have issues when you are trying to add files; some people are in the habit of rerunning **cmake** before every build because of this. You shouldn’t ever have to manually reconfigure; the build tool will rerun CMake as needed with this one exception. If you add **CONFIGURE_DEPENDS**, then most build tools will actually start checking glob too. The classic rule of CMake was "never glob"; the new rule is "never glob, but if you have to, add **CONFIGURE_DEPENDS**".

### 더 읽어보기

* [Modern CMake basics/variables](https://cliutils.gitlab.io/modern-cmake/chapters/basics.html)을 기반으로 함
* [CMake's docs](https://cmake.org/cmake/help/latest/index.html)도 읽어볼 것

## 핵심사항

* Local variables work in this directory or below.
* Cached variables are stored between runs.
* You can access environment variables, properties, and more.
* You can glob to collect files from disk, but it might not always be a good idea.
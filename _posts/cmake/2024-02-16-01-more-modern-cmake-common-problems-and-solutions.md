---
layout: article
title: More Modern CMake - Common Problems and Solutions  
tags: CMake
permalink: /more-modern-cmake-common-problems-and-solutions
---

# 일반적인 문제 및 해결 방법

## Overview

* 질문
  * 무엇이 잘못될 수 있나?

* 목표
  * 몇 가지 일반적인 실수 식별하기
  * 일반적인 실수 피하기

이제 CMake 코드 및 빌드와 관련된 몇 가지 일반적인 문제를 살펴보자.

## 1: 낮은 최소 CMake 버전

```
cmake_minimum_required(VERSION 3.0 FATAL_ERROR)
```

어떤 경우에는 이 숫자를 올리는 것만으로도 문제가 해결된다. 예를 들어 3.0 이하에서는 맥OS에서 링크할 때 잘못된 동작하는 경향이 있다.

해결책: 최소 버전을 높게 설정하거나 버전 범위 기능과 CMake 3.12 이상을 사용한다. 극도로 보수적인 프로젝트라도 선택해야 할 가장 낮은 버전은 3.4 이다; 해당 버전에서는 몇 가지 일반적인 이슈가 해결되었다.

## 2: 내부 폴더에서 빌드

CMake를 소스 디렉토리에서 빌드할 때 사용해서는 안되지만 실수하기 쉽다. 그리고 일단 발생하면, 소스 외부에서 다시 빌드하기 전에 디렉토리를 수동으로 정리해야 한다. 이 때문에 초기 실행 후 빌드 디렉토리에서 **cmake .**을 실행할 수 있지만, 소스 디렉토리에서 잊어버리고 실행할 경우를 대비하여 이 방법은 피하는 것이 좋다. 또한 **CMakeLists.txt**에 다음 체크를 추가할 수 있다:


```
### 소스 외부에서 빌드 필요
file(TO_CMAKE_PATH "${PROJECT_BINARY_DIR}/CMakeLists.txt" LOC_PATH)
if(EXISTS "${LOC_PATH}")
    message(FATAL_ERROR "You cannot build in a source directory (or any directory with "
                        "CMakeLists.txt file). Please make a build subdirectory. Feel free to "
                        "remove CMakeCache.txt and CMakeFiles.")
endif()
```

한 두 개의 생성된 파일을 피할 수는 없지만, 맨 위에 두면 생성된 대부분의 파일을 피할 수 있을 뿐만 아니라, 사용자(아마도 당신)에게 실수를 했다는 것을 즉시 알릴 수 있다.

## 3: 컴파일러 선택하기

CMake는 여러 컴파일러가 있는 시스템에서 잘못된 컴파일러를 선택할 수 있다. 처음 구성할 때 환경 변수 **CC** 및 **CXX**를 사용하거나 CMake 변수 **CMAKE_CXX_COMPILER** 등을 사용할 수 있지만 - 첫 실행 시 컴파일러를 선택해야만 한다; 새로운 컴파일러를 얻기 위해 재구성만 할 수는 없다.

## 4: 경로의 공백이 있을 때

CMake의 목록 및 인자 시스템은 매우 조잡하다(매크로 언어다); 이를 유리하게 사용할 수 있지만 문제가 발생할 수 있다(이것이 Python의 **f( args )**처럼 CMake에 "splat" 연산자가 없는 이유이기도 하다). 항목이 여러 개일 경우 목록(고유 인자)이다:

```
set(VAR a b v)
```

VAR의 값은 세 개의 요소가 있는 목록이거나 문자열 **"a;b;c"**이다(두 항목은 정확히 동일하다). 
따라서 이렇게 하면:

```
set(MY_DIR "/path/with spaces/")
target_include_directories(target PRIVATE ${MY_DIR})
```

아래 것과 동일하다.

```
target_include_directories(target PRIVATE /path/with spaces/)
```

두 개의 별도 인자이기 때문에, 원하는 바가 전혀 아니다. 해결책은 원래 값을 큰 따옴표로 묶는 것이다: 
```
set(MY_DIR "/path/with spaces/")
target_include_directories(target PRIVATE "${MY_DIR}")
```

이제 공백을 포함한 단일 디렉터리가 올바르게 설정된다.

## 핵심사항

* CMake 버전을 너무 낮게 설정했다.
* 소스 안에서 빌드하면 안된다.
* 컴파일러를 선택하는 방법.
* 경로에서 공백을 사용하는 방법.
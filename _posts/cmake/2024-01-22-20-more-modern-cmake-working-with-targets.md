---
layout: article
title: More Modern CMake - Working with Targets
tags: CMake
permalink: /more-modern-cmake-working-with-targets
---

# Working with Targets

## Overview

* 질문
  * 타겟(target)은 어떻게 동작하는가?

* 목표
  * 타겟(target) 설정 방법을 알아두자
  * linking 및 INTERFACE 속성 이해하자
  * INTERFACE 타겟(target) 만들기

## 타겟(Targets)

이제 CMake의 세 라인을 사용하여 단일 파일을 컴파일하는 방법을 알게 되었다. 하지만 종속성이 있는 파일이 두 개 이상 있으면 어떻게 될까? 프로젝트 구조에 대해 CMake에 알릴 수 있어야 하며 이는 프로젝트를 빌드하는 데 도움이 된다. 그러기 위해서는 target이 필요한다.

넌 이 타겟(target)은 이미 보았다:

```
add_executable(myexample simple.cpp)
```

그러면 **myexample** 이름으로 "실행 가능한" 타겟이 만들어진다. 타겟 이름은 고유해야 한다(실제로 원하는 경우 실행 파일 이름을 타겟 이름이 아닌 다른 이름으로 설정할 수 있는 방법이 있다).

타겟은 다른 언어의 "객체(object)"와 매우 유사하며, 정보를 저장하고 있는 속성(멤버 변수)를 가지고 있다. 예를 들어 **SOURCES** 속성에는 **simple.cpp**가 있다.

또 다른 유형의 타겟 은 라이브러리(library)이다:

```
add_library(mylibrary simplelib.cpp)
```

어떤 종류의 라이브러리를 만들고 싶은지 알고 있다면, 키워드 **STATIC**, **SHARED** 또는 **MODULE**을 추가할 수 있다. 기본값은 **BUILD_SHARED_LIBS**를 사용하여 사용자가 선택할 수 있는 일종의 "자동(auto)" 라이브러리이다.

빌드되지 않은 라이브러리도 만들 수 있다. 이에 대한 자세한 내용은 나중에 타겟으로 무엇을 할 수 있는지 살펴본다.

## 링킹(연길)

여러 타겟이 있으면 **target_link_libraries** 및 키워드를 사용하여 타겟 간의 관계를 설명할 수 있다. **PUBLIC**, **PRIVATE**, **INTERFACE** 중 하나이다. 라이브러리를 만들 때 이 키워드를 잊으면 안된다! CMake는 일반적으로 문제를 일으키는 이 타겟에 대해 이전 호환성 모드로 전환된다.

### 질문

**my_lib.hpp** 및 **my_lib.cpp**로 만든 **my_lib** 라이브러리가 있다. 컴파일하려면 최소한 C++14가 필요하다. 그런 다음 **my_exe**를 추가하고 **my_lib**가 필요한 경우 **my_exe**를 C++14 이상으로 컴파일해야 할까?

### 정답

이는 헤더에 따라 다르다. 헤더에 C++14가 포함된 경우, 이는 PUBLIC 요구 사항이다. 라이브러리와 사용자 모두에게 필요하다. 그러나 헤더가 모든 C++ 버전에서 유효하고 **my_lib.cpp** 내부 구현에만 C++14가 필요한 경우 이는 **PRIVATE** 요구 사항이다.

* 사용자는 강제로 C++14 모드로 들어갈 필요가 없다.

사용자에게 C++14가 필요하지만 라이브러리는 모든 C++ 버전으로 컴파일할 수 있다. 이는 INTERFACE 요구 사항이다.

![링킹](/assets/images/modern-cmake/linking.png)

그림 1: PUBLIC, PRIVATE 및 INTERFACE의 예. **myprogram**은 **mylibrary**를 통해 볼 수 있는 세 개의 라이브러리를 구축한다. Private 라이브러리는 영향을 미치지 않는다.

모든 타겟에는 값으로 채워질 수 있는 두 가지 속성 모음이 있다. "PRIVATE" 속성은 해당 대상을 빌드할 때 발생하는 작업을 제어하고, "INTERFACE" 속성은 이 타겟에 연결된 타겟에게 빌드 시 수행할 작업을 알려준다. **PUBLIC** 키워드는 두 속성 필드를 동시에 채운다.

## Example 1: 디렉토리 포함하기

**target_include_directories(TargetA PRIVATE mydir)**를 실행하면 **TargetA**의 **INCLUDE_DIRECTORIES** 속성에 mydir이 추가된다. 대신 **INTERFACE** 키워드를 사용하면 **INTERFACE_INCLUDE_DIRECTORIES**가 대신 추가되며  **PUBLIC**을 사용하는 경우 두 속성이 동시에 추가된다.

## Example 2: C++ standard

C++ 표준 속성인 **CXX_STANDARD**가 있다. 이 속성을 설정할 수 있으며 CMake의 많은 속성과 마찬가지로 설정된 경우 **CMAKE_CXX_STANDARD** 변수에서 기본값을 가져오지만 INTERFACE 버전이 없다. 타겟을 통해 **CXX_STANDARD**를 강제할 수 없다. C++11 인터페이스 타겟과 C++14 인터페이스 타겟이 있고 둘 다에 연결되어 있다면 어떻게 해야할까?

그런데 이를 처리하는 방법이 있다. 타겟을 컴파일하는 데 필요한 최소 컴파일 기능을 지정할 수 있다. **cxx_std_11** 및 유사한 메타 기능은 이에 적합하다. **CXX_STANDARD**가 설정되지 않는 한 타겟은 최소한 지정된 최고 레벨로 컴파일됩니다(그리고 **CXX_STANDARD**를 너무 낮게 설정하면 이는 훌륭하고 명확한 오류이다). **target_compile_features**는 예제 1의 디렉터리와 마찬가지로 **COMPILE_FEATURES** 및 **INTERFACE_COMPILE_FEATURES**를 채울 수 있다.

### 시도해보기

이 저장소를 가져와 예제로 이동해보라. 올바르게 빌드되는 CMakeList를 작성해 보자.

```
git clone https://github.com/hsf-training/hsf-training-cmake-webpage.git
cd hsf-training-cmake-webpage/code/01-simple
```

여기에 있는 파일은 다음과 같다.

* simple_lib.cpp: **MYLIB_PRIVATE** 및 **MYLIB_PUBLIC**을 정의하여 컴파일해야 한다.
* simple_example.cpp: **MYLIB_PUBLIC**을 정의하여 컴파일해야 하지만 MYLIB_PRIVATE는 정의하지 않는다.

[ **target_compile_definitions(<target> <private or public> <definition(s)>)** ][ **target_compile_definitions** ]를 사용하여 **simple_lib**에 대한 정의를 설정한다.

#### 정답

```
cmake_minimum_required(VERSION 3.15...3.25)

project(MyExample01 LANGUAGES CXX)

# 헤더를 포함하는 라이브러리는 필수는 아니지만 유저들에게 좋다.
add_library(simple_lib simple_lib.cpp simple_lib.hpp)

# The above line *did not* set the includes - we need to We can also set ., and
# it should be expanded to the current source dir

# 위 라인은 includes를 설정하지 **않았다** - . 으로 설정할 수 있는데 현재 소스 디렉토리로 확장하는 게 좋다.
target_include_directories(simple_lib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}")

# 정의 추가
target_compile_definitions(simple_lib PUBLIC MYLIB_PUBLIC)
target_compile_definitions(simple_lib PRIVATE MYLIB_PRIVATE)

# C++ 특징 필요(여기서는 적어도 C++11 이상)
target_compile_features(simple_lib PUBLIC cxx_std_11)

# 이제 executable 추가
add_executable(simple_example simple_example.cpp)

# simple-lib에 가장 중요한 링크 추가
target_link_libraries(simple_example PUBLIC simple_lib)
```

### 타겟에 설정할 수 있는 것

* **target_link_libraries**: 기타 대상; 라이브러리 이름을 직접 전달할 수도 있다.
* **target_include_directories**: 디렉터리 포함
* **target_compile_features**: **cxx_std_11**과 같이 활성화해야 하는 컴파일러 기능
* **target_compile_definitions**: 정의
* **target_compile_options**: 보다 일반적인 컴파일 플래그
* **target_link_directories**: 사용하지 말고 대신 전체 경로를 제공(CMake 3.13+)
* **target_link_options**: 일반 링크 플래그(CMake 3.13+)
* **target_sources**: 소스 파일 추가

[여기에서 더 많은 명령](https://cmake.org/cmake/help/latest/manual/cmake-commands.7.html)을 확인하자.

## 타겟의 다른 형태

타겟에 대해 매우 흥미를 느끼고, 타겟 측면에서 프로그램을 설명할 수 있는 방법을 이미 계획하고 있을 것이다. 훌륭하다! 그러나 타겟 언어가 유용한 두 가지 상황에 빠르게 직면하겠지만, 우리가 다룬 내용에 대해 약간의 유연성이 필요하다.

첫째, 개념적으로는 타겟이어야 하지만 실제로는 빌드된 구성 요소가 없는 라이브러리, 즉 "헤더-전용" 라이브러리가 있을 수 있다. CMake에서는 이를 인터페이스(interface) 라이브러리라고 부르며 작성하게 된다:

```
add_library(some_header_only_lib INTERFACE)
```

소스 파일을 추가할 필요가 없다는 점에 유의하라. 이제 여기에만 **INTERFACE** 속성을 설정할 수 있다(빌드된 구성 요소가 없기 때문에).

두 번째 상황은 사용하려는 미리 빌드된 라이브러리가 있는 경우이다. CMake에서는 이를 가져온 라이브러리라고 하며 **IMPORTED** 키워드를 사용한다. 가져온 라이브러리는 **INTERFACE** 라이브러리일 수도 있으며, 다른 라이브러리와 동일한 구문(CMake 3.11부터 시작)을 사용하여 빌드하고 수정할 수 있으며 이름에 **::**를 사용할 수 있다(간단히 다른 라이브러리의 이름을 바꾸는 **ALIAS** 라이브러리도 **::**을 가질 수 있다). 대부분의 경우 다른 곳에서 라이브러리를 가져와서 직접 만들지는 않을 것이다.

### INTERFACE IMPORTED

**가져온 인터페이스**는 어떨까? 차이점은 두 가지로 요약된다:
1. IMPORTED 타겟은 내보낼 수 없다. 타겟을 저장하면, IMPORTED 타겟을 저장할 수 없다. 타겟을 다시 생성해야 한다 (또는 다시 찾아야 한다).
2. IMPORTED 헤더 포함 디렉토리는 항상 SYSTEM으로 표시된다.

따라서 IMPORTED 타겟은 패키지의 직접적인 부분이 아닌 것을 나타내야 한다.

### 더 읽어보기

* [Modern CMake basics](https://cliutils.gitlab.io/modern-cmake/chapters/basics.html)을 기반으로 함
* [CMake's docs](https://cmake.org/cmake/help/latest/index.html)도 읽어볼 것

## 핵심사항

* 라이브러리 및 실행 파일은 타겟이다.
* 타겟에는 유용한 속성이 많이 있다.
* 타겟은 다른 타겟에 연결(링크)될 수 있다.
* 링크 시 타겟의 어떤 부분이 상속되는지 제어할 수 있다.
* 변수를 만드는 대신 INTERFACE 타겟을 만들 수 있다.
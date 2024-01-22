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

**target_include_directories(TargetA PRIVATE mydir)**를 실행하면 **TargetA**의 **INCLUDE_DIRECTORIES** 속성에 mydir이 추가됩니다. 대신 **INTERFACE** 키워드를 사용하면 **INTERFACE_INCLUDE_DIRECTORIES**가 대신 추가됩니다. **PUBLIC**을 사용하는 경우 두 속성이 동시에 추가됩니다.

## Example 2: C++ standard

There is a C++ standard property - CXX_STANDARD. You can set this property, and like many properties in CMake, it gets it’s default value from a CMAKE_CXX_STANDARD variable if it is set, but there is no INTERFACE version - you cannot force a CXX_STANDARD via a target. What would you do if you had a C++11 interface target and a C++14 interface target and linked to both?

By the way, there is a way to handle this - you can specify the minimum compile features you need to compile a target; the cxx_std_11 and similar meta-features are perfect for this - your target will compile with at least the highest level specified, unless CXX_STANDARD is set (and that’s a nice, clear error if you set CXX_STANDARD too low). target_compile_features can fill COMPILE_FEATURES and INTERFACE_COMPILE_FEATURES, just like directories in example 1.

### 시도해보기

Get this repository and go to the example. Try to write a CMakeLists that will correctly build.

```
git clone https://github.com/hsf-training/hsf-training-cmake-webpage.git
cd hsf-training-cmake-webpage/code/01-simple
```

The files here are:

* simple_lib.cpp: Must be compiled with MYLIB_PRIVATE and MYLIB_PUBLIC defined.
* simple_example.cpp: Must be compiled with MYLIB_PUBLIC defined, but not MYLIB_PRIVATE

Use [target_compile_definitions(<target> <private or public> <definition(s)>)][target_compile_definitions] to set the definitions on simple_lib

#### 정답

```
cmake_minimum_required(VERSION 3.15...3.25)

project(MyExample01 LANGUAGES CXX)

# This is the library Including the headers is not required, but is nice for
# users
add_library(simple_lib simple_lib.cpp simple_lib.hpp)

# The above line *did not* set the includes - we need to We can also set ., and
# it should be expanded to the current source dir

target_include_directories(simple_lib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}")

# Adding definitions
target_compile_definitions(simple_lib PUBLIC MYLIB_PUBLIC)
target_compile_definitions(simple_lib PRIVATE MYLIB_PRIVATE)

# Require a C++ feature (here: at least C++11)
target_compile_features(simple_lib PUBLIC cxx_std_11)

# Now add the executable
add_executable(simple_example simple_example.cpp)

# Adding the all-important link to simple-lib
target_link_libraries(simple_example PUBLIC simple_lib)
```

### INTERFACE IMPORTED

What about INTERFACE IMPORTED? The difference comes down to two things:
1. IMPORTED targets are not exportable. If you save your targets, you can’t save IMPORTED ones - they need to be recreated (or found again).
2. IMPORTED header include directories will always be marked as SYSTEM.

Therefore, an IMPORTED target should represent something that is not directly part of your package.

### 더 읽어보기

* [Modern CMake basics](https://cliutils.gitlab.io/modern-cmake/chapters/basics.html)을 기반으로 함
* [CMake's docs](https://cmake.org/cmake/help/latest/index.html)도 읽어볼 것

## 핵심사항

* Libraries and executables are targets.
* Targets have lots of useful properties.
* Targets can be linked to other target.
* You can control what parts of a target get inherited when linking.
* You can make INTERFACE targets instead of making variables.

---
layout: article
title: More Modern CMake - Project Structure
tags: CMake
permalink: /more-modern-cmake-project-structure
---

# 프로젝트 구조

## Overview

* 질문
  * 내 프로젝트는 어떤 모습이어야 할까?

* 목표
  * 프로젝트 구조에 대한 몇 가지 모범 사례를 알아보자.

이 섹션에서는 [code/03-structure](https://hsf-training.github.io/hsf-training-cmake-webpage/code/03-structure)의 프로젝트를 살펴보자.

```
code/03-structure/
├── CMakeLists.txt
├── README.md
├── apps
│   ├── CMakeLists.txt
│   └── app.cpp
├── cmake
│   └── FindSomeLib.cmake
├── docs
│   ├── CMakeLists.txt
│   └── mainpage.md
├── include
│   └── modern
│       └── lib.hpp
├── src
│   ├── CMakeLists.txt
│   └── lib.cpp
└── tests
    ├── CMakeLists.txt
    └── testlib.cpp
```

먼저 기본 [CMakeLists.txt](https://hsf-training.github.io/hsf-training-cmake-webpage/code/03-structure/CMakeLists.txt) 파일을 살펴보자. 이것은 CMake 3.14의 멋진 프로젝트 파일의 예이므로 잠시 동안 즐기자. 이제 구체적인 내용을 살펴보자!

```
# 3.15에서 동작하며 3.21을 통해 테스트되었다
cmake_minimum_required(VERSION 3.15...3.25)

# 프로젝트 이름과 몇 가지 유용한 설정. 다른 명령으로 그 결과를 가져올 수 있다
project(
  ModernCMakeExample
  VERSION 0.1
  DESCRIPTION "An example project with CMake"
  LANGUAGES CXX)

# 메인 프로젝트인 경우에만 이 작업을 수행하고 
# add_subdirectory를 통해 포함된 경우에는 수행하지 않는다

if(CMAKE_PROJECT_NAME STREQUAL PROJECT_NAME)

  # 선택적으로 CMAKE_CXX_STANDARD와 같은 항목을 설정한다
  # 여기에서 CMAKE_POSITION_INDEPENDENT_CODE 이다

  # -std=g++xx 대신 -std=c++xx 사용한다
  set(CMAKE_CXX_EXTENSIONS OFF)

  # IDE에서 폴더를 잘 지원한다
  set_property(GLOBAL PROPERTY USE_FOLDERS ON)

  # 메인 app인 경우에만 테스트가 가능하다
  # 이 작업은 메인 CMakeLists에 있어야 하는 enable_testing을 호출하므로 메인 CMakeLists에서 수행해야 한다
  include(CTest)

  # Docs는 메인 app 인 경우에만 사용할 수 있다
  find_package(Doxygen)
  if(Doxygen_FOUND)
    add_subdirectory(docs)
  else()
    message(STATUS "Doxygen not found, not building docs")
  endif()
endif()

# FetchContent added in CMake 3.11, downloads during the configure step
# CMake 3.11에 추가된 FetchContent는 구성(configure) 단계에서 다운로드된다
# FetchContent_MakeAvailable은 CMake 3.14까지 추가되지 않았다
include(FetchContent)

# Accumulator 라이브러리 - 이것은 헤더일 뿐이므로, git submodule 또는 FetchContent로 대체될 수 있다.
find_package(Boost REQUIRED)
# Boost::boost / Boost::headers 추가 (최신은 FindBoost / BoostConfig 3.15 이름)

# 포맷 라이브러리, fmt::fmt 추가 항상 태그가 아닌 전체 git 해시를 사용하여 재컴파일하는 것이 더 안전하고 빠르다
FetchContent_Declare(
  fmtlib
  GIT_REPOSITORY https://github.com/fmtlib/fmt.git
  GIT_TAG 8.0.1)
FetchContent_MakeAvailable(fmtlib)

# 컴파일된 라이브러리 코드는 여기에 있다
add_subdirectory(src)

# 실행 가능한 코드는 여기에 있다
add_subdirectory(apps)

# 메인 app인 경우에만 테스트 가능
if(BUILD_TESTING)
  add_subdirectory(tests)
endif()
```

### 프로젝트 코드 보호

이것을 메인 프로젝트로 빌드하는 경우에만 의미가 있는 프로젝트 부분은 보호되며, 이를 통해 프로젝트가 **add_subdirectory**를 사용하여 더 큰 마스터 프로젝트에 포함될 수 있다.

### 메인 CMakeLists에서 처리되는 테스트

하위 디렉터리에서 **enable_testing**을 실행할 수 없기 때문에(**include(CTest)**), 메인 CMakeList에서 테스트를 위한 약간의 설정을 해야한다. 또한 **BUILD_TESTING**은 메인 프로젝트가 아닌 이상 테스트를 활성화하지 않다.

### 패키지 찾기

메인 CMakeList에서 패키지를 찾은 다음 하위 디렉터리에서 사용한다. **cmake/find_pakages.cmake**와 같이 포함된 파일에 넣을 수도 있다. CMake가 충분히 새로운 경우 find packages 명령을 사용하여 하위 디렉터리를 추가할 수도 있지만 그렇게 하려면 사용 가능하게 하려는 타겟에 **IMPORTED_GLOBAL**을 설정해야 한다. 중소 규모 프로젝트의 경우 첫 번째 옵션이 가장 일반적이며 대규모 프로젝트에서는 두 번째 옵션(최근에)을 사용한다.

여기의 모든 찾기 패키지는 가져온 타겟을 제공한다. 가져온 타겟이 없다면 하나 만든다. **find_package** 명령 바로 다음 줄 뒤에 원시 변수를 사용하면 안된다. **SYSTEM**을 추가하는 것을 잊어버리는 것을 포함하여 가져온 타겟을 만들지 않으면 저지르기 쉬운 몇 가지 실수가 있으며 검색 순서가 더 낫다(특히 CMake 3.12 이전).

이 프로젝트에서는 새로운 [FetchContent](https://cmake.org/cmake/help/latest/module/FetchContent.html)(3.11/3.14)를 사용하여 여러 종속성을 다운로드한다. 일반적으로 나는 **/extern**에 있는 git 하위 모듈을 선호한다.

### Source

이제 **add_subdirectory** 명령을 따라 라이브러리가 생성된 src 폴더를 확인하자.

src/CMakeLists.txt
```
# 헤더는 선택 사항이며 add_library에 영향을 주지 않는다. 
# 하지만 add_library에 나열되지 않으면 IDE에 표시되지 않는다.

# 선택적으로 glob(CMake 3.12 이상에만 해당) : 
# file(GLOB HEADER_LIST CONFIGURE_DEPENDS "${ModernCMakeExample_SOURCE_DIR}/include/modern/*.hpp")
set(HEADER_LIST "${ModernCMakeExample_SOURCE_DIR}/include/modern/lib.hpp")

# 자동 라이브러리 만들기 - 사용자 설정에 따라 정적 또는 동적으로 된다.
add_library(modern_library lib.cpp ${HEADER_LIST})

# 우리에게는 이 디렉토리가 필요하며, 우리 라이브러리의 사용자에게도 필요할 것이다.
target_include_directories(modern_library PUBLIC ../include)

# 이는 (헤더만) boost에 의존한다.
target_link_libraries(modern_library PRIVATE Boost::boost)

# 이 라이브러리의 모든 사용자는 최소한 C++11이 필요하다.
target_compile_features(modern_library PUBLIC cxx_std_11)

# IDE는 헤더를 좋은 위치에 배치해야 한다.
source_group(
  TREE "${PROJECT_SOURCE_DIR}/include"
  PREFIX "Header Files"
  FILES ${HEADER_LIST})
```
헤더는 **add_library** 명령의 소스와 함께 나열된다. 이것은 CMake 3.11+에서 수행하는 또 다른 방법일 것이다:

```
add_library(modern_library)
target_sources(modern_library
  PRIVATE
    lib.cpp
  PUBLIC
    ${HEADER_LIST}
)
```

**target_include_directories**를 사용해야 한다; 소스에 헤더를 추가하는 것만으로는 CMake에게 올바른 포함 디렉토리가 무엇인지 알 수 없다.

또한 적절한 타겟으로 **target_link_libraries**를 설정한다.

### App

이제 **apps/CMakeLists.txt**를 보자. 라이브러리를 사용하기 위한 모든 다리 작업이 라이브러리 타겟으로 이루어졌기 때문에 이 작업은 매우 간단한다.

apps/CMakeLists.txt
```
add_executable(app app.cpp)
target_compile_features(app PRIVATE cxx_std_17)

target_link_libraries(app PRIVATE modern_library fmt::fmt)
```

### Docs and Tests
**Docs** 및 **Tests**의 **CMakeLists.txt** 자유롭게 살펴보자.

docs/CMakeLists.txt
```
set(DOXYGEN_EXTRACT_ALL YES)
set(DOXYGEN_BUILTIN_STL_SUPPORT YES)

doxygen_add_docs(docs modern/lib.hpp "${CMAKE_CURRENT_SOURCE_DIR}/mainpage.md"
                 WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}/include")
```

tests/CMakeLists.txt
```
# Testing library
FetchContent_Declare(
  catch2
  GIT_REPOSITORY https://github.com/catchorg/Catch2.git
  GIT_TAG v2.13.10)
FetchContent_MakeAvailable(catch2)
# Catch2::Catch2 추가

# 먼저 테스트를 실행 파일로 추가해야 한다.
add_executable(testlib testlib.cpp)

# 테스트에서는 C++17을 사용한다.
target_compile_features(testlib PRIVATE cxx_std_17)

# Catch2 테스트 라이브러리뿐만 아니라 메인 라이브러리에도 연결되어야 한다.
target_link_libraries(testlib PRIVATE modern_library Catch2::Catch2)

# 테스트를 등록하면 ctest 및 make test가 이를 실행한다. 
# 예제를 실행하고 출력을 확인할 수도 있다.
add_test(NAME testlibtest COMMAND testlib) # Command can be a target
```

### 더 읽어보기

* [Modern CMake basics](https://cliutils.gitlab.io/modern-cmake/chapters/basics.html)을 기반으로 함

## 핵심사항

* 프로젝트는 잘 구성되어야 한다.
* 하위 프로젝트 CMakeList는 테스트 등에 사용된다.
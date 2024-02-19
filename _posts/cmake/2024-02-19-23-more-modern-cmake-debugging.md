---
layout: article
title: More Modern CMake - Debugging  
tags: CMake
permalink: /more-modern-cmake-debugging
---

# Debugging

## Overview

* 질문
  * 모든 것을 어떻게 디버깅할까?

* 목표
  * CMake에서 문제를 찾는 방법을 알아보기
  * 디버깅을 위해 빌드를 설정하는 방법을 알아보기

CMake를 사용하면 디버깅이 쉽다. 우리는 CMake 코드 디버깅과 C++ 코드 디버깅: 두 가지 형태의 디버깅을 다룰 것이다.

## CMake 디버깅

먼저 CMakeLists 또는 기타 CMake 파일을 디버깅하는 방법을 살펴보자.

### 변수 출력하기

Cmake에서 print 문의 시간에 따른 방법은 다음과 같다:

```
message(STATUS "MY_VARIABLE=${MY_VARIABLE}")
```

그러나 내장된 모듈을 사용하면 이 작업이 더욱 쉬워진다:

```
include(CMakePrintHelpers)
cmake_print_variables(MY_VARIABLE)
```

속성을 인쇄하고 싶다면, 이것이 훨씬 더 좋다! 각 타겟(**SOURCES**, **DIRECTORIES**, **TESTS** 또는 **CACHE_ENTRIES** 와 같은  다른 항목의 속성들 - 어떤 이유로 잃어버린 것 같은 전역 속성들) 중 속성을 하나씩 가져오는 대신, 간단히 나열하고 직접 인쇄할 수 있다:

```
cmake_print_properties(
    TARGETS my_target
    PROPERTIES POSITION_INDEPENDENT_CODE
)
```

#### 경고

**SOURCES**는 함수의 **SOURCES** 키워드와 충돌하므로 실제로 액세스할 수 없다.

### 실행 추적

CMake 파일에서 정확히 무슨 일이 일어나는지, 언제 일어나는지 지켜보고 싶은가? **--trace-source="filename"** 기능은 환상적이다. 사용자가 제공한 파일에서 실행되는 모든 행이 실행 시 화면에 표시되므로 무슨 일이 일어나고 있는지 정확하게 따라갈 수 있다. 관련 옵션도 있지만, 결과에 묻혀버리는 경향이 있다.

#### 빌드 주시하기

다음을 시도해보자. code/04-debug 폴더로 이동하여 추적 모드를 설정해 보겠다.

```
cmake -S . -B build --trace-source=CMakeLists.txt
```

**--trace-expand**도 추가해보자. 차이점은 무엇인가? **--trace-source=CMakeLists.txt**를 **--trace**로 바꾸는 것은 어떤가?

### 호출 정보 찾기

CMake 스크립트는 종속 라이브러리, 실행 파일 등을 검색할 수 있다. 이에 대한 자세한 내용은 다음 섹션에서 설명한다.

지금은 현재 예제에서 CMake가 **find_...** 위치를 검색하는 곳을 살펴본다. **--debug-find**(CMake 3.17+)를 추가하여 cmake 실행 도중 표준 오류로 추가 검색 호출 정보를 출력할 수 있다.

또는 **CMakeLists.txt** 섹션 주위에 CMAKE_FIND_DEBUG_MODE를 설정하여 디버그 출력을 특정 영역으로 제한할 수 있다.

## C++ 디버깅

C++ 디버거를 실행하려면, 빌드에서 여러 플래그를 설정해야 한다. CMake는 "build types"를 통해 이를 수행한다. 전체 디버깅을 위해 **CMAKE_BUILD_TYPE=Debug**를 사용하여 CMake를 실행하거나, 추가 디버그 정보가 포함된 릴리스 빌드를 위해 **RelWithDebInfo**를 실행할 수 있다. 또한 최적화된 릴리스 빌드를 위해 **Release**를 사용하거나, 최소 사이즈 릴리스를 위해 **MinSizeRel**을 사용할 수도 있다(나는 사용한 적이 없다).

#### 디버그 예제

C++ 코드

```
#include "simple_lib.h"

#include <math.h>

/// Factorial function. Note that int has a maximum of 12!, and long 20!
int factorial(int a) {
    return 0 == a ? 1 : a * factorial(a - 1);
}

/// Approximate the sin function.
///
/// Uses the formula:
///   x - x³/3! + x⁵/5! - ···
///
double my_sin(double x) {
    int i;
    double sign;
    double value = 0;

    // Code has a bug
    for(i=1; i<12; i+=2) {
        sign = (i % 2 ? -1 : 1);
        value += sign * pow(x,i) / factorial(i);
    }

    return value;
}
```

**code/04-debug**로 이동하여 디버그 모드로 빌드해보자. 프로그램에 버그가 있다. 디버거에서 한번 해보자.

```
cmake -S . -B build-debug -DCMAKE_BUILD_TYPE=Debug
cmake --build build-debug
gdb build-debug/simple_example
```

이제 **my_sin**에 문제가 있다고 생각하므로, **my_sin**에 중단점을 설정해 본다. 왼쪽에는 gdb 명령을, 오른쪽에는 lldb 명령을 제공한다.

```
# GDB                # LLDB
break my_sin         breakpoint set --name my_sin
r                    r
```

이제 sign 변수에 어떤 일이 일어나는지 살펴보자. 감시 포인트를 설정하자:

```
# GDB                # LLDB
watch sign           watchpoint set variable sign
c                    c
```

계속 실행하자(**c**). 코드에서 문제를 찾았는가?

#### 참고: math과의 링크하기

제공된 예제는 gcc와 링크할 때 **-lm**처럼 보이는 math 라이브러리 "m"과 링크되지 않으면 작동하지 않는다는 것을 알 수 있다(llvm은 링크할 필요가 없는 것 같다). "m" 라이브러리를 찾아본다:

```
# -lm이 동작하는가? (이는 find_package가 아니라 find_library라는 것을 인지한다)
find_library(MATH_LIBRARY m)
```

찾게되면 우리가 지정한 이름의 변수, 이 경우 **MATH_LIBRARY** 에 m 라이브러리의 위치가 저장된다. 동일한 **target_link_libraries** 명령을 사용하여 경로(타겟 아님)를 추가할 수 있다. 이 명령이 타겟과 원시 경로 및 링커 플래그를 모두 허용하는 것은 매우 불행한 일이지만, 이는 기록으로 남은 부분이다.

```
# -lm 이 있다면 사용하자.
if(MATH_LIBRARY)
    target_link_libraries(simple_lib PUBLIC ${MATH_LIBRARY})
endif()
```

CMake는 기본적으로 최적화나 디버그되지 않는 "빈" 빌드 유형을 사용한다. [손수](https://cliutils.gitlab.io/modern-cmake/chapters/features.html) 또는 빌드 유형을 항상 지정함으로써 이를 수정할 수 있다.

Linux의 규칙을 채택하여, 모든 빌드 유형은 환경 변수들**CFLAGS**, **CXXFLAGS**, **CUDAFLAGS** 및 **LDFLAGS**([전체 목록](https://cmake.org/cmake/help/latest/manual/cmake-env-variables.7.html#id4))에서 컴파일러 플래그를 추가한다. 이 기능은 이미 언급한 **CC**, **CXX**, **CUDACXX** 및 **CUDAHOSTCXX** 환경 변수와 함께 패키지 관리 소프트웨어에서 자주 사용된다. 그렇지 않으면, 릴리스 및 디버그 플래그를 별도로 설정할 수 있다.

## 일반적인 요구 사항

빌드에 도움이 되도록 CMake와 통합할 수 있는 몇 가지 공통 유틸리티가 있다. 다음은 몇 가지이드:

* **CMAKE_CXX_COMPILER_LAUNCHER**는 ccache와 같은, 컴파일러 실행기를 설정하여 빌드 속도를 높일 수 있다.
* **CMAKE_CXX_CLANG_TIDY**는 clang-tidy를 실행하여 코드를 정리하는 데 도움을 줄 수 있다.
* **CMAKE_CXX_CPPCHECK** : cppcheck
* **CMAKE_CXX_CPPLINT** : cpplint
* **CMAKE_CXX_INCLUDE_WHAT_YOU_USE** : iwyu(include what you use)

원하는 경우 빌드할 때 이를 설정할 수 있다.

## 핵심사항

* CMake 코드를 디버깅하는 방법에는 여러 가지가 있다.
* CMake는 소스 코드를 디버깅하고 프로파일링하는 데 도움이 된디.

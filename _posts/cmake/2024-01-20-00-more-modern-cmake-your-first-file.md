---
layout: article
title: More Modern CMake - Your first CMakeLists.txt file
tags: CMake
permalink: /more-modern-cmake-your-first-file
---

# Your first CMakeLists.txt file

## Overview

* 질문
  * 내 CMakeLists에서 얼마나 최소화할 수 있는가?

* 목표
  * **cmake_minimum_version**의 깊은 의미를 이해하자.
  * project 설정 방법을 알아두자.
  * 적어도 하나의 타겟을 만드는 방법을 알아두자.

## CMakeLists 파일 작성

다음 파일은 그 다음 예에 적합하다 :
```
/* simple.c or simple.cpp */
#include <stdio.h>

int main() {
    printf("Hello, World!\n");
    return 0;
}
```

### 시작하기

이것은 가장 간단한 **CMakeLists.txt** 이다.

```
cmake_minimum_required(VERSION 3.15)

project(MyProject)

add_executable(myexample simple.cpp)
```

세 줄을 살펴보자 :

1. cmake_minimum_required 명령어는 빌드가 CMake의 나열된 버전에 있는 것과 정확히 똑같은 정책을 설정한다. 즉, CMake는 다른 빌드으로 생성할 수 있는 모든 기능에 대해 사용자가 요청한 버전으로 "자체적으로 낮춘다". 이로 인해 CMake는 거의 완벽하게 이전 버전과 호환된다.
2. 프로젝트를 진행 중이어야 하며 최소한 이름이 필요하다. CMake는 LANGUAGE를 제공하지 않으면 CXX(C++) 및 C 혼합 프로젝트를 가정한다.
3. 흥미로운 작업을 수행하려면 최소한 하나의 라이브러리나 실행 파일이 필요하다. 여기서 만드는 "무엇"을 "타겟(target)"이라고 하며, 실행 파일/라이브러리는 기본적으로 이름이 동일하고 프로젝트에서 고유해야 한다. 프로그램에는 add_executable을 사용하고, 라이브러리에서는 add_library를 사용한다.

이러한 명령에 제공할 수 있는 몇 가지 추가 인수가 있다:

```
cmake_minimum_required(VERSION 3.15...3.25)

project(MyProject
  VERSION
    1.0
  DESCRIPTION
    "Very nice project"
  LANGUAGES
    CXX
)

add_executable(myexample simple.cpp)
```

1. 버전 범위를 지정할 수 있다 - 이렇게 하면 정책이 해당 범위에서 지원되는 가장 높은 값으로 설정된다. 일반적으로, 여기에서 테스트해 본 가장 높은 버전을 설정해라.
2. 프로젝트에는 버전, 설명 및 언어를 가질 수 있다.
3. 공백은 중요하지 않다. 명확하고 예쁘거나 [cmake-format](https://cmake-format.readthedocs.io/en/latest/)을 사용하라.


### 시도해보기

위와 유사한 CMakeLists.txt를 사용하여 예제 코드를 빌드하고 실행해본다.

```
git clone https://github.com/hsf-training/hsf-training-cmake-webpage.git
cd hsf-training-cmake-webpage/code/00-intro
```

#### 정답

```
# 이것은 모든 CMakeLists에 필요합니다. 적절한 최소 버전과 범위를 선택하자.
cmake_minimum_required(VERSION 3.15...3.25)

# 우리는 우리가 원하는 것으로 프로젝트를 지정할 수 있고 
# 언어(들)을 적으면 기본 C + CXX 을 피할 수 있다.
project(MyExample00 LANGUAGES C)

# 실행가능한 타겟이 필요하다.
add_executable(simple_example simple.c)
```

### 더 읽어보기

[Modern CMake basics](https://cliutils.gitlab.io/modern-cmake/chapters/basics.html)을 기반으로 함.

## 핵심사항

* cmake_minimum_version 설정은 깊은 의미를 갖는다.
* project 설정 라인이 필요하다.
* 흥미로운 일을 하려면 하나 이상의 타겟(target)를 준비해야 합니다.

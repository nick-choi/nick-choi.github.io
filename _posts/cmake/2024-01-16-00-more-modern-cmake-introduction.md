---
layout: article
title: More Modern CMake - Introduction
tags: CMake
permalink: /more-modern-cmake-introduction
---

# Introduction

## Overview

* 질문
  * 빌드 시스템(Build System)과 빌드 시스템 생성기(Build System Generator)의 차이점은 무엇인가?

* 목표
  * 빌드 시스템 및 빌드 시스템 생성기에 대해 알아본다
  * CMake가 사용되는 이유를 이해한다.
  * 최신 CMake가 더 좋다.


코드를 빌드하는 것은 어렵다. 코드의 각 부분을 빌드하려면 긴 명령어가 필요하다. 그리고 코드의 많은 부분에서 이 작업을 수행해야 한다.

그래서 사람들은 **빌드 시스템**을 생각해냈다. 여기에는 종속성을 설정하는 방법(예: 파일 B를 빌드하려면 파일 A를 빌드해야 함)과 각 파일 또는 파일 유형을 빌드하는 데 사용되는 명령을 저장하는 방법이 있었다. 이는 (주로) 언어 독립적이므로 거의 모든 빌드를 설정할 수 있다. 원하는 경우 make를 사용하여 LaTeX 문서를 작성할 수 있다. 몇가지 일반적인 빌드 시스템에는 make(전통적인 널리 사용되는 시스템), ninja(빌드 시스템 생성기 시대에 설계된 Google의 최신 시스템), Invoke(Python 시스템) 및 rake(Ruby make, Ruby 사용자를 위한 좋은 구문)가 포함된다.

그러나 이는 다음과 같다.
* 대부분 손으로 코딩 : 적절한 명령을 모두 알아야 한다.
* 플랫폼/컴파일러에 따라 다름: 컴파일러마다 명령어를 작성해야 한다.
* 종속성을 인식하지 못함: 라이브러리가 필요한 경우, 경로 등을 처리해야 한다.
* 확장하기가 어려움; 대신 IDE를 사용하고 싶다면 행운을 빈다.

빌드 시스템 생성기를 보자(간단히 설명하기 위해 BSG로 표시). 이들은 프로그래밍 언어 빌드의 개념을 이해한다. 일반적으로 일반적인 컴파일러, 언어, 라이브러리 및 출력 형식을 지원한다. 이는 보통 빌드 시스템(또는 IDE) 파일을 작성한 다음 실제 빌드를 수행하도록 한다. 가장 인기 있는 BSG는 CMake(Cross-Platform Make) 이다. 하지만 방금 보듯이 실제로는 make와 같은 카테고리가 아니다. 다른 BSG로는 Autotools(오래되고 유연성이 없음), Bazel(Google 제공), SCons(이전 Python 시스템), Meson(신형 Python 시스템, 매우 독선적) 등이 있다. 그러나 CMake는 IDE, 라이브러리 및 컴파일러를 통해 비교할 수 없는 지원을 제공한다. 또한 소규모 프로젝트에서 쉽게 선택할 수 있고(어쨌든 모던 CMake), CERN 실험과 같은 대규모 프로젝트에서 수천 개의 모듈에 사용할 수 있어 확장성이 매우 좋다.

CMake와 Make 모두 Rake, SCon 등과 같이 기존 언어로 만들어진 게 아니라 사용자 정의 언어라는 점에 주목해라. 언어를 통합하는 것은 좋지만, 외부 언어를 설치하고 구성해야 한다는 요구 사항이 너무 높아 일반적으로 사용하기에는 충분하지 않았다.

요약하면 다음과 같은 경우 CMake를 사용해야 한다.
* 하드 코딩 경로를 피하고 싶은 경우
* 두 대 이상의 컴퓨터에서 패키지를 빌드해야할 경우
* CI(지속적 통합)를 사용하고 싶은 경우
* 다양한 OS를 지원해야할 경우(어쩌면 Unix 버전일 수도 있음)
* 여러 컴파일러를 지원하고 싶은 경우
* IDE를 사용하고 싶지만 항상 그렇지는 않을 경우
* 플래그나 명령이 아닌 프로그램이 논리적으로 어떻게 구성되어 있는지 설명하고 싶은 경우
* 라이브러리를 이용하고 싶은 경우
* Clang-Tidy와 같은 도구를 사용하여 코딩을 돕고 싶은 경우
* 디버거를 사용하려는 경우

# (More) Modern CMake

CMake는 2000년경에 도입된 이후 정말 극적으로 변화했다. 그리고 2.8이 되었을 때 많은 Linux 배포 패키지 관리자에서 사용할 수 있었다. 하지만 이는 종종 환경에 "기본적으로 사용 가능한" 정말 오래된 버전의 CMake가 있음을 의미한다. 최신 CMake에 맞게 업그레이드하고 설계하라. 빌드 시스템을 작성하거나 디버깅하는 것을 좋아하는 사람은 아무도 없다. 최신 버전을 사용하면 빌드 시스템 코드를 절반 이하로 줄일 수 있고 버그를 줄이고, 외부 종속 항목과 더 효과적으로 통합할 수 있다. CMake 설치는 한 줄이면 충분하며 sudo 액세스가 필요하지 않다. 자세한 내용은 [여기](https://cliutils.gitlab.io/modern-cmake/chapters/intro/installing.html)를 참조하라.

왠지 이해하기 어렵기 때문에 더 명확하게 외쳐보겠다. **모던 CMake를 작성하면 빌드 문제가 발생할 가능성이 줄어든다.** CMake가 제공하는 도구는 여러분이 직접 작성하려고 하는 도구보다 더 좋다. CMake는 여러분보다 더 많은 상황에서 더 많은 컴파일러와 함께 작동한다. 플래그를 추가하려고 하면 일부 컴파일러나 OS에서는 잘못된 결과를 얻을 가능성이 있지만 CMake가 제공하는 도구를 대신 사용할 수 있다면, 올바른 플래그를 추가하는 것은 CMake의 몫이지 당신의 몫이 아니다.

## 모던 CMake의 예
* 잘못된 2.8 스타일 CMake: C++11 플래그를 수동으로 추가한다. 이는 컴파일러에 따라 다르며 CUDA와 다르며 최소 버전이 아닌 설정된 버전으로 고정된다.

* CMake 3.1+가 필요한 경우 **CXX_STANDARD**를 설정할 수 있지만 최종 타겟에만 설정할 수 있다. 또는 개별 C++11 및 C++14 기능에 대한 **compile_features**를 수동으로 나열할 수 있으며, 이를 사용하는 모든 타겟은 최소한 해당 수준으로 설정된다.

* CMake 3.8+가 필요한 경우 여러 기능을 수동으로 나열하는 대신 **compile_features**를 사용하여 **cxx_std_11**과 같은 최소 표준 수준을 설정할 수 있다. 이는 C++17 이상 C++20 및 C__23에만 사용되었다.

# 2023년 최소한의 선택

로컬에서 실행해야 하는 최소 CMake와 코드를 사용하는 사람들을 위해 지원해야 하는 최소 버전은 무엇일까? 이 글을 읽고 있다면 CMake의 마지막 몇 가지 버전에서 릴리스를 얻을 수 있을 것이다. 그렇게 하면 개발이 더 쉬워질 것이다. 지원을 위해 최소 버전을 선택하는 두 가지 방법이 있다. 즉, 추가된 기능(개발자가 관심을 갖는 부분)을 기반으로 하거나 사전 설치된 일반적인 CMake(사용자가 관심을 갖는 부분)를 기반으로 한다.

지원하는 가장 오래된 컴파일러 버전보다 오래된 최소 버전을 선택하지 말라. CMake는 항상 최소한 컴파일러만큼 새로운 것이어야 한다.

## 선택할 최소 항목 - OS 지원:

* 3.4: 최소한의 수준. 절대 이보다 낮게 설정하지 마라.
* 3.7: Debian의 오래된 Stable.
* 3.10: Ubuntu 18.04.
* 3.11: CentOS 8(단, EPEL 또는 AppSteams 사용)
* 3.13: Debian Stable.
* 3.16: Ubuntu 20.04.
* 3.19: 최초로 Apple Silicon을 지원.
* 최신: pip/conda-forge/homebew/chocolaty 등

## 선택할 최소 항목 - 기능:

* 3.8: C++ 메타 기능, CUDA 등 다양한 기능
* 3.11: 가져온 인터페이스 설정, 더 빨라짐, FetchContent, IDE의 COMPILE_LANGUAGE
* 3.12: C++20, cmake --build build -j N, SHELL:, FindPython
* 3.14/3.15: CLI, FindPython 업데이트
* 3.16: Unity 빌드/프리컴파일된 헤더, CUDA 메타 기능
* 3.17/3.18: 훨씬 더 많은 CUDA, 메타프로그래밍
* 3.20: C++23, CUDARCHS, IntelLLVM, NVHPC
* 3.21: 다양한 메시지 유형, MSVC 2022, C17 & C23, HIP, MSYS
* 3.24: 다운로드와 패키지 찾기 통합, --fresh
* 3.25: C++26 지원, CUDA용 LTO

# 다른 소스들

웹에서 좋은 정보를 찾을 수 있는 다른 곳도 있다. 그 중 일부는 다음과 같다.

* [Modern CMake](https://cliutils.gitlab.io/modern-cmake/): 이 튜토리얼의 출처가 되는 책.
* [The official help](https://cmake.org/cmake/help/latest/): 정말 놀라운 문서이다. 잘 정리되어 있고 검색 기능이 뛰어나며 상단에서 버전을 전환할 수 있다. 이 책이 채우려고 하는 훌륭한 "모범 튜토리얼"이 없을 뿐.
* [Effective Modern CMake](https://gist.github.com/mbinna/c61dbb39bca0e4fb7d1f73b0d66a4fd1): 해야 할 일과 하지 말아야 할 일의 훌륭한 목록.
* [Embracing Modern CMake](https://steveire.wordpress.com/2017/11/05/embracing-modern-cmake/): 용어에 대한 좋은 설명이 포함된 게시물.
* [It’s time to do CMake Right](https://pabloariasal.github.io/2018/02/19/its-time-to-do-cmake-right/): 모던 CMake 프로젝트를 위한 훌륭한 모범 사례 모음.
* [The Ultimate Guide to Modern CMake](https://rix0r.nl/blog/2015/08/13/cmake-guide/): 비슷한 의도를 지닌 약간 오래된 게시물.
* [More Modern CMake](https://youtu.be/y7ndUhdQuU8): CMake 3.12+를 추천하는 Meeting C++ 2018의 훌륭한 프레젠테이션. 이 강연에서는 CMake 3.0+를 “Modern CMake” 및 CMake 3.12+ “More Modern CMake”라고 칭한다.
* [toeb/moderncmake](https://github.com/toeb/moderncmake): 프로젝트 구성을 통한 구문 소개와 함께 CMake 3.5+에 대한 멋진 프레젠테이션 및 예제

# 핵심사항

* 빌드 시스템은 타겟을 빌드하는 방법을 정확하게 설명한다.
* 빌드 시스템 생성기는 일반적인 관계를 설명한다.
* 모던 CMake는 더 간단하며 빌드 문제가 발생할 가능성을 줄인다.

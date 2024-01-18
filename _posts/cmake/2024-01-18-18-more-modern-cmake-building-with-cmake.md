---
layout: article
title: More Modern CMake - Building with CMake
tags: CMake
permalink: /more-modern-cmake-build-with-cmake
---

# Building With CMake

## Overview

* 질문
  * 프로젝트를 어떻게 빌드하는가?

* 목표
  * CMake 설치에 대한 참조가 있다.
  * 기존 프로젝트를 빌드하는 방법을 알아보자.
  * 빌드를 사용자 정의한다.
  * 몇 가지 기본적인 디버깅을 수행하는 방법을 알아보자.

## CMake 설치

거의 모든 곳에 최신 버전의 CMake를 설치하는 데 일반적으로 한 줄 또는 두 줄에 불과하다. [CMake 설명](https://cliutils.gitlab.io/modern-cmake/chapters/intro/installing.html)을 참조.

## CMake 로 빌드하기

CMake를 작성하기 전에 CMake를 실행하여 만드는 방법을 알고 있는지 확인하겠다. 이는 거의 모든 CMake 프로젝트에 해당된다.

### Try it out

프로젝트를 하나 가져와서 빌드해 보자. 재미삼아 CLI11을 빌드해본다.

```
git clone https://github.com/CLIUtils/CLI11.git
cd CLI11
```

이제 새로 다운로드된 디렉토리에서 모던 CMake(3.14) 빌드 절차를 시도해보자.

```
cmake -S . -B build
cmake --build build
cmake --build build -t test
```

빌드 디렉터리(**-B**)가 존재하지 않을 경우 빌드 디렉터리를 만들고, 소스 디렉터리는 **-S**로 정의한다. CMake는 기본적으로 makefile을 구성하고 생성할 뿐만 아니라 모든 옵션을 기본 설정으로 설정하고 이를 빌드 디렉터리에 있는 **CMakeCache.txt**라는 파일에 캐시한다. 관례적으로 대부분의 패키지의 **.gitignore** 파일에서 무시하려면 **build**라는 단어가 있어야 한다.

그런 다음 빌드 시스템을 호출할 수 있다(2번째 줄). **make**(기본값), **ninja** 또는 IDE 기반 시스템을 사용했는지 여부에 관계없이 동일한 명령을 사용하여 빌드할 수 있다. **-j 2**를 추가하여 두 개의 코어에 빌드하거나 **-v**를 추가하여 빌드에 사용된 명령을 자세히 표시할 수 있다.

마지막으로 "test" 대상을 기본 빌드 시스템에 전달하여 여기에서 테스트를 실행할 수도 있다. **-t**(CMake 3.15 이전에는 **--target**)를 사용하면 대상을 선택할 수 있다. CMake 3.15+에는 기본 빌드 시스템을 호출하지 않고 설치를 수행하는 **cmake \<dir\> --install** 명령도 있다!

### 소스 안에서 빌드하는 것의 경고

소스 디렉토리에서 절대로 "소스 내" 빌드 - 즉, **cmake .** 를 실행하면 안된다. 소스 디렉토리를 빌드 결과물, CMake 구성 파일로 오염시키고 소스 외부 빌드를 비활성화한다. 몇 개의 패키지는 소스 디렉토리가 빌드 디렉토리 내부에 위치하는 것조차 허용하지 않는다. 그런 경우 상대 경로(**..**)를 적절히 변경해야 한다.

간단히 설명하자면, CMake는 빌드 디렉토리의 소스 디렉토리 또는 어디에서나 기존 빌드 디렉토리를 가리킬 수 있다.

### 다른 구문 선택

완전성을 위해 고전적인 방법이 보여주는 것이 좋겠다.
```
mkdir build
cd build
cmake ..
make
make test
```

여기에는 몇 가지 단점이 있다. 디렉터리가 이미 존재하는 경우 **-p**를 추가해야 하지만 Windows에서는 작동하지 않는다. 당신은 그 디렉토리 안에 있기 때문에 빌드 디렉토리 사이를 쉽게 변경할 수 없다. 라인이 더 많아지고, 빌드 디렉터리로 변경하는 것을 잊어버린 경우 **cmake ..** 대신 **cmake .** 를 사용한다. 그럴 경우 소스 디렉토리를 오염시킬 수 있다.

## 컴파일러 선택하기

Selecting a compiler must be done on the first run in an empty directory. It’s not CMake syntax per se, but you might not be familiar with it. To pick Clang:
```
CC=clang CXX=clang++ cmake -S . -B build
```

That sets the environment variables in bash for **CC** and **CXX**, and CMake will respect those variables. This sets it just for that one line, but that’s the only time you’ll need those; afterwards CMake continues to use the paths it deduces from those values.

## 생성기 선택하기

You can build with a variety of tools; **make** is usually the default. To see all the tools CMake knows about on your system, run
```
cmake --help
```

And you can pick a tool with **-G"My Tool"** (quotes only needed if spaces are in the tool name). You should pick a tool on your first CMake call in a directory, just like the compiler. Feel free to have several build directories, like **build** and **build-xcode**. You can set the environment variable **CMAKE_GENERATOR** to control the default generator (CMake 3.15+). Note that makefiles will only run in parallel if you explicitly pass a number of threads, such as **make -j2**, while Ninja will automatically run in parallel. You can directly pass a parallelization option such as **-j 2** to the **cmake --build .** command in recent versions of CMake as well.

## 옵션 설정하기

You set options in CMake with **-D**. You can see a list of options with **-L**, or a list with human-readable help with **-LH**.

## Verbose and partial builds

Again, not really CMake, but if you are using a command line build tool like **make**, you can get verbose builds:
```
cmake --build build -v
```
If you are using make directly, you can write **VERBOSE=1 make** or even **make VERBOSE=1**, and make will also do the right thing, though writing a variable after a command is a feature of **make** and not the command line in general.

You can also build just a part of a build by specifying a target, such as the name of a library or executable you’ve defined in CMake, and make will just build that target. That’s the **--target** (**-t** in CMake 3.15+) option.

## 옵션들

CMake has support for cached options. A Variable in CMake can be marked as “cached”, which means it will be written to the cache (a file called **CMakeCache.txt** in the build directory) when it is encountered. You can preset (or change) the value of a cached option on the command line with **-D**. When CMake looks for a cached variable, it will use the existing value and will not overwrite it.

### 표준 옵션들

These are common CMake options to most packages:
* **CMAKE_BUILD_TYPE**: Pick from **Release**, **RelWithDebInfo**, **Debug**, or sometimes more.
* **CMAKE_INSTALL_PREFIX**: The location to install to. System install on UNIX would often be **/usr/local** (the default), user directories are often **~/.local**, or you can pick a folder.
* **BUILD_SHARED_LIBS**: You can set this **ON** or **OFF** to control the default for shared libraries (the author can pick one vs. the other explicitly instead of using the default, though)
* **BUILD_TESTING**: This is a common name for enabling tests, not all packages use it, though, sometimes with good reason.

### Try it out

In the CLI11 repository you cloned:

* Check to see what options are available
* Change a value; maybe set **CMAKE_CXX_STANDARD** to 14 or turn off testing.
* Configure with **CMAKE_INSTALL_PREFIX=install**, then install it into that local directory. Make sure it shows up there!

## Debugging your CMake files

We’ve already mentioned verbose output for the build, but you can also see verbose CMake configure output too. The **--trace** option will print every line of CMake that is run. Since this is very verbose, CMake 3.7 added **--trace-source="filename"**, which will print out every executed line of just the file you are interested in when it runs. If you select the name of the file you are interested in debugging (usually with a parent directory if you are debugging a CMakeLists.txt, since all of those have the same name), you can just see the lines that run in that file. Very useful!

### Try it out

Run the following from the source directory:
```
cmake build --trace-source="CMakeLists.txt"
```

### Answer this

Question: Does **cmake build** build anything?
No, the “build” here is the directory. This will configure (create build system files). To build, you would add **--build** before the directory, or use your build tool, such as **make**.

### More reading

Based on Modern [CMake intro/running](https://cliutils.gitlab.io/modern-cmake/chapters/intro/running.html)

## Key Points

* Build a project.
* Use out-of-source builds.
* Build options and customization.
* Debug a CMakeLists easily.
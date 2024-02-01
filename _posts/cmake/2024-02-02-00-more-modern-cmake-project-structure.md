---
layout: article
title: More Modern CMake - Project Structure
tags: CMake
permalink: /more-modern-cmake-project-structure
---

# 프로젝트 구조

## Overview

* 질문
  * What should my project look like?

* 목표
  * Know some best practices for project structure

For this section, we will be looking at the project in code/03-structure.

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

First, take a look at the main CMakeLists.txt file. This is an example of a nice project file in CMake 3.14, so enjoy it for a minute. Now let’s look at specifics!

```
# Works with 3.15 and tested through 3.21
cmake_minimum_required(VERSION 3.15...3.25)

# Project name and a few useful settings. Other commands can pick up the results
project(
  ModernCMakeExample
  VERSION 0.1
  DESCRIPTION "An example project with CMake"
  LANGUAGES CXX)

# Only do these if this is the main project, and not if it is included through
# add_subdirectory
if(CMAKE_PROJECT_NAME STREQUAL PROJECT_NAME)

  # Optionally set things like CMAKE_CXX_STANDARD,
  # CMAKE_POSITION_INDEPENDENT_CODE here

  # Let's ensure -std=c++xx instead of -std=g++xx
  set(CMAKE_CXX_EXTENSIONS OFF)

  # Let's nicely support folders in IDE's
  set_property(GLOBAL PROPERTY USE_FOLDERS ON)

  # Testing only available if this is the main app. Note this needs to be done
  # in the main CMakeLists since it calls enable_testing, which must be in the
  # main CMakeLists.
  include(CTest)

  # Docs only available if this is the main app
  find_package(Doxygen)
  if(Doxygen_FOUND)
    add_subdirectory(docs)
  else()
    message(STATUS "Doxygen not found, not building docs")
  endif()
endif()

# FetchContent added in CMake 3.11, downloads during the configure step
# FetchContent_MakeAvailable was not added until CMake 3.14
include(FetchContent)

# Accumulator library This is header only, so could be replaced with git
# submodules or FetchContent
find_package(Boost REQUIRED)
# Adds Boost::boost / Boost::headers (newer FindBoost / BoostConfig 3.15 name)

# Formatting library, adds fmt::fmt Always use the full git hash, not the tag,
# safer and faster to recompile
FetchContent_Declare(
  fmtlib
  GIT_REPOSITORY https://github.com/fmtlib/fmt.git
  GIT_TAG 8.0.1)
FetchContent_MakeAvailable(fmtlib)

# The compiled library code is here
add_subdirectory(src)

# The executable code is here
add_subdirectory(apps)

# Testing only available if this is the main app
if(BUILD_TESTING)
  add_subdirectory(tests)
endif()
```

### Protect project code

The parts of the project that only make sense if we are building this as the main project are protected; this allows the project to be included in a larger master project with **add_subdirectory**.

### Testing handled in the main CMakeLists

We have to do a little setup for testing in the main CMakeLists, because you can’t run **enable_testing** from a subdirectory (and thereby **include(CTest)**). Also, notice that **BUILD_TESTING** does not turn on testing unless this is the main project.

### Finding packages

We find packages in our main CMakeLists, then use them in subdirectories. We could have also put them in a file that was included, such as **cmake/find_pakages.cmake**. If your CMake is new enough, you can even add a subdirectory with the find packages commands, but you have to set **IMPORTED_GLOBAL** on the targets you want to make available if you do that. For small to mid-size projects, the first option is most common, and large projects use the second option (currently).

All the find packages here provide imported targets. If you do not have an imported target, make one! Never use the raw variables past the lines immediately following the **find_package** command. There are several easy mistakes to make if you do not make imported targets, including forgetting to add **SYSTEM**, and the search order is better (especially before CMake 3.12).

In this project, I use the new [FetchContent](https://cmake.org/cmake/help/latest/module/FetchContent.html) (3.11/3.14) to download several dependencies; although normally I prefer git submodules in **/extern**.

### Source

Now follow the **add_subdirectory** command to see the src folder, where a library is created.

Click to see src/CMakeLists.txt
The headers are listed along with the sources in the **add_library** command. This would have been another way to do it in CMake 3.11+:

```
add_library(modern_library)
target_sources(modern_library
  PRIVATE
    lib.cpp
  PUBLIC
    ${HEADER_LIST}
)
```
Notice that we have to use **target_include_directories**; just adding a header to the sources does not tell CMake what the correct include directory for it should be.

We also set up the **target_link_libraries** with the appropriate targets.

### App

Now take a look at **apps/CMakeLists.txt**. This one is pretty simple, since all the leg work for using our library was done on the library target, as it should be.

Click to see apps/CMakeLists.txt

### Docs and Tests
Feel free to look at docs and tests for their CMakeLists.txt.

docs/CMakeLists.txt
```
# Works with 3.15 and tested through 3.21
cmake_minimum_required(VERSION 3.15...3.25)

# Project name and a few useful settings. Other commands can pick up the results
project(
  ModernCMakeExample
  VERSION 0.1
  DESCRIPTION "An example project with CMake"
  LANGUAGES CXX)

# Only do these if this is the main project, and not if it is included through
# add_subdirectory
if(CMAKE_PROJECT_NAME STREQUAL PROJECT_NAME)

  # Optionally set things like CMAKE_CXX_STANDARD,
  # CMAKE_POSITION_INDEPENDENT_CODE here

  # Let's ensure -std=c++xx instead of -std=g++xx
  set(CMAKE_CXX_EXTENSIONS OFF)

  # Let's nicely support folders in IDE's
  set_property(GLOBAL PROPERTY USE_FOLDERS ON)

  # Testing only available if this is the main app. Note this needs to be done
  # in the main CMakeLists since it calls enable_testing, which must be in the
  # main CMakeLists.
  include(CTest)

  # Docs only available if this is the main app
  find_package(Doxygen)
  if(Doxygen_FOUND)
    add_subdirectory(docs)
  else()
    message(STATUS "Doxygen not found, not building docs")
  endif()
endif()

# FetchContent added in CMake 3.11, downloads during the configure step
# FetchContent_MakeAvailable was not added until CMake 3.14
include(FetchContent)

# Accumulator library This is header only, so could be replaced with git
# submodules or FetchContent
find_package(Boost REQUIRED)
# Adds Boost::boost / Boost::headers (newer FindBoost / BoostConfig 3.15 name)

# Formatting library, adds fmt::fmt Always use the full git hash, not the tag,
# safer and faster to recompile
FetchContent_Declare(
  fmtlib
  GIT_REPOSITORY https://github.com/fmtlib/fmt.git
  GIT_TAG 8.0.1)
FetchContent_MakeAvailable(fmtlib)

# The compiled library code is here
add_subdirectory(src)

# The executable code is here
add_subdirectory(apps)

# Testing only available if this is the main app
if(BUILD_TESTING)
  add_subdirectory(tests)
endif()
```

tests/CMakeLists.txt
```
# Testing library
FetchContent_Declare(
  catch2
  GIT_REPOSITORY https://github.com/catchorg/Catch2.git
  GIT_TAG v2.13.10)
FetchContent_MakeAvailable(catch2)
# Adds Catch2::Catch2

# Tests need to be added as executables first
add_executable(testlib testlib.cpp)

# I'm using C++17 in the test
target_compile_features(testlib PRIVATE cxx_std_17)

# Should be linked to the main library, as well as the Catch2 testing library
target_link_libraries(testlib PRIVATE modern_library Catch2::Catch2)

# If you register a test, then ctest and make test will run it. You can also run
# examples and check the output, as well.
add_test(NAME testlibtest COMMAND testlib) # Command can be a target
```

### 더 읽어보기

* [Modern CMake basics](https://cliutils.gitlab.io/modern-cmake/chapters/basics.html)을 기반으로 함

## 핵심사항

* Projects should be well organised.
* Subproject CMakeLists are used for tests and more.
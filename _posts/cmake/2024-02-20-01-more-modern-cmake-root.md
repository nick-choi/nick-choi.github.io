---
layout: article
title: More Modern CMake - ROOT  
date: 2024-02-20
tags: CMake
permalink: /more-modern-cmake-root
---

# Finding Packages

## Overview

* 질문
  * How do I use ROOT?

* 목표
  * Use ROOT a couple of different ways

[ROOT](https://root.cern/) is a data analysis framework.

Let’s try a couple of ROOT examples; one with the classic variable/global configure and one with the newer target method. You will need a ROOT install or a ROOT docker container to run these examples. You can use **rootproject/root:latest** to test this, which is an official Ubuntu based build. Conda-Forge ROOT + CMake would work too, if you like Conda. (ROOT has tags for lots of other base images, too).

## Example 1: UseROOT

Change to the **code/05a-root** directory. Run:

```
cmake -S . -B build
cd build
cmake --build .
root -b -q -x ../CheckLoad.C
```

```
cmake_minimum_required(VERSION 3.15...3.25)

project(RootUseFileExample LANGUAGES CXX)

# 6.16 fixes a bug in ROOT_EXE_LINKER_FLAGS, especially on macOS
find_package(ROOT 6.16 CONFIG REQUIRED)

include("${ROOT_USE_FILE}")

include_directories("${CMAKE_CURRENT_SOURCE_DIR}")

add_library(DictExample SHARED DictExample.cxx DictExample.h G__DictExample.cxx)

root_generate_dictionary(G__DictExample DictExample.h LINKDEF DictLinkDef.h)

target_link_libraries(DictExample PUBLIC ${ROOT_LIBRARIES})
```

## Example 2: Targets

Change to the **code/05b-root** directory. Run the same command above.

```
cmake_minimum_required(VERSION 3.15...3.25)

project(RootTargetExample LANGUAGES CXX)

# 6.16 fixes a bug in ROOT_EXE_LINKER_FLAGS, expecially on macOS
find_package(ROOT 6.16 CONFIG REQUIRED)

# Get the generate dictionary command from ROOT
if(ROOT_VERSION VERSION_LESS 6.20)
  include("${ROOT_DIR}/modules/RootNewMacros.cmake")
else()
  include("${ROOT_DIR}/RootMacros.cmake")
endif()

# Make the dictionary, produces G__DictExample.cxx
root_generate_dictionary(G__DictExample DictExample.h LINKDEF DictLinkDef.h)

add_library(DictExample SHARED DictExample.cxx DictExample.h G__DictExample.cxx)
target_include_directories(DictExample PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}")

# Normally you need to link to lots of ROOT:: targets, but we aren't using much
# here.
target_link_libraries(DictExample PUBLIC ROOT::Core)
```

## 핵심사항

* ROOT has a CONFIG package you can use to integrate with CMake.
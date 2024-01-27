---
layout: article
title: More Modern CMake - Variables explained
tags: CMake
permalink: /more-modern-cmake-variables-explained
---

# Variables explained

## Overview

* 질문
  * How do variables work?

* 목표
  * Learn about local variables.
  * Understand that cached variables persist across runs.
  * Know how to glob, and why you might not do it.

## Variables

For this exercise, we will just directly run a CMake Script, instead of running **CMakeLists.txt**. The command to do so is:

```
# Assuming you have a file called example.cmake:
cmake -P example.cmake
```
This way, we don’t have so many little builds sitting around.

### Local variables

Let’s start with a local variable.
```
# local.cmake
set(MY_VARIABLE "I am a variable")
message(STATUS "${MY_VARIABLE}")
```
Here we see the set command, which sets a variable, and the message command, which prints out a string. We are printing a STATUS message - there are other types (many other types in CMake 3.15+).

#### More about variables

Try the following:
* Remove the quotes in set. What happens?
* Remove the quotes in message. What happens? Why?
* Try setting a cached variable using -DMY_VARIABLE=something before the -P. Which variable is shown?

### Cached variables

Now, let’s look at cached variables; a key ingredient in all CMake builds. In a build, cached variables are set in the command line or in a graphical tool (such as **ccmake**, **cmake-gui**), and then written to a file called **CMakeCache.txt**. When you rerun, the cache is read in before starting, so that CMake “remembers” what you ran it with. For our example, we will use CMake in script mode, and that will not write out a cache, which makes it easier to play with. Feel free to look back at the example you built in the last lesson and investigate the **CMakeCache.txt** file in your build directory there. Things like the compiler location, as discovered or set on the first run, are cached.

Here’s what a cached variable looks like:
```
# cache.cmake
set(MY_CACHE_VAR "I am a cached variable" CACHE STRING "Description")
message(STATUS "${MY_CACHE_VAR}")
```
We have to include the variable type here, which we didn’t have to do before (but we could have) - it helps graphical CMake tools show the correct options. The main difference is the **CACHE** keyword and the description. If you were to run **cmake -L** or **cmake -LH**, you would see all the cached variables and descriptions.

The normal set command only sets the cached variable if it is not already set - this allows you to override cached variables with **-D**. Try:

```
cmake -DMY_CACHE_VAR="command line" -P cache.cmake
```
You can use **FORCE** to set a cached variable even if it already set; this should not be very common. Since cached variables are global, sometimes they get used as a makeshift global variable - the keyword **INTERNAL** is identical to **STRING FORCE**, and hides the variable from listings/GUIs.

Since bool cached variables are so common for builds, there is a shortcut syntax for making one using **option**:

```
option(MY_OPTION "On or off" OFF)
```
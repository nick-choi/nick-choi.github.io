---
layout: article
title: More Modern CMake - Functions in CMake
date: 2024-02-20
tags: CMake
permalink: /more-modern-cmake-functions-in-cmake
---

# Functions in CMake

## Overview

* 질문
  * How do I write my own CMake commands?

* 목표
  * Know how to make a macro or a function in CMake.

Let’s take a look at making a CMake macro or function. The only difference is in scope; a macro does not make a new scope, while a function does.

```
function(EXAMPLE_FUNCTION AN_ARGUMENT)
    set(${AN_ARGUMENT}_LOCAL "I'm in the local scope")
    set(${AN_ARGUMENT}_PARENT "I'm in the parent scope" PARENT_SCOPE)
endfunction()

example_function() # Error
example_function(ONE)
example_function(TWO THREE) # Not error

message(STATUS "${ONE_LOCAL}") # What does this print?
message(STATUS "${ONE_PARENT}") # What does this print?
```

We see the basics of functions above. You can specify required positional arguments after the name; all other arguments are set in **ARGN**; **ARGV** holds all arguments, even the listed positional ones. Since you name variables with strings, you can set variables using names. This is enough to recreate any of the CMake commands. But there’s one more thing…

## Parsing arguments

You’ll have noticed that there are conventions to calling CMake commands; most commands have all-caps keywords that take 0, 1, or an unlimited number of arguments. This handling is standardized in the cmake_parse_arguments command. Here’s how it works:

```
include(CMakePrintHelpers)

function(COMPLEX required_arg_1)
  cmake_parse_arguments(
    PARSE_ARGV 1 COMPLEX_PREFIX "SINGLE;ANOTHER" "ONE_VALUE;ALSO_ONE_VALUE"
    "MULTI_VALUES;ANOTHER_MULTI_VALUES")
  message(STATUS "ARGV=${ARGV}")
  message(STATUS "ARGN=${ARGN}")
  message(STATUS "required_arg_1=${required_arg_1}")
  message(STATUS "COMPLEX_PREFIX_SINGLE=${COMPLEX_PREFIX_SINGLE}")
  message(STATUS "COMPLEX_PREFIX_ANOTHER=${COMPLEX_PREFIX_ANOTHER}")
  message(STATUS "COMPLEX_PREFIX_ONE_VALUE=${COMPLEX_PREFIX_ONE_VALUE}")
  message(
    STATUS "COMPLEX_PREFIX_ALSO_ONE_VALUE=${COMPLEX_PREFIX_ALSO_ONE_VALUE}")
  message(STATUS "COMPLEX_PREFIX_MULTI_VALUES=${COMPLEX_PREFIX_MULTI_VALUES}")
  message(
    STATUS
      "COMPLEX_PREFIX_ANOTHER_MULTI_VALUES=${COMPLEX_PREFIX_ANOTHER_MULTI_VALUES}"
  )
  message(
    STATUS
      "COMPLEX_PREFIX_UNPARSED_ARGUMENTS=${COMPLEX_PREFIX_UNPARSED_ARGUMENTS}")
endfunction()

complex(
  something
  SINGLE
  ONE_VALUE
  value
  MULTI_VALUES
  some
  other
  values
  ANOTHER_MULTI_VALUES
  even
  more
  values)
```

Note: if you use a macro, then a scope is not created and the signature above will not work - remove the **PARSE_ARGV** keyword and the number of required arguments from the beginning, and add "${ARGN}" to the end.

The first argument after the **PARSE_ARGV** keyword and number of required arguments is a prefix that will be attached to the results. The next three arguments are lists, one with single keywords (no arguments), one with keywords that take one argument each, and one with keywords that take any number of arguments. The final argument is ${ARGN} or ${ARGV}, without quotes (it will be expanded here). If you are in a function and not a macro, you can use **PARSE_ARGV <N>** at the start of the call, where N is the number of positional arguments to expect. This method allows semicolons in the arguments.

Inside the function, you’ll find:

```
-- ARGV=something;SINGLE;ONE_VALUE;value;MULTI_VALUES;some;other;values;ANOTHER_MULTI_VALUES;even;more;values
-- ARGN=SINGLE;ONE_VALUE;value;MULTI_VALUES;some;other;values;ANOTHER_MULTI_VALUES;even;more;values
-- required_arg_1=something
-- COMPLEX_PREFIX_SINGLE=TRUE
-- COMPLEX_PREFIX_ANOTHER=FALSE
-- COMPLEX_PREFIX_ONE_VALUE=value
-- COMPLEX_PREFIX_ALSO_ONE_VALUE=
-- COMPLEX_PREFIX_MULTI_VALUES=some;other;values
-- COMPLEX_PREFIX_ANOTHER_MULTI_VALUES=even;more;values
-- COMPLEX_PREFIX_UNPARSED_ARGUMENTS=
```

The semicolons here are an explicit CMake list; you can use other methods to make this simpler at the cost of more lines of code.

### 더 읽어보기

* [Modern CMake basics/functions](https://cliutils.gitlab.io/modern-cmake/chapters/basics/functions.html)을 기반으로 함

## 핵심사항

* Functions and macros allow factorization.
* CMake has an argument parsing function to help with making functions.
---
layout: article
title: More Modern CMake - Finding Packages  
tags: CMake
permalink: /more-modern-cmake-finding-packages
---

# Finding Packages

## Overview

* 질문
  * How do I search for packages?

* 목표
  * Understand FindPackage.cmake
  * Understand PackageConfig.cmake

You can search for packages in CMake in two ways; both of them, however, use the same interface. Here’s what it would look like:

```
find_package(MyPackage 1.2)
```

This will look for a file in the **CMAKE_MODULE_PATH** that is named **FindMyPackage.cmake**. If it does not find one, it will look for a file named **MyPackageConfig.cmake** in several places, including **MyPackage_DIR** if that variable exists. You can only perform one of these searches with **MODULE** or **CONFIG**, respectively.

You can add **COMPONENTS** in some cases, if the package supports it, and you can also add **QUIET** to hide extra text, or **REQUIRED** to cause a missing package to fail the configure step.

### Aside: Environment Hints

Hinting the installation of software package that is installed outside of a system paths works can also be done with environment variables. In CMake 3.12+, individual packages locations can be hinted by setting their installation root path in [<PackageName>_ROOT](https://cmake.org/cmake/help/latest/envvar/PackageName_ROOT.html).

```
export HDF5_ROOT=$HOME/software/hdf5-1.12.0
```

Similarly, the variable **CMAKE_PREFIX_PATH** can be used to hint a list of installation root paths at once:

```
export CMAKE_PREFIX_PATH=$HOME/software/hdf5-1.12.0:$HOME/software/boost-1.74.0:$CMAKE_PREFIX_PATH
```

## FindPackage

The older method for finding packages is the FindPackage.cmake method (**MODULE**). This is a CMake or user supplied search script that knows how to look for a package. While there are some conventions here, and some tools to help, there are not many hard-and-fast requirements. A package should at least set the variable **Package_FOUND**. There are 100 or so find packages included in CMake, refer to the documentation for each.

* See the included [FindPackages](https://cmake.org/cmake/help/latest/manual/cmake-modules.7.html#find-modules) here.
* Many of the packages took a long time to add imported targets
* The old **FindPythonLibs** and **FindPythonInterp** are in the process of being replaced by **FindPython**, but you need a very new version of CMake for the new ones; 3.12 minimum, 3.15 recommended (and 3.18.2+ ideal).

## PackageConfig

The "better" way to do things is to have an installed package provide its own details to CMake; these are “CONFIG” files and come with many packages. These files can be simpler and smarter, since they don’t have to search for the package and query the options, but rather can be generated with the correct paths and options for a particular install. ROOT is an example of a package that is now providing a CONFIG file; another one that is just beginning to is Boost; while CMake includes a **FindBoost**, it has to be updated with each new Boost release, whereas **BoostConfig.cmake** can be included with each Boost release (first version in 1.70). One issue with some packages (TBB, for example) is that they may provide *optional* CONFIG files, and your packager may not have activated them.

To be clear: If you are a package author, never supply a **Find<package>.cmake**, but instead always supply a **<package>Config.cmake** with all your builds. If you are depending on another package, try to look for a Config first, and if that is not available, or often not available, then write a find package for it for your use.

## 핵심사항

* A FindPackage.cmake file can factor out package discovery for a package you don’t own.
* A PackageConfig.cmake helps others find your package.

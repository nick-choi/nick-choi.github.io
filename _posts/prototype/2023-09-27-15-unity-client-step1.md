---
layout: article
title: Unity Prototype Step1
tags: C# Unity Client Prototype
permalink: /unity-prototype-step1
---

# 1. 두 캐릭터를 그리드 안에서 이동하기
* 10x10 그리드에 두 캐릭터를 놓고 서로 한번씩 이동하기
* 단, 그리드를 넘어갈 수 없고, 두 캐릭터가 겹쳐도 안됨

![캐릭터 이동](/assets/images/prototype/prototype-unity-step1-movement.png)

## 데이터
* 드워프/전사 : 가로,세로 2칸씩 이동(파란색)
* 인간/성직자 : 가로,세로 1칸씩 이동(핫핑크색)

## 플로우
1. 드워프 선택됨
2. 해당 드워프의 이동 가능 거리가 표시
3. 이동가능한 그리드를 선택하면 드워프 이동
4. 성직자 선택됨
5. 2,3 동일하게 반복
6. 1부터 다시 시작

## 데이터구조
* 2차원 배열로 캐릭터들 위치 저장하고, 충돌판정할 것.
* 즉 데이터로만 처리하고 GameObject로 처리하지 않는다 (차후 서버 연동시에 데이터와 로직, View 분리위해서)

## 나중에...
* [미리 생성된 캐릭터들](/2023/09/25/10-basic-fantasy-pregenerated-characters.html) 데이터의 movement로 대체해서 개별 캐릭터마다 이동거리를 데이터로 처리할 계획

---
layout: article
title: Unity Prototype Step2
tags: C# Unity Client Prototype
---

# 2. 캐릭터 클래스 정의
* 프로토타입에 사용될 예제들은 페이지 마지막에 정리

```
Character
{
  Race : type // 인간,드워프
  Class : type // 전사, 성직자
  Level : uint // 레벨
  Movement : uint //이동 가능 칸수
  CurrentHitPoint : uint //현재 HP
  MaxHitPoint : uint //최대 HP
  Strength : uint // 힘, 일단 1
  AttackBonus : uint //직업과 레벨에 따로 부가 공격 보너스
  AttackRange : uint //공격범위, 근거리일 경우는 1
  ArmorClass : uint //AC, 갑옷의 방어력, 갑옷이 없을 경우 11
  WeaponType : type //한손
  WeaponDamage : uint //무기의 최대 데미지(1~WeaponDamage)
}
```

# 3. 두 캐릭터의 HP 표시하기

* Character Class에 HP 프로퍼티를 적용하고, 해당 데이터를 View에서 백분율로 각 캐릭터의 머리위에 HP Bar로 표시

![캐릭터 HP](/assets/images/prototype/prototype-unity-step2-hpbar.png)

# 4. 커맨드 메뉴 구현하기

* 해당 턴의 캐릭터에 명령을 내릴 때 이동 명령이 아니라, 이동,공격,대기 명령을 선택하여 각 명령에 맞게 실행
* 한 번의 턴에서는 3개의 명령 중 하나만 선택할 수 있으며, 선택 후 실행이 끝나면 상대방 턴으로 변경

![캐릭터 메뉴](/assets/images/prototype/prototype-unity-step2-menu.png)

## 1. 이동

* 이동 메뉴를 선택시 [이전페이지](/unity-prototype-step1) 와 동일하게 이동할 수 있는 영역이 표시됨
* 영역은 Character Class의 Movement 값을 적용하여 표시
* 영역 클릭시 해당 타일로 이동

![캐릭터 이동](/assets/images/prototype/prototype-unity-step2-move.png)

## 2. 공격

* 영역은 Character Class의 AttackRange 값을 적용하여 표시
* 영역 클릭시 아래 공격 로직을 적용

![캐릭터 공격](/assets/images/prototype/prototype-unity-step2-attack.png)

## 3. 대기

* 따로 영역 필요없이 상대방에게 턴을 넘김

# 5. 공격 적용
* 이번에는 따로 무기없이 한손, 근거리 전투로만 한정

## 명중 굴림

* 공격이 성공하는지 체크하는 로직으로 **공격자의 공격력이 상대편의 방어력(AC)보다 크면 공격 성공**
* [Basic Fantasy - 조우](/basic-fantasy/encounter#공격하기)의 공격하기 설명 참고

* 명중 굴림 성공 유무 수식
```
  Math.Rand(20) + Strength + AttackBonus >= 상대편 AC
```

## 피해

* 명중 굴림이 성공하면 WeaponDamage 굴림하여 상대편에게 피해를 주고, 이 피해는 상대편의 HP에 반영
* [Basic Fantasy - 조우](/basic-fantasy/encounter#피해)의 피해 설명 참고

* 피해 산정 수식
```
  피해 = Math.Rand(WeaponDamage) + Strength
```

* 상대편 HP 적용, 상대편 HPBar에 업데이트
```
  CurrentHitPoint = CurrentHitPoint - 피해
```

## 공격턴 마무리

* 상대편 CurrentHitPoint가 0이 되면, 게임 오버 처리

# 5. 프로토타입에 적용할 Chracter 예제 데이터
* 드워프/전사
```
Character
{
  Race : Dwarf
  Class : Fighter
  Level : 1
  Movement : 2
  CurrentHitPoint : 15
  MaxHitPoint : 15
  Strength : 2
  AttackBonus : 1
  AttackRange : 1
  ArmorClass : 11
  WeaponType : OneHand
  WeaponDamage : 6
}
```

* 인간/성직자
```
Character
{
  Race : Human
  Class : Cleric
  Level : 1
  Movement : 1
  CurrentHitPoint : 12
  MaxHitPoint : 12
  Strength : 1
  AttackBonus : 1
  AttackRange : 1
  ArmorClass : 11
  WeaponType : OneHand
  WeaponDamage : 4
}
```

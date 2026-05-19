* 동영상 리스트
    * https://www.youtube.com/watch?v=htFAeywLuNQ&list=PLNwKK6OwH7eW1n49TW6-FmiZhqRn97cRy

## 2026-05-14
* Gemini의 추천에 따라서 Part7/Part8 부터 진행할 예정

### 인터페이스 vs 델리게이트 하이브리드 설계론
* Part7의 강의는 Blueprint로 구현했는데 C++로 구현하면서 생긴 의문.
    * OnHealthChanged를 IDamageableCharacter를 통해서 전달할 것인지
    * 아니면 Delegate를 통해 Broadcast할 것인지

#### A. 인터페이스 (Interface): 공격 전달 (1:1 명령)
* 공격자가 피격자에게 대미지를 전달할 때는 인터페이스를 사용합니다. 피격 대상이 몬스터, 플레이어, 파괴 가능한 오브젝트 등 무엇이든 상관없이 동일한 함수로 명령을 내릴 수 있습니다.
    * **용도:** `TakeDamage`, `HitCheck`, `Interact` 등  
    * **특징:** 공격자는 피격자의 구체적인 클래스 타입을 알 필요가 없습니다. 오직 "대미지를 받을 수 있는가?"만 확인합니다.  
    * **실행:** `IDamageableInterface::Execute_UpdateHealthBar(...)`

#### B. 델리게이트 (Delegate): 상태 변화 알림 (1:N 방송)
* 캐릭터 내부의 데이터(HP, MP 등)가 변경되었을 때, 이를 주변 시스템(UI, 이펙트, 사운드)에 알릴 때는 델리게이트를 사용합니다.
    * **용도:** `OnHealthChanged`, `OnStaminaChanged`, `OnDeath` 등   
    * **특징:** 캐릭터는 누가 자신의 방송을 듣는지 모릅니다. 단지 "내 HP가 변했다!"라고 외칠 뿐이며, 이를 구독(Bind)한 위젯이나 시스템이 각자 반응합니다.  
    * **구현:** `DECLARE_DYNAMIC_MULTICAST_DELEGATE` (블루프린트 연동용)

### 중앙 집중식 이벤트 관리
* 개별 위젯이 각자 캐릭터 데이터를 감시하게 두지 않고, 캐릭터 블루프린트(`BP_Player` / `BP_Enemy`)가 모든 연출을 총괄하는 방식.

#### 장점
* **유지보수 통합:** 모든 연출 로직(HP바 감소, 피격 이펙트, 카메라 흔들림)이 캐릭터의 이벤트 그래프 한곳에 모여 있어 디버깅이 쉽습니다.

* **연출 순서 제어(Sequencing):** `Sequence` 노드를 통해 "이펙트 발생 -> 0.1초 뒤 HP바 감소"와 같은 정교한 타이밍 조절이 가능합니다.

* **의존성 분리:** 위젯은 순수하게 "그려주는 역할"만 수행하고, 복잡한 로직은 캐릭터나 컴포넌트가 담당합니다.

#### 실전 워크플로우 (Implementation Step)
* **C++:** `AttributeComponent`에서 HP 변화 시 델리게이트 `Broadcast` 호출.

* **BP\_Character:** `BeginPlay` 시점에 자신의 델리게이트를 구독(Bind).
    
* **Event Response:** 방송이 수신되면 `Sequence` 노드를 통해 다음을 수행:
    * `Widget Component` -> `Get User Widget Object` -> `SetPercent` (UI 업데이트)
    * `Play World Camera Shake` (타격감 연출)
    * `Spawn Emitter at Location` (피격 이펙트)

#### BeginPlay 에서 bind 하는 이유
* 안정성 (Dependency Safety)
    * **Construct (C++: Constructor / BP: Construction Script)**
        * 이 시점에는 컴포넌트들이 완전히 초기화되지 않았거나, 월드에 아직 배치만 된 상태일 수 있습니다. 특히 `Dynamic Multicast Delegate`는 객체가 완전히 생성되어 메모리에 안착한 후에 바인딩하는 것이 안전합니다.
    * **BeginPlay**
        * 게임이 실제로 시작되고 모든 컴포넌트가 준비(Register)된 직후입니다. `AttributeComponent`나 `WidgetComponent`가 서로를 확실히 인지할 수 있는 시점입니다.

* 런타임 인스턴스 보장
    * `Construction Script`는 에디터에서 액터를 배치하거나 움직일 때마다 매번 실행됩니다. 반면 **`BeginPlay`는 게임 실행 중 딱 한 번만 실행**됩니다. 델리게이트 바인딩은 런타임 중에 딱 한 번만 정확히 이루어지면 되므로 `BeginPlay`가 논리적으로 적합합니다.

## 2026-05-15
* Part7 절반 정도 봤는데 앞서 봤던 [Combat Damage System](</Ali Elzoheiry/CombatDamageSystem>)과 중복되어서 Part8으로 넘어감.

### Part7 까지의 정리
* **데이터(Data):** C++ `AttributeComponent`에서 관리 (HP, MaxHP).
* **전달(Command):** `ICombatInterface`를 통해 공격자가 피격자에게 대미지 전송.
* **방송(Broadcast):** `OnHealthChanged` 델리게이트를 통해 상태 변화 공표.
* **관리(Orchestrator):** `BP_Player/Enemy`가 `BeginPlay`에서 델리게이트를 바인딩하여 **중앙 집중식**으로 연출(UI, Ragdoll, FX) 제어.
* **UI:** `Widget Component`를 사용하되, `Get User Widget Object`를 통해 캐릭터가 직접 데이터를 밀어 넣어주는 방식.

## 2026-05-16
* Part8의 내용. 기본적으로 blueprint 강의라서 일단 듣고 있는데 다른 강의에서 선행했던 내용이 나와서 중간에서 멈추고 [How to Shoot Projectile](ShootProjectile) 강의로 넘어감.

### 1. 오늘 배운 핵심 개념들

* **머티리얼 컴파일 구조:** 일반 리소스(Compile/Save)와 달리, 머티리얼은 GPU 셰이더 코드를 빌드하는 과정이 필요하므로 반드시 `Apply(적용)`를 거쳐야 뷰포트에 반영된다는 점을 파악했습니다. 효율적인 조절을 위한 **머티리얼 인스턴스(Parameter 변환)** 개념도 짚었습니다.
  
* **애니메이션 아키텍처 규격:** 뼈대 신호(Skeleton Notify)는 애니메이션 BP(뇌)로 가고, 몽타주 신호(Montage Notify)는 캐릭터 BP(행동 제어기)로 간다는 언리얼의 구조적 분리 원칙을 이해했습니다.
  
* **언리얼의 정면(Forward) 규칙:** 엔진의 모든 컴포넌트와 무브먼트 연산에서 정면은 항상 X축(빨간색 화살표)이 기준이 된다는 절대 법칙을 확인했습니다.

* **무브먼트 컴포넌트의 우선순위:** `Projectile Movement`는 개별 메쉬의 중력 옵션(`Enable Gravity`)을 덮어쓰고 자체 `Gravity Scale`로 물리를 제어한다는 시스템 우선순위를 배웠습니다.

---

### 2. 강의보고 해결한 버그 및 트러블슈팅

| 문제 상황 | 원인 | 해결 방법 |
| --- | --- | --- |
| **새 머티리얼 적용 시 큐브가 회색으로 나옴** | 머티리얼 에디터의 `Apply` 누락 및 BP 컴포넌트 슬롯 미지정 | `Apply` 후 컴포넌트 `Element 0` 슬롯에 오버라이드하여 해결 |
| **`OnProjectileHit` 호출 시점 누락** | 강사의 과거 리소스 마이그레이션으로 인한 가이드 생략 | 충돌 컴포넌트의 `Begin Overlap` 이벤트를 커스텀 델리게이트와 직렬 연동하여 구조 완성 |
| **`MM_Rifle_Fire` 몽타주 T-Pose 버그** | 상체 전용/Additive 에셋 특성 및 5.7.4 스켈레톤 호환성 엄격화 | 버그 에셋 대신 전신 데이터가 온전한 **`MM_Attack`으로 우회하여 로직을 우선 확보**하는 현명한 판단 |
| **재시작 후 에디터 내 메쉬 증발** | 5.7+ 최신 엔진의 에셋 캐시 레퍼런스 누락 버그 | `Preview Scene Settings`에서 미리보기 메쉬를 재지정하여 복구 |
| **`Play Montage` 노드의 Notify 미작동** | 일반 `New Notify`를 사용하여 캐릭터 BP가 신호를 가로채지 못함 | 질문자님의 통찰대로 내장 클래스인 **`Montage Notify`**로 교체하고 디테일 패널에서 이름을 매핑하여 해결 |
| **큐브 장풍이 거꾸로 날아감** | 큐브 및 파티클 에셋의 정렬 축이 엔진 표준 X축과 반대였음 | 부모 Root는 두고, **자식 메쉬들만 Z축으로 회전**시켜 빨간 화살표(X축) 정면으로 정렬 완료 |
| **중력을 껐는데도 투사체가 추락함** | `Projectile Movement` 내부의 자체 중력 연산 수치 활성화 | 메쉬 옵션이 아닌 **무브먼트 컴포넌트의 `Gravity Scale`을 `0.0`으로 변경**하여 직선 비행 성공 |

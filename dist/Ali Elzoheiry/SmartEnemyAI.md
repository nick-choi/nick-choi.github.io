* 동영상 리스트
    * [https://www.youtube.com/watch?v=htFAeywLuNQ&list=PLNwKK6OwH7eW1n49TW6-FmiZhqRn97cRy](https://www.youtube.com/watch?v=htFAeywLuNQ&list=PLNwKK6OwH7eW1n49TW6-FmiZhqRn97cRy)

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

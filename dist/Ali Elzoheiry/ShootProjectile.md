* URL : [https://www.youtube.com/watch?v=hkQ9bEwpfV8](https://www.youtube.com/watch?v=hkQ9bEwpfV8)
* Smart AI 를 공부하다가 선행적으로 알아야할 발사체에 대한 blueprint 강의

## 2026-05-19
* 동영상 스크립트 전문을 gemini로 요약 정리함.
  
### Step 1: 컴포넌트 구조 설정 (Hierarchy)

* 가장 먼저 모든 투사체가 공통으로 가질 컴포넌트 구조를 설계합니다.

#### 1. **루트 컴포넌트 교체 (`Box Collision`):**
* `Box Collision`을 추가한 뒤, 이를 드래그하여 **`Default Scene Root` 위에 덮어씌워(Drop)** 새로운 루트로 지정합니다.
* *이유:* 투사체 물리와 히트 이벤트가 컴포넌트 트리의 최상위 축을 기준으로 정확하게 작동하도록 하기 위함입니다.

#### 2. **비주얼 에셋 추가 (`Static Mesh` & `Arrow`):**
* `Static Mesh`(기본 구체 등)를 추가하고, 박스 콜리전의 크기(`Box Extents`)를 메쉬 크기에 맞게 정밀하게 조절합니다.
* 에디터 뷰포트에서 발사 방향을 직관적으로 알아볼 수 있도록 `Arrow` 컴포넌트를 추가합니다 (게임 스크린에는 보이지 않음).

#### 3. **이동 컴포넌트 추가 (`Projectile Movement`):**
* 투사체에 물리적 추진력을 줄 핵심 컴포넌트를 추가합니다.

---

### Step 2: 변수 생성 및 카테고리화

* 자식 클래스나 스폰 시점에서 인스턴스마다 값을 다르게 제어할 수 있도록 핵심 변수들을 세팅합니다.

* **필수 변수 목록:**
    * `Speed` (Float) : 투사체의 속도
    * `Gravity` (Float) : 중력 계수 (직선 비행은 `0.0`, 곡사 비행은 `0.1` 이상)
    * `Target` (Actor Object Reference) : 유도 및 타겟팅용 목표물
    * `IsHoming` (Boolean) : 유도탄 여부
    * `Impact Effect` (Particle System / Niagara) : 충돌 시 터질 이펙트
    * `Impact Sound` (Sound Base) : 충돌 시 재생할 사운드

* **옵션 설정 (매우 중요):**
    * 모든 변수는 디테일 패널에서 쉽게 분류할 수 있도록 **`Projectile Settings`**, **`Effects`**, **`Sounds`** 등의 카테고리로 지정합니다.
    * `Speed`, `Gravity`, `Target`, `IsHoming` 변수는 반드시 `Instance Editable(인스턴스 편집 가능)`과 `Expose on Spawn(스폰시 노출)`을 체크합니다.

---

### Step 3: Construction Script (초기화 로직)

* 투사체가 월드에 배치되거나 스폰되는 '그 순간' 속성과 유도 설정을 무브먼트 컴포넌트에 주입합니다.

#### 1. **속도 및 중력 적용:**
* `Projectile Movement` 컴포넌트를 가져와 `Set Initial Speed`와 `Set Max Speed` 노드에 우리가 만든 `Speed` 변수를 연결합니다.
* `Set Gravity Scale` 노드에 `Gravity` 변수를 연결합니다.

#### 2. **호밍(유도) 활성화 분기 처리:**
* `Target` 변수가 Valid(유효)한지 체크하고, `IsHoming`이 `True`인지 확인합니다.
* 조건이 맞다면 `Set Is Homing Projectile`을 `True`로 켭니다.
* `Set Homing Acceleration Magnitude`(유도 가속도) 값을 설정합니다 (강의 추천값: `2000`).
* **핵심:** `Set Homing Target Component` 노드를 배치하되, `Target(액터)`의 `Get Root Component`를 추출하여 컴포넌트 형태로 입력해야 합니다.

---

### 🚀 Step 4: Event Graph - 발사 및 타겟팅 (Begin Play)

* 투사체가 스폰된 직후 실행될 로직을 구현합니다.

#### 1. **시전자 충돌 무시 (Self-Hit 방지):**
* `Begin Play`가 시작되자마자 가장 먼저 `Box Collision`을 끌어와 **`Ignore Actor while Moving`** 노드를 호출합니다.
* `Target Actor` 핀에는 `Get Owner`(또는 상황에 따라 Instigator)를 연결하여 스폰하자마자 시전자를 맞추고 터지는 버그를 차단합니다.

#### 2. **직선 타겟팅 (Homing이 아닐 때 목표 방향 바라보기):**
* `Target`이 유효한지 확인 후, 유효하다면 커스텀 이벤트(`Rotate to Target`)를 호출합니다.
* **주의:** 투사체는 `Set Actor Rotation`으로 회전시키면 무브먼트 컴포넌트에 의해 값이 덮어씌워지므로, **`Velocity(속도 벡터)`를 직접 수정**해야 합니다.
* `Get Unit Direction Vector` 노드를 사용해 `내 위치(From)`에서 `타겟 위치(To)`까지의 방향 벡터를 구한 뒤, 이를 `Speed`와 곱하기(`Multiply`)합니다.
* 그 결과값을 `Projectile Movement` 변수의 `Set Velocity`에 주입합니다.

---

### Step 5: 충돌 처리 및 파괴 (On Component Hit)

* 무언가와 부딪혔을 때 시각/청각 효과를 내고 이벤트를 전파한 뒤 사라지는 로직입니다.

#### 1. **콜리전 프리셋 설정:**
* `Box Collision`의 설정을 `Overlap All`에서 `Block All Dynamic`으로 변경하여 물체에 부딪히도록 합니다. (자식 메쉬의 콜리전은 `No Collision`으로 끕니다)

#### 2. **히트 이벤트 구현 (`OnComponentHit`):**
* `Box Collision` 컴포넌트의 `OnComponentHit` 이벤트를 생성합니다.

#### 3. **이벤트 디스패처 호출 (외부 데미지 연동용):**
* `On Projectile Impact`라는 이름의 이벤트 디스패처(Event Dispatcher)를 생성하고 입력 값으로 `Other Actor(Actor)`와 `Hit(Hit Result)`를 추가합니다.
* Hit 이벤트가 발생하자마자 이 디스패처를 `Call`하여 외부(예: 플레이어 BP)에서 데미지 처리를 할 수 있도록 신호를 쏩니다.

#### 4. **이펙트 및 사운드 생성:**
* `Hit Result`를 `Break`하여 충돌한 정확한 좌표(`Location`)를 추출합니다.
* `Spawn Emitter at Location` 노드에 우리가 만든 `Impact Effect` 변수를 연결합니다.
* `Play Sound at Location` 노드에 `Impact Sound` 변수를 연결합니다.

#### 5. **소멸:**
* 마지막에 `Destroy Actor`를 호출하여 투사체를 월드에서 제거합니다.

---

### 요약: 이 강의를 보고 현재 프로젝트에 적용할 힌트

* 현재 진행 중인 'Smart Enemy AI'와 이 선행 강의의 가장 큰 차이점은 **충돌을 감지하고 처리하는 방식**입니다.

* **현재 구현 상태:** `Begin Overlap`에서 `OnComponentHit`으로 전환하고 `Simulation Generates Hit Events`를 켜두셨습니다.
* **강의 방식:** 스크립트 후반부를 보면 플레이어가 투사체를 스폰할 때, 플레이어의 캡슐 컴포넌트(`Capsule Component`)에서도 **`Ignore Actor while Moving`을 한 번 더 호출하여 스폰된 투사체를 무시**하라고 명시합니다. (쌍방무시)
* **연동 팁:** AI 가 하두켄을 쏠 때 강의에 나온 **이벤트 디스패처(`On Projectile Impact`)** 구조를 사용하면, 투사체 자체에 데미지 로직을 복잡하게 짤 필요 없이 캐릭터 BP에서 깔끔하게 데미지 연동(`Apply Damage` 또는 `Take Damage`)을 처리할 수 있게 됩니다.

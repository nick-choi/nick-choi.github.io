## 2026-04-14 새로운 공부
### How to Create a Souls-Like Game in Unreal Engine 5 
* URL : https://www.youtube.com/watch?v=Hs2sM7eFf6Q
#### 공부 과정
* udemy에서 기초 공부는 하고 보는게 따라가기 쉽다
* 2026-04-14
  * **BlendSpace**
    * StrafeMovement
    * 다크소울처럼 좌우키 움직였을 때 정면바라보면서 좌우로 이동. 회전X
    
  * **CharacterMovement**
    * Orient Rotation to Movement : 캐릭터가 이동하고 있는 방향을 향해 몸을 자동으로 돌리는 설정
    * Use Controller Desired Rotation : 캐릭터가 카메라가 바라보는 방향을 향해 몸을 맞추는 설정
    
  * **BPC_Combat**
    * LockOn
    
* 2026-04-17
  * **WBP_TargetLock** - **Spawn Actor**
    * LockOn - UI 표시
    
* 2026-04-18
  * Animation Montage - Combo 애니메이션 관리
    * 섹션(Sections) 관리
      * 하나의 몽타주를 여러 구역(예: 시작, 루프, 끝)으로 나누어, 특정 조건에 따라 특정 섹션으로 즉시 이동하거나 반복 재생할 수 있습니다.
    * 슬롯(Slots) 기반 재생
      * 애니메이션 블루프린트(AnimBP) 내에 '슬롯' 노드를 배치해두면, 몽타주가 실행될 때 현재 재생 중인 기본 애니메이션(걷기, 대기 등) 위에 몽타주 애니메이션을 **덮어씌워(Override)** 보여줍니다.
    * 애니메이션 통지(Anim Notifies)
      * 애니메이션 도중에 소리를 내거나, 파티클을 소환하거나, 공격 판정을 켜고 끄는 이벤트를 특정 프레임에 정확히 배치할 수 있습니다.
    * 루트 모션(Root Motion) 지원
      * 애니메이션의 움직임값이 실제 캐릭터의 좌표(Capsule Component)에 반영되도록 설정할 수 있어, 공격 시 앞으로 전진하는 등의 자연스러운 움직임을 구현할 때 필수적입니다.
  * AnimNotifyState
    * Begin Sword Trace / End Sword Trace
    * Animation Montage 의 각 Combo에 맞게 BP_Notify_Damage 적용
* 2026-04-19
  * ApplyDamage
    * Unreal 자체에 있는 ApplyDamage 함수 호출
    * 계속 Damage가 들어가기 때문에 Do Once -> Apply Damage -> Delay -> Reset 처리
  * Dodge
    * Use Controller Desired Rotation 시에는 키 입력 방향에 따라 구르는 방향의 애니메이션을 재생(W-Forward,A-Left,S-Backward,D-Rgith)
    * 그 외에는 항상 Forward 재생
* 2026-04-20
  * Enemy AI : Sense Component를 이용해서 시야 내를 감지하고 다가와사 근처이면 공격
    * Blackboard
    * Behavior Tree : Idle -> Trace, Attack
    * Task
    
* 2026-04-21
  * Boss AI : Enemy AI를 상속받아서 Boss AI 작성하기
    * 04-20에 진행했던 작업을 상속받아서 BP 만들기
      * BP_Enemy -> BP_Boss
      * BP_AI_Enemy -> BP_AI_Boss
    * 04-20에 작업했던 Task_SwordAttack과 비슷한 Task_BigAttack을 Behavior Tree에 추가
      * 추적 후 Sword Attack->Delay->BigAttack
      
* 2026-04-22
  * 드디어 mannequin Mesh를 사용하지 않고 asset을 통해서 Warrior mesh 사용!
  * 보스는 Grux 사용
* 2026-04-24
  * Boss의 Primary Attack이 씹히는 버그 수정하기 위해 롤백하고 동영상 강의 보면서 다시 정리.
    * Primary Attack Montage의 DefaultGroup.DefaultSlot 으로 설정필요
* 2026-04-25
  * Audio 적용
| 구분 | 역할 | 비유 |
| ---- | ---- | ---- |
| Meta Sound | 오디오계의 블루프린트 | 프로그래밍 가능한 악기 |
| Sound Cue | 전통적인 사운드 조립 도구 | 레고 블록 조립 |
| Sound Attenuation | 거리 및 공간감 설정 | 스피커 배치와 볼륨 조절 |
    
* 2026-04-29
  * Stamina
## How to Build a Combat Damage System
* URL : [https://www.youtube.com/watch?v=o3uFXnNxwKE](https://www.youtube.com/watch?v=o3uFXnNxwKE)
* 순수하게 Blueprint로 DamageSystem 구현

## How to Build A Combat Damage System in C++
* URL : [https://www.youtube.com/watch?v=SxRl7he0cok](https://www.youtube.com/watch?v=SxRl7he0cok)
* Blueprint로 기본 시스템 만들어본 후 Unreal C++로 변환하는 과정
  
## 2026-05-11
* 동영상 시청 완료.
* Blueprint를 그대로 따라서 만들어보고, C++로 다시 변환할 예정
* 일단 BP_Player가 BP_Enemy에게 공격(Left Button)해서 TakeDamage 콜하는 데 까지 테스트 완료

## 2026-05-12
* 동영상에서 나오는 모든 로직 따라하기 끝
* 찾아보니까 위 C++ 영상(How to Build A Combat Damage System in C++)이 있기를 그걸 따라하는 걸로 변경

## 2026-05-13
* 두 영상 시청 완료

### blueprint to C++ 참고사항
#### Blueprint interface -> public
* UInterface 를 상속받은 클래스와 Interface 선언 클래스가 존재
```c++
UINTERFACE()
class UTestInterface : public UInterface
{
	GENERATED_BODY()
};

class DAMAGESYSTEMTEMPLATE_API ITestInterface
{
	GENERATED_BODY()
      ...
};
```

* Interface 메소드 선언시 **BlueprintNativeEvent** 를 반드시 넣는다.
```c++
  UFUNCTION(BlueprintCallable, BlueprintNativeEvent)
  float GetCurrentHealth() const;
  
  UFUNCTION(BlueprintCallable, BlueprintNativeEvent)
  float GetMaxHealth() const;
```

* Interface를 구현하는 클래스에서 메소드 선언 및 구현(원래 메소드명 + **_Implementation**)
```c++
  virtual float GetMaxHealth_Implementation() const override
  {
    return 0.0;
  }
```  

#### delegate 생성하고 blueprint에서 bind할 때
* delegate 선언
```c++
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnHealReceived, float, healAmount, AActor*, healer);
```

* 클래스 delegate 멤버 변수 선언
```c++
UPROPERTY(BlueprintAssignable, Category = "Damage Delegates")
FOnHealReceived OnHealReceived;
```

* 클래스 내부에서 호출할 때
```c++
  OnHealReceived.Broadcast(healAmount, healer);
```

#### 위 외부 delegate를 클래스(c++)에서 내부 메소드에 bind할 때
* 클래스 내부에서 delegate에 bind할 메소드 선언
    * **BlueprintNativeEvent**가 선언되어있으면 blueprint에서 override할 수 있다.
```c++
UFUNCTION(BlueprintNativeEvent)
void RespondToHealReceived(float healAmount, AActor* healer);
```

* 외부 delegate를 bind처리(c++)
```c++
SystemComponent->OnHealReceived.AddDynamic(this, &ABaseDamageableCharacter::RespondToHealReceived);
```

* bind할 메소드 구현(**BlueprintNativeEvent**가 선언되어 있으므로 원래 메소드명 + **_Implementation** 으로 구현)
```c++
void ABaseCharacter::RespondToHealReceived_Implementation(float healAmount, AActor* healer)
{
}
```

### 오늘의 최종 결론
* 일단 공부는 완료했다. 따라서 만들어도 봤다.
* 다음 스텝은 [10 Ways to Make Combat Feel Better](</Ali Elzoheiry/CombatFeelBetter>) 이 영상이다.
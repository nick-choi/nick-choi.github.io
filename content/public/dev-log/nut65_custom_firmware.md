---
title: NUT65 커스텀 펌웨어 제작 및 관리 가이드
date: 2026-11-09
tags:
  - NUT65
  - QMK
  - Vial
  - firmware
  - macOS
  - keyboard
---

# WEIKAV NUT65 커스텀 펌웨어 제작 및 관리 가이드

> **작업 환경:** macOS (Apple Silicon), QMK CLI 1.1.8, Vial-QMK, WB32 DFU 업데이터  
> **검증한 최종 결과:** 커스텀 **v4** (Fn/RAlt 위치 변경, 안전한 DFU 단축키, Backtick/Tilde, White 키 LED, White KITT 라이트바)  
> **작성일:** 2026-11-09  
> **용도:** SilverBullet에 보관할 재현·복구용 기술 노트

이 문서는 WEIKAV NUT65에 [MoonZhe/Nut65](https://github.com/MoonZhe/Nut65)를 기반으로 만든 커스텀 펌웨어를 직접 빌드하고 플래싱한 과정을 정리한 것이다. **공식 제조사 펌웨어 가이드가 아니라 실제 커스텀 작업 기록**이며, 특히 소스 코드상의 기본값과 Vial에 저장된 현재 설정의 차이를 이해하는 데 중점을 둔다.

## 목차

- [0. 알아야 할 임베디드·QMK 기초 지식](#0-알아야-할-임베디드qmk-기초-지식)
- [1. 일반적인 빌드·플래싱 절차](#1-일반적인-빌드플래싱-절차)
- [2. 레이아웃·키맵 수정 방법](#2-레이아웃키맵-수정-방법)
- [3. 키 LED 및 KITT 라이트바 색상 변경](#3-키-led-및-kitt-라이트바-색상-변경)
- [4. EEPROM·Vial과 초기화의 관계](#4-eepromvial과-초기화의-관계)
- [5. 문제 해결 및 안전한 복구](#5-문제-해결-및-안전한-복구)
- [6. 완성한 v4의 기능·단축키](#6-완성한-v4의-기능단축키)
- [7. 소스·바이너리 관리 체크리스트](#7-소스바이너리-관리-체크리스트)

---

## 0. 알아야 할 임베디드·QMK 기초 지식

### 0-1. 용어

| 용어 | 뜻 | NUT65 작업에서의 역할 |
|---|---|---|
| **MCU (Microcontroller Unit)** | 키보드를 제어하는 마이크로컨트롤러 | 키 스캔, USB·무선, LED, 펌웨어 실행 담당. 이번 장치의 DFU 정보는 WB32FQ95 계열로 확인됨 |
| **Firmware** | 하드웨어에서 직접 실행되는 소프트웨어 | 키 배열, LED, 기능 단축키 등이 포함된 `.bin` 파일 |
| **Flash 메모리** | 실행할 펌웨어가 기록되는 비휘발성 영역 | `.bin`을 플래싱하는 목적지 |
| **EEPROM / 비휘발성 설정 저장소** | 펌웨어와 별개로 현재 설정을 보존하는 저장 공간 | Vial 키맵, 조명, 사용자 설정을 저장. 실제 구현은 MCU·QMK 구성에 따라 다름 |
| **Bootloader** | 펌웨어를 기록·복구하기 위한 별도 프로그램 | DFU 모드에서 PC가 키보드에 `.bin`을 기록하도록 함 |
| **DFU (Device Firmware Upgrade)** | 펌웨어 업데이트 모드·프로토콜 | `wb32-dfu-updater_cli`로 NUT65를 업데이트 |
| **QMK** | 오픈소스 키보드 펌웨어 프레임워크 | 키코드, 레이어, RGB Matrix, 빌드 시스템 제공 |
| **VIA / Vial** | 키맵을 동적으로 설정하는 도구 | 펌웨어를 새로 빌드하지 않고 키맵·매크로를 변경 가능 |
| **Keymap / Layer** | 물리 키가 수행할 기능을 정의한 배열 / 키 배열의 층 | 기본 레이어 0·2와 Fn 레이어 1·3, 특수 레이어 4를 사용 |
| **Matrix** | 물리 키를 행(row)·열(col) 좌표로 식별하는 구조 | JSON 배열 인덱스와 QMK `LAYOUT(...)`의 순서가 다를 수 있음 |
| **Toolchain** | 컴파일러·링커·바이너리 생성 도구 모음 | ARM GCC 8 및 ARM binutils 사용 |
| **RGB Matrix** | 키별 RGB 조명을 제어하는 QMK 기능 | 키 LED의 기본 효과와 HSV 설정 담당 |
| **HSV** | 색조(Hue)·채도(Saturation)·밝기(Value) | 채도 0 = 흰색 계열, 채도 255 = 선명한 색상 |

### 0-2. 자주 쓰는 QMK 키코드

| 키코드 | 의미 |
|---|---|
| `KC_RALT` | 오른쪽 Alt(맥에서 보통 오른쪽 Option으로 사용) |
| `KC_RGUI` | 오른쪽 GUI(맥에서 보통 오른쪽 Command로 사용) |
| `MO(1)` | 누르고 있는 동안 Layer 1 활성화 |
| `MO(3)` | 누르고 있는 동안 Layer 3 활성화 |
| `MO(4)` | 누르고 있는 동안 Layer 4 활성화 |
| `KC_GRV` | Grave / Backtick 키 |
| `S(KC_GRV)` | Shift + Grave, US ANSI 영문 입력에서 Tilde(`~`) |
| `QK_GESC` | 상황에 따라 Esc 또는 Grave로 동작하는 키 |
| `QK_BOOT` | Bootloader(DFU) 진입 |
| `EE_CLR` | 이 보드에서 길게 눌러 EEPROM 초기화에 사용하는 키 |
| `KC_TRNS` / `_______` | 투명(아래 레이어의 키 기능을 통과) |
| `KC_NO` | 아무 기능도 수행하지 않음 |
| `LED_TOG` | 상태 표시 LED 켜기/끄기 |

**중요:** `S(KC_GRV)`의 결과가 `~`로 보이려면 운영체제의 키보드 입력 소스도 적절해야 한다. 이번 테스트는 macOS의 영문 **ABC** 입력 소스를 기준으로 했다.

### 0-3. NUT65의 레이어 구조

| 레이어 | 목적 |
|---|---|
| **0** | Windows 기본 키맵 |
| **1** | Windows Fn 레이어 (`MO(1)`) |
| **2** | macOS 기본 키맵 |
| **3** | macOS Fn 레이어 (`MO(3)`) |
| **4** | `Fn + Right Shift`로 진입하는 특수 레이어 (DFU, EEPROM 초기화 등) |

**핵심 개념:** `Fn + Right Shift`의 Right Shift는 일반적인 Shift 키 입력이 아니라 Fn 레이어에서 `MO(4)`로 작동한다. 그래서 Layer 4의 Esc를 `KC_GRV`로 두면 `Fn + Right Shift + Esc` 결과가 **Tilde가 아닌 Backtick**이다. `S(KC_GRV)`로 바꿔야 Tilde가 된다.

---

## 1. 일반적인 빌드·플래싱 절차

### 1-1. 사용한 프로젝트와 도구

- 보드 커스텀 소스: [MoonZhe/Nut65](https://github.com/MoonZhe/Nut65)
- Vial 펌웨어 소스: [vial-kb/vial-qmk](https://github.com/vial-kb/vial-qmk)
- GUI 설정: [Vial 웹 인터페이스](https://vial.rocks/)
- WB32 업데이트 도구: [WestberryTech/wb32-dfu-updater](https://github.com/WestberryTech/wb32-dfu-updater)
- 컴파일 환경: `qmk`, ARM GCC 8, ARM binutils, Git, Python 3, Homebrew

실제 성공한 환경은 **QMK CLI 1.1.8**, **Vial-QMK 커밋 `dd43959ae5`**, Homebrew의 **`osx-cross/arm/arm-none-eabi-gcc@8` 및 `osx-cross/arm/arm-none-eabi-binutils`**였다. 재현할 때는 이 조합부터 시도한다.

설치 여부 확인:

```bash
qmk --version
python3 --version
git --version
command -v wb32-dfu-updater_cli
brew --prefix osx-cross/arm/arm-none-eabi-gcc@8
brew --prefix osx-cross/arm/arm-none-eabi-binutils
```

> `wb32-dfu-updater_cli`는 **설치되어 있어야** 한다. 없는 경우 위의 WB32 프로젝트 설치 방법을 확인한다. 확인되지 않은 Homebrew 패키지명을 임의로 사용하지 않는다. Homebrew Tap·Python 경로는 기기마다 달라질 수 있다.

### 1-2. 최초 소스 구성 (처음 한 번만)

아래는 두 저장소를 같은 상위 디렉터리에 두는 예시다.

```bash
mkdir -p ~/Projects/nut65
cd ~/Projects/nut65

git clone https://github.com/MoonZhe/Nut65.git Nut65
git clone https://github.com/vial-kb/vial-qmk.git vial-qmk

cd vial-qmk
git checkout dd43959ae5
git submodule update --init --recursive --depth 1

# NUT65용 보드 소스를 Vial-QMK에 복사
cp -R ../Nut65/vial/keyboards/. keyboards/

# 이 조합에서 실제 적용한 호환성 패치 (깨끗한 소스에 1회만)
git apply ../Nut65/patches/vial-qmk-pixel-fractal-no-led.patch
git apply ../Nut65/patches/vial-qmk-reactive-offset-clamp.patch
```

**주의:** 이미 작업한 `vial-qmk` 저장소에서 `git checkout`, `cp -R`, `git apply`를 반복하지 않는다. 특히 패치는 중복 적용 시 실패할 수 있다. 기존 작업 디렉터리에서는 이 단계 대신 **동기화부터** 진행하면 된다.

작업 변경을 별도로 관리하려면 `Nut65` 저장소에서 브랜치를 만든다.

```bash
cd ../Nut65
git switch -c custom/fn-ralt-swap  # 이미 브랜치가 있으면 실행하지 않음
```

### 1-3. 소스 동기화

**편집할 원본은 `Nut65/keymap/socd/`이고, 빌드 대상은 `vial-qmk/`**이다.

`vial-qmk` 디렉터리에서 실행:

```bash
cd ../vial-qmk  # 현재 Nut65에 있다는 전제

python3 ../Nut65/tools/sync_vial_keymap.py \
  keyboards/leku/nut65
```

이 스크립트는 두 키맵을 생성·갱신한다.

- `keyboards/leku/nut65/keymaps/vial/` — 실제 사용한 전체 기능 빌드
- `keyboards/leku/nut65/keymaps/vial_personal/` — 효과 수를 줄인 별도 빌드

동기화 검증:

```bash
diff -u ../Nut65/keymap/socd/keymap.c \
  keyboards/leku/nut65/keymaps/vial/keymap.c

diff -u ../Nut65/keymap/socd/layers.inc \
  keyboards/leku/nut65/keymaps/vial/layers.inc

# config.h는 Vial 설정이 추가되어 원본과 완전히 같지 않은 것이 정상
grep -E 'RGB_MATRIX_DEFAULT_SAT|VIAL_PERSIST_VERSION' \
  keyboards/leku/nut65/keymaps/vial/config.h
```

`keymap.c`와 `layers.inc`의 `diff` 출력이 없으면 정상이다. **`config.h`는 동기화 과정에서 Vial 전용 정의와 EEPROM 크기 조정이 추가되므로, 원본과의 전체 diff가 없어야 한다고 판단하면 안 된다.**

### 1-4. 펌웨어 빌드

`vial-qmk` 디렉터리에서 실제로 성공한 명령:

```bash
PATH="$(brew --prefix osx-cross/arm/arm-none-eabi-gcc@8)/bin:$(brew --prefix osx-cross/arm/arm-none-eabi-binutils)/bin:$PATH" \
  make leku/nut65:vial
```

성공하면 작업 디렉터리 최상단에 다음 파일이 생성된다.

```text
vial-qmk/leku_nut65_vial.bin
```

빌드가 **성공했다는 사실만으로 플래싱까지 완료된 것은 아니다.** 실제 파일이 존재하는지 확인하고 버전을 구분해 백업한다.

```bash
ls -lh leku_nut65_vial.bin
mkdir -p ~/Projects/nut65-backup
cp leku_nut65_vial.bin \
  ~/Projects/nut65-backup/nut65_custom_white_v4.bin
shasum -a 256 \
  ~/Projects/nut65-backup/nut65_custom_white_v4.bin
```

`v4`는 이번에 완성한 버전 이름이다. 다음 수정 때는 `v5`처럼 파일명을 변경해 **이전 정상 BIN을 덮어쓰지 않는다.**

### 1-5. DFU 진입

1. USB 케이블을 연결하고 **유선 모드**로 전환한다.
2. Vial/VIA/제조사 웹 드라이버가 열려 있다면 종료한다.
3. 현재 설치된 펌웨어에 맞는 단축키로 DFU에 진입한다.

| 설치되어 있는 펌웨어 | DFU 진입 단축키 |
|---|---|
| 기존 MoonZhe 기반 초기 버전 / 사용자 v1 | `Fn + Right Shift + Esc` |
| 이번에 완성한 사용자 v2·v3·**v4** | **`Fn + Right Shift + Insert`** |

**주의:** 사용자 v4에서 Fn은 **기존 RAlt 물리적 위치**에 있다. DFU 단축키는 **지금 설치된 펌웨어를 기준**으로 누른다. v4에서 `Fn + Right Shift + Esc`는 문자 `~` 입력용이다.

장치가 DFU에 진입하면 일반 키 입력이 멈추며, USB 장치 ID `342d:dfa0`으로 확인되었다.

```bash
system_profiler SPUSBDataType | grep -i -B 8 -A 8 '0xdfa0'
```

### 1-6. BIN 기록 및 재부팅

아래 예시는 이미 백업해 둔 v4 BIN을 사용한다.

```bash
wb32-dfu-updater_cli -t -s 0x08000000 \
  -D "$HOME/Projects/nut65-backup/nut65_custom_white_v4.bin"
```

`Download completed!` 메시지가 출력되면 기록 완료로 판단한다. 오류가 나오면 **재부팅 명령 전에 오류 내용을 확인**한다.

```bash
wb32-dfu-updater_cli -R
```

`Reset device completed!`가 출력되면 키보드를 재시작한 것이다.

> **기록 시작 주소:** `0x08000000`은 이번 장치에서 실제로 성공한 플래싱 명령의 값이다. 다른 기종이나 부트로더에 무조건 적용하지 않는다.

### 1-7. 플래싱 후 초기화 및 검증

이번 프로젝트는 펌웨어를 업데이트해도 **기존 Vial 설정을 유지하는 기능**이 있다. 따라서 소스에서 기본 키맵·기본 색상을 변경했으면, 필요한 설정을 백업한 뒤 다음 키 조합으로 **컴파일된 기본값을 다시 불러와야** 변경을 확인할 수 있다.

```text
Fn + Right Shift + Backspace (3초 이상)
```

- Vial 키맵, 매크로, 일부 조명 설정 등이 초기화될 수 있다.
- 이 초기화는 **현재 설치된 커스텀 펌웨어의 기본값**으로 복원한다.
- 제조사 출고 펌웨어를 다시 설치하는 기능은 **아니다**.

검증 기준은 [6. 완성한 v4의 기능·단축키](#6-완성한-v4의-기능단축키) 참고.

---

## 2. 레이아웃·키맵 수정 방법

> **이 절에서는 빌드·플래싱 명령을 반복하지 않는다.** 수정 후에는 1-3(동기화) → 1-4(빌드) → 1-5~1-7(플래싱·검증)을 따른다.

### 2-1. 두 종류의 키맵 변경

| 방식 | 효과 | 언제 사용하나 |
|---|---|---|
| **Vial 웹에서 변경** | EEPROM에 저장되는 현재 키맵 수정 | 시험용·사용자별 설정 변경 |
| **소스에서 기본 키맵 변경** | `.bin`에 포함되는 기본값 수정 | 공장 초기화 후에도 원하는 배열로 돌아오게 할 때 |

이번 작업은 **공장 초기화 후에도 Fn/RAlt 교환과 안전한 DFU 키가 유지되도록** 두 번째 방식을 사용했다.

### 2-2. 원본 파일과 생성 파일

| 파일 | 역할 |
|---|---|
| `Nut65/nut65.layout.json` | 편집 대상: 레이어별 키코드가 담긴 JSON |
| `Nut65/vial/keyboards/leku/nut65/keyboard.json` | 물리 키의 행·열 위치와 레이아웃 정의 |
| `Nut65/tools/gen_layers.py` | JSON을 QMK `LAYOUT(...)` C 코드로 변환 |
| `Nut65/keymap/socd/layers.inc` | **생성 결과물**. 최종적으로 컴파일되는 레이어 정의 |
| `Nut65/tools/sync_vial_keymap.py` | 수정된 파일을 Vial-QMK로 동기화 |

**중요:** JSON의 레이어 배열은 **행렬 순서**, `layers.inc`는 **물리 키의 `LAYOUT(...)` 순서**이므로 숫자 인덱스를 눈대중으로 계산하지 않는다. 해당 배열 인덱스는 이번 `keyboard.json`과 `gen_layers.py` 기준이다.

### 2-3. 이번에 적용한 Fn/RAlt 위치 교환

기존 물리적 위치 기준으로 하단 오른쪽 두 키를 바꿨다.

| 레이어 | 기존 RAlt 위치 | 기존 Fn 위치 |
|---|---|---|
| Windows 기본 Layer 0 (기존) | `KC_RALT` | `MO(1)` |
| Windows 기본 Layer 0 (수정) | **`MO(1)`** | **`KC_RALT`** |
| Mac 기본 Layer 2 (기존) | `KC_RGUI` | `MO(3)` |
| Mac 기본 Layer 2 (수정) | **`MO(3)`** | **`KC_RALT`** |

Mac 모드에서는 기존 첫 번째 키가 `KC_RGUI`(오른쪽 Command)였으므로, **결과적으로 오른쪽 Command 기능을 오른쪽 Option(`KC_RALT`)으로 바꾼 것**이기도 하다. 순수하게 두 키의 기능을 맞교환하려면 Mac 레이어에 `KC_RGUI`를 배치하는 등의 별도 선택이 필요하다.

추가로 Windows Fn Layer 1과 Mac Fn Layer 3에서 **새 Fn 위치의 `CUSTOM(7)` (`LED_TOG`)**를 `KC_TRNS`로 바꿨다. Fn을 누르는 동작과 LED 토글 기능이 충돌하지 않게 하기 위해서다.

### 2-4. DFU 단축키 변경 + Tilde 수정

초기에는 `Fn + Right Shift + Esc`가 DFU 단축키여서, Tilde를 입력하려다가 키보드가 **부트로더로 진입하고 먹통처럼 보이는 문제**가 있었다.

변경한 Layer 4:

| 키 위치 | 변경 전 | 최종 v4 |
|---|---|---|
| Esc | `RESET` → `QK_BOOT` | **`S(KC_GRV)`** → Tilde |
| Backspace | `EE_CLR` | **`EE_CLR`** 유지 |
| Insert | `KC_TRNS` | **`RESET`** → `QK_BOOT` |

Right Shift가 Layer 4 활성화용 `MO(4)`로 작동하므로 `KC_GRV`만 설정하면 Backtick이 나온다. **Tilde에는 `S(KC_GRV)`가 필요했다.** 이 부분은 실제 v3에서 수정하여 정상 동작을 확인했다.

### 2-5. 원본 JSON에서 v4 키맵 재현하기

다음 코드는 **아직 키맵을 수정하지 않은 MoonZhe 원본 `nut65.layout.json`을 v4 배열로 바꾸는 예시**다. 현재 작업 완료된 v4에 다시 적용할 필요는 없다.

`Nut65` 디렉터리에서 실행:

```bash
python3 - <<'PY'
import json
from pathlib import Path

path = Path('nut65.layout.json')
data = json.loads(path.read_text())
layers = data['layers']

# (레이어, JSON 인덱스): (원래 키코드, 변경할 키코드)
changes = {
    (0, 70): ('KC_RALT',   'MO(1)'),
    (0, 71): ('MO(1)',     'KC_RALT'),
    (1, 70): ('CUSTOM(7)', 'KC_TRNS'),
    (2, 70): ('KC_RGUI',   'MO(3)'),
    (2, 71): ('MO(3)',     'KC_RALT'),
    (3, 70): ('CUSTOM(7)', 'KC_TRNS'),
    (4,  0): ('RESET',     'S(KC_GRV)'),  # Esc
    (4, 14): ('KC_TRNS',   'RESET'),      # Insert
}

for (layer, index), (before, after) in changes.items():
    current = layers[layer][index]
    assert current in (before, after), (
        f'Unexpected value at layer={layer}, index={index}: {current}'
    )
    layers[layer][index] = after

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('Custom NUT65 layout updated')
PY
```

`RESET`은 `gen_layers.py`에서 `QK_BOOT`로, `KC_TRNS`는 `_______`로 변환된다. **레이어 4의 Backspace는 `gen_layers.py`의 `OVERRIDES`에서 `EE_CLR`로 고정**하므로 JSON 직접 편집 없이 유지된다.

### 2-6. `layers.inc` 재생성

```bash
# 현재 디렉터리: Nut65
python3 tools/gen_layers.py \
  nut65.layout.json \
  vial/keyboards/leku/nut65/keyboard.json \
  > keymap/socd/layers.inc

# Layer 4 첫 줄 확인
grep -A 1 '\[4\] = LAYOUT' keymap/socd/layers.inc

git diff --check
git diff -- nut65.layout.json keymap/socd/layers.inc
```

최종적으로 Layer 4 첫 줄은 다음과 같은 형태여야 한다.

```c
[4] = LAYOUT(
    S(KC_GRV), _______, /* ... */, EE_CLR, QK_BOOT,
```

이후 **1-3 동기화 → 1-4 빌드 → 1-5~1-7 플래싱 및 초기화**를 진행한다.

---

## 3. 키 LED 및 KITT 라이트바 색상 변경

### 3-1. 키 LED와 KITT 라이트바는 별도 설정

| 조명 | 담당 파일 | v4 기본값 |
|---|---|---|
| 각 키의 RGB 조명 | `Nut65/keymap/socd/config.h` | **White**, `Solid Reactive Simple` |
| 전면 80-LED KITT 라이트바 | `Nut65/keymap/socd/keymap.c` | **White KITT 2008** 스캐너 |

키 LED만 White로 수정하면 KITT 바는 기존 Red로 남는다. **두 파일을 모두 수정**해야 한다.

### 3-2. 키 LED를 White로 변경

파일: `Nut65/keymap/socd/config.h`

```c
#undef RGB_MATRIX_DEFAULT_MODE
#define RGB_MATRIX_DEFAULT_MODE RGB_MATRIX_SOLID_REACTIVE_SIMPLE

#undef RGB_MATRIX_DEFAULT_HUE
#define RGB_MATRIX_DEFAULT_HUE 0

#undef RGB_MATRIX_DEFAULT_SAT
#define RGB_MATRIX_DEFAULT_SAT 0   // White: 채도 0

#undef RGB_MATRIX_DEFAULT_VAL
#define RGB_MATRIX_DEFAULT_VAL 255 // 밝기 최댓값
```

주요 변경은 한 줄이다.

```diff
-#define RGB_MATRIX_DEFAULT_SAT 255
+#define RGB_MATRIX_DEFAULT_SAT 0
```

`Solid Reactive Simple`은 **평소 키가 꺼져 있고 타건 시 White로 점등**하는 효과다. 전체 키가 항상 하얗게 켜지는 `Solid Color`와는 다르다.

### 3-3. KITT White 색상 모드 추가

파일: `Nut65/keymap/socd/keymap.c`

기본 색상을 7번째 모드(White)로 지정한다. 기존 Red, Amber, Blue, Green, Purple, Rainbow를 삭제하지 않고 남긴다.

```c
#define KITT_DEFAULT_SPEED 1
#define KITT_DEFAULT_VARIANT 7 // White가 기본
#define KITT_RAINBOW 0xFF
#define KITT_WHITE   0xFE
```

색상 배열 마지막에 White 추가:

```c
static const uint8_t kitt_hues[] = {
    0,            // Red
    20,           // Amber
    170,          // Blue
    85,           // Green
    200,          // Purple
    KITT_RAINBOW, // Rainbow
    KITT_WHITE,   // White
};
```

실제 LED 색상을 계산하는 `kitt_color()`에서 White 모드일 때만 **채도를 0**으로 지정한다.

```c
static RGB kitt_color(uint8_t hue, uint8_t led, uint8_t level) {
    HSV hsv = {
        .h = hue == KITT_RAINBOW ? timer_read32() / 20 + led * 3 : hue,
        .s = hue == KITT_WHITE ? 0 : 255,
        .v = level,
    };
    return hsv_to_rgb(hsv);
}
```

단순히 Hue만 바꾸는 것으로는 흰색이 되지 않는다. **화이트는 채도(Saturation) 0이 핵심**이다. 이 수정은 KITT 바뿐 아니라 같은 `kitt_color()`를 사용하는 일부 키보드 KITT 연동 효과에도 적용된다.

### 3-4. 기존에 남는 다른 색상 표시

White 기본값으로 바꿔도 모든 상태 표시가 White로 통일되지는 않는다.

- KITT **1982** 스캐너의 빨간색·호박색 모드는 별도 로직을 사용한다.
- 타건 속도(WPM) 표시와 SOCD 토글 피드백은 상태별 색상을 유지한다.
- **충전/배터리 상태 표시(왼쪽 Ctrl 위치)**는 보드 코드에서 빨간색·초록색 등을 직접 지정한다.
- Caps Lock, 무선 연결 및 기타 시스템 상태 표시도 별도로 제어된다.

따라서 이번 **v4의 White 변경은 기본 키 LED와 기본 KITT 2008 스캐너에 적용**된다. 다른 상태 표시 색상까지 강제로 바꾸려면 별도 분석이 필요하다.

### 3-5. 소스 동기화와 검증

파일 수정 후 `Nut65`에서:

```bash
git diff --check
git diff -- keymap/socd/config.h keymap/socd/keymap.c
```

`vial-qmk`에서:

```bash
python3 ../Nut65/tools/sync_vial_keymap.py keyboards/leku/nut65

grep 'RGB_MATRIX_DEFAULT_SAT' \
  keyboards/leku/nut65/keymaps/vial/config.h

grep -E 'KITT_DEFAULT_VARIANT|KITT_WHITE' \
  keyboards/leku/nut65/keymaps/vial/keymap.c
```

기대값: `RGB_MATRIX_DEFAULT_SAT 0`, `KITT_DEFAULT_VARIANT 7`, `KITT_WHITE 0xFE`.

이후 **1-4 빌드 → 1-5~1-7 플래싱·EEPROM 초기화**. 이번 v4에서 **키 LED와 전면 KITT 바가 모두 White로 정상 동작함을 확인**했다.

---

## 4. EEPROM·Vial과 초기화의 관계

### 4-1. 가장 중요했던 문제

처음 Fn/RAlt를 교환해 빌드·플래싱했지만 실제 키는 교환되지 않았다. 그런데 `Fn + Esc`, `Shift + Esc` 등 다른 기능은 정상 동작했다.

**원인:** 펌웨어에는 새 기본 키맵이 들어 있었지만 **EEPROM에 저장된 이전 Vial 키맵이 우선 사용**되고 있었다.

`Nut65/keymap/socd/keymap.c`의 `via_init_kb()`는 펌웨어를 업데이트할 때 기존 Vial EEPROM 데이터를 가능한 한 유지하도록 설계되어 있다. `VIAL_PERSIST_VERSION`이 호환되는 경우 기존 유효 데이터를 계속 사용한다.

```text
[컴파일된 기본 키맵] ──────┐
                           ├─ 저장된 Vial 키맵이 유효하면 EEPROM 값 사용
[EEPROM에 저장된 키맵] ───┘

[Fn + Right Shift + Backspace 3초]
           ↓
저장된 설정 초기화 → 현재 펌웨어의 컴파일된 기본값으로 복원
```

**해결:** `Fn + Right Shift + Backspace`를 3초 이상 눌러 초기화한 뒤 Vial에서 레이어를 다시 확인했다. 그 결과 `Layer 0: MO(1) / RAlt`, `Layer 2: MO(3) / RAlt`로 제대로 변경됐다.

### 4-2. 변경 내용별 적용 시점

| 변경 내용 | 소스/바이너리 수정만으로 충분한가? | 재확인 사항 |
|---|---|---|
| Vial에서 임시로 키 변경 | Vial에서 즉시 반영 | EEPROM 저장 및 연결 유지 |
| 소스에서 기본 Fn 키 교환 | 새 BIN 빌드·플래싱 필요 | 기존 Vial 설정이 남아 있으면 **초기화** |
| 소스에서 기본 DFU 키 변경 | 새 BIN 빌드·플래싱 필요 | 기존 EEPROM 키맵도 **초기화** |
| 소스에서 LED 기본 색상 변경 | 새 BIN 빌드·플래싱 필요 | 기존 조명 설정이 남아 있으면 **초기화** |
| 같은 버전 BIN 재플래싱 | 설정은 일반적으로 유지될 수 있음 | 강제로 초기화된다고 가정하지 말 것 |

### 4-3. '공장 초기화'의 의미

| 동작 | 무엇으로 돌아가나? |
|---|---|
| 전원 껐다 켜기 | 현재 저장된 키맵·조명 설정 유지 |
| `Fn + Right Shift + Backspace` 3초 | **지금 설치된 BIN 안에 들어 있는 기본 설정** |
| 제조사 순정 `.bin`으로 재플래싱 | 순정 코드가 적용됨 (설정 처리 방식은 펌웨어에 따름) |

**주의:** 커스텀 v4를 설치한 상태에서 '공장 초기화'를 해도 WEIKAV 출고 당시 배열이나 빨간 조명으로 돌아가지 않는다. v4의 **Fn/RAlt 교환, White 기본값, 변경된 DFU 단축키**로 복원된다.

---

## 5. 문제 해결 및 안전한 복구

### 5-1. 증상별 점검

| 증상 | 우선 확인할 것 | 권장 대응 |
|---|---|---|
| 빌드 성공했는데 키맵이 옛날 그대로 | Vial에서 Layer 0·2의 현재 값 | EEPROM에 기존 키맵이 남았는지 확인 후 백업·초기화 |
| 플래싱 후 LED 색상이 여전히 빨강 | Vial 조명 설정, EEPROM 저장값 | 현재 BIN이 v4인지 확인 후 기본 설정 초기화 |
| `Fn + Right Shift + Esc` 입력 후 먹통처럼 보임 | 이전 펌웨어에서 이 조합이 `QK_BOOT`인지 | DFU 모드일 수 있음. v4에서는 DFU를 Insert로 이동 |
| `Fn + Right Shift + Esc`에서 Backtick 출력 | Layer 4 Esc가 `KC_GRV`인지 | `S(KC_GRV)`로 수정 |
| 키 입력 없이 왼쪽 Ctrl만 점등 | 충전·배터리 상태 또는 상태 표시등 | `Fn + Left Ctrl` 상태 LED 토글 및 충전 상태 확인 |
| DFU 플래싱 도구에서 장치를 못 찾음 | USB 케이블, 유선 모드, `342d:dfa0` | DFU 진입 여부와 장치 인식 확인 |
| `git apply` 실패 | 패치가 이미 적용됐는지 / 다른 커밋인지 | 기존 작업 폴더에서 중복 패치하지 말 것 |
| `config.h` 원본과 diff 발생 | `sync_vial_keymap.py`가 Vial 정의를 추가함 | **정상적인 차이**일 수 있음. 핵심 설정값으로 검증 |

### 5-2. 정상 BIN 보존과 복구

이번에 정상 동작을 확인한 기준 파일:

```text
~/Projects/nut65-backup/nut65_custom_white_v4.bin
```

이 파일을 다른 디스크에도 보관하고 SHA-256을 함께 기록한다.

```bash
shasum -a 256 ~/Projects/nut65-backup/nut65_custom_white_v4.bin
```

문제가 생겨 **DFU에 진입할 수 있다면** 이 정상 BIN을 다시 플래싱해 복구할 수 있다. 부트로더 자체가 손상된 경우에는 다른 절차가 필요하므로, 확인되지 않은 버튼 조합이나 다른 기종의 플래싱 주소를 임의로 사용하지 않는다.

제조사 소스 기반으로 되돌릴 때 참고 가능한 원본 프로젝트의 파일은 `Nut65/firmware/leku_nut65_default.bin`이다. 이는 **MoonZhe 저장소에 포함된 OEM 기반 빌드**이며, 현재 제조사 홈페이지의 최신 공식 배포본과 같다고 보장하는 것은 아니다.

### 5-3. 플래싱 전 안전 체크

- [ ] USB 연결과 유선 모드 확인
- [ ] 현재 설치된 펌웨어 버전에 맞는 DFU 단축키 확인
- [ ] Vial에서 보관할 키맵·매크로 설정 백업
- [ ] 대상 보드가 NUT65인지, BIN이 `leku/nut65:vial` 빌드인지 확인
- [ ] 새 BIN을 기존 정상 BIN과 **다른 파일명**으로 백업
- [ ] `Download completed!` 확인 후 `-R` 재부팅
- [ ] 필요할 때만 EEPROM 초기화 (기존 사용자 설정 소실 주의)
- [ ] Vial Layer 4의 `Esc` / `Backspace` / `Insert` 배치부터 확인한 뒤 DFU·Tilde 테스트

---

## 6. 완성한 v4의 기능·단축키

| 항목 | v4 기준 동작 |
|---|---|
| 기존 RAlt 물리적 위치 | **Fn** (`MO(1)` 또는 `MO(3)`) |
| 기존 Fn 물리적 위치 | **RAlt** |
| `Fn + Esc` | Backtick (U+0060) |
| `Shift + Esc` | Tilde(`~`) |
| `Fn + Right Shift + Esc` | **Tilde(`~`)** — 오작동하던 DFU 조합 제거 |
| `Fn + Right Shift + Insert` | **DFU Bootloader** |
| `Fn + Right Shift + Backspace` 3초 | **EEPROM / 사용자 설정 초기화** |
| `Fn + Left Ctrl` | **상태 표시 LED ON/OFF** (`LED_TOG`, EEPROM 저장) |
| 키 LED 기본 효과 | **White / Solid Reactive Simple** (타건 시 점등) |
| 전면 KITT 2008 | **White 스캐너** (양방향 애니메이션) |
| `Fn + Insert` | 전면 라이트바 모드 순환 (다른 색상·KITT·기타 모드) |
| `Fn + \` | 키 LED 효과 순환 |
| `Fn + ,` / `Fn + .` | KITT 속도 감소 / 증가 |

**왼쪽 Ctrl LED 참고:** OEM 보드 정의의 `HS_MATRIX_BLINK_INDEX_BAT 7`은 충전/배터리 관련 표시에 사용된다. `Fn + Left Ctrl`의 `LED_TOG`는 `confinfo.hs_led_tog_flag`를 전환한다. 단, 충전 상태 LED와 기타 상태표시 로직의 세부 우선순위는 현재 RGB 효과·연결 상태에 따라 달라질 수 있다.

### v4 완료 확인 기록

- [x] Fn/RAlt 교환 정상
- [x] Backtick 입력 정상
- [x] `Fn + Right Shift + Esc` → Tilde 정상
- [x] DFU 단축키를 Insert로 이동
- [x] EEPROM 초기화 후 변경한 기본 키맵 적용 확인
- [x] 키 LED White 정상
- [x] KITT 라이트바 White 정상
- [x] v4 BIN 빌드 및 백업 완료

---

## 7. 소스·바이너리 관리 체크리스트

### 7-1. 수정된 원본 파일

| 위치 | 수정 이유 |
|---|---|
| `Nut65/nut65.layout.json` | Fn/RAlt 교환, Layer 4 Tilde 및 DFU 위치 변경 |
| `Nut65/keymap/socd/layers.inc` | JSON에서 재생성한 컴파일용 레이아웃 |
| `Nut65/keymap/socd/config.h` | 기본 키 LED 채도 0(White) |
| `Nut65/keymap/socd/keymap.c` | KITT White 색상 모드와 기본값 7 추가 |

### 7-2. 보존하면 좋은 자료

```text
~/Projects/nut65/
├── Nut65/                   # 실제 수정할 원본 소스
└── vial-qmk/                # 컴파일할 QMK 트리

~/Projects/nut65-backup/
├── nut65_custom_dfu_v2.bin
├── nut65_custom_dfu_v3.bin
└── nut65_custom_white_v4.bin  # 최종 정상 동작 기준
```

이 디렉터리는 **이번 대화에서 사용한 상대 경로 및 백업 명령에 맞춘 예시**다. 실제 소스를 다른 경로에 두었다면 그 경로를 기준으로 명령을 변경한다.

### 7-3. 다음 수정 작업의 최소 루틴

1. `Nut65`에서 목적에 맞는 파일 수정 (`nut65.layout.json`, `config.h`, `keymap.c`).
2. **레이아웃을 변경했을 때만** `tools/gen_layers.py`로 `layers.inc` 재생성.
3. `git diff --check`, `git diff`로 의도한 변경만 있는지 확인.
4. `vial-qmk`에서 `sync_vial_keymap.py` 실행.
5. 검증 → `make leku/nut65:vial` → 새 버전명으로 BIN 백업.
6. **현재 설치된 펌웨어의** DFU 단축키로 진입 → 다운로드 → 재부팅.
7. 기존 EEPROM 설정이 새 기본값을 가리면 설정 백업 후 3초 초기화.
8. Vial에서 레이어·조명·단축키 검증.

소스 변경 사항과 사용한 커밋은 별도 기록한다.

```bash
# Nut65 디렉터리
git status --short
git diff --check
git rev-parse HEAD

# vial-qmk 디렉터리
git rev-parse HEAD
```

> **핵심 교훈:** `소스 변경` → `생성 파일 갱신` → `Vial-QMK 동기화` → `컴파일` → `플래싱` → `EEPROM 기본값 복원`은 서로 다른 단계다. 하나가 성공했다고 다음 단계까지 자동으로 끝난 것은 아니다.

---

## 참고 링크

- [MoonZhe/Nut65 — README 및 펌웨어 소스](https://github.com/MoonZhe/Nut65)
- [vial-kb/vial-qmk](https://github.com/vial-kb/vial-qmk)
- [Vial 웹 인터페이스](https://vial.rocks/)
- [QMK Firmware Documentation](https://docs.qmk.fm/)
- [WestberryTech/wb32-dfu-updater](https://github.com/WestberryTech/wb32-dfu-updater)

*이 문서는 실제로 작동을 확인한 사용자 v4를 기준으로 작성했다. 상위 프로젝트의 README에는 여전히 `Fn + Right Shift + Esc`가 DFU라고 설명되어 있을 수 있으나, **우리 v4에서는 `Fn + Right Shift + Insert`가 올바른 DFU 조합**이다.*

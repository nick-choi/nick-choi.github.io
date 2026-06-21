* sony
  * https://opendevices.sony.net/aosp-on-xperia-open-devices/get-started/unlock-bootloader
  * unlock code : ## 23AC63CA57423DD9
  * https://developer.sony.com/open-source/aosp-on-xperia-open-devices/downloads/software-binaries
  * https://drive.google.com/file/d/1SCokyNWNxtdwrUANyTulKLbL1S1wNdq4/view
  * https://xdaforums.com/t/tool-newflasher-xperia-command-line-flasher.3619426/
  * https://github.com/r3dr0se952/RootXperia1IV/tree/main


# 1. 패키지에 있던 순정 vbmeta.img를 구우면서 동시에 보안 검사를 강제로 꺼버립니다.
fastboot --disable-verity --disable-verification flash vbmeta vbmeta.img

# 2. 보조 보안 파티션도 동일하게 순정 파일을 이용해 검사를 끕니다.
fastboot --disable-verity --disable-verification flash vbmeta_system vbmeta.img

# 3. 엑스페리아 1 III 기종에 따라 존재하는 최종 보안 장치까지 세트로 묶어 끕니다.
fastboot --disable-verity --disable-verification flash vbmeta_vendor vbmeta.img

# 2. 드로이디안 커널 및 디바이스 트리 주입
fastboot flash boot boot.img
fastboot flash dtbo dtbo.img

# 3. 가상 파티션 밀어버리고 새 방 만들기
fastboot delete-logical-partition system_a
fastboot delete-logical-partition system_b
fastboot create-logical-partition system_a 0
fastboot create-logical-partition system_b 0

# 4. 드로이디안 본체 밀어 넣기
fastboot flash system_a system.img
fastboot format userdata
fastboot reboot

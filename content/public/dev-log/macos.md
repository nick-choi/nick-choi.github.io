# LaunchDaemon

|     |     |
| --- | --- |
| 상태 확인 | `sudo launchctl print system/sh.brew.mosquitto` |
| 재시작 | `sudo launchctl kickstart -k system/sh.brew.mosquitto` |
| 서비스 해제 및 중지 | `sudo launchctl bootout system/sh.brew.mosquitto` |
| 서비스 재등록 | `sudo launchctl bootstrap system /Library/LaunchDaemons/sh.brew.mosquitto.plist` |


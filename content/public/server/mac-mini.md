# LaunchDeamon
* linux만 사용하던 나에게는 익숙치 않은 시스템

## 등록/시작

```
sudo launchctl bootstrap system /Library/LaunchDaemons/com.example.nginx.plist
```

## 이미 등록되어 있는데 다시 실행만 하고 싶으면:

```
sudo launchctl kickstart -k system/com.example.nginx
```

## 중지 및 등록 해제:

```
sudo launchctl bootout system /Library/LaunchDaemons/com.example.nginx.plist
```

## 상태 확인:

```
sudo launchctl print system/com.example.nginx
```

* plist의 `Label` 값이 `com.example.nginx`여야 위 명령의 서비스명이 맞습니다. 확인은:

```
/usr/libexec/PlistBuddy -c "Print :Label" /Library/LaunchDaemons/com.example.nginx.plist
```

## 요약

```
sudo launchctl bootout system /Library/LaunchDaemons/com.example.nginx.plist 2>/dev/null
sudo launchctl bootstrap system /Library/LaunchDaemons/com.example.nginx.plist
sudo launchctl kickstart -k system/com.example.nginx
sudo launchctl print system/com.example.nginx
```

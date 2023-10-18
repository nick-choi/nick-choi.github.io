---
layout: article
title: Dotnetty Prototype Step3
tags: C# Dotnetty Server Prototype InstantMe
---

# 인스턴스 메신저 구현하기
## 소스코드
* [github project](https://github.com/snowpipe-dev/DotNettyServerSamples/tree/main/InstantMessenger)
* [Netty로 구현된 원래 프로젝트](https://github.com/SoonPoong-Hong/hong-netty-messenger)

## 기능 (패킷 타입) : enum E_ACTION 참고
* LOGIN  //로그인
* LOGOUT //로그아웃
* ENTER_TO_ROOM //방 입장 요청
* EXIT_FROM_ROOM //방 퇴장 요청
* TALK_MESSAGE //메시지 톡 전송
* ROOM_LIST //방 목록
* USER_LIST //방 사람들 목록
* RESPONSE_SUCCESS //성공 -- 서버 응답으로 사용
* RESPONSE_FAIL //실패 -- 서버 응답으로 사용

## 클라이언트 명령
* LOGIN은 실행과 동시에 같이 처리됨으로 생략
* 위의 패킷 타입과 동일

### 단일명령
* 끝에 :만 붙여서 처리
* LOGOUT:, EXIT_FROM_ROOM:, ROOM_LIST:, USER_LIST:

### 파라메터명령
* : 뒤에 파라메터를 붙여 처리
* TALK_MESSAGE:**전달할 메시지**
* ENTER_TO_ROOM:**들아걸 방이름**

## 패킷 구조
* MessagePacket/PacketHelper 클래스 참조

* Header
  * = 로 시작하고 = 로 끝남
  * key:value로 선언되고, 각 라인은 CRLF 로 처리
  * length:XXXX 는 Body의 길이, length가 0이면 contents가 없다.
* Body
  * 문자열로 이루어진 데이터

### 예시
* LOGIN 패킷의 경우 : Body가 없음
```
=
LOGIN
length:0
refId:1
refName:nick
=
```

* USER_LIST 패킷의 경우
  * ["1"] 부분이 Body 내용이고 Length는 이 Body의 길이이다.
```
=
USER_LIST
length:5
=
["1"]
```

## Pipeline 설명 : 클라->서버->클라
* 클라 전송
  1. 부트스트랩 실행시 MessageClientInitializer 실행 (Receive Pipeline 초기화)
  2. Connect
  3. ClientConsoleInput 클래스에서 유저 입력을 받음
  4. bootstrap channel의 WriteAndFlushAsync 메소드 호출
  5. MessagePacketEncoder 를 통해서 MessagePacket이 byte[]로 encode 되어서 전송됨

* 서버 수신
  1. MessagePacketDecoder.Decode 메소드 안에서 byte[]에서 HEADER Decode 후, length를 가지고 다시한번 Body를 Decode 하여 MessagePacket 을 생성
  2. MessagePacket이 E_ACTION.LOGIN 일 경우는 ServerLoginProcessHandler 호출하여 로그인 처리
  3. 그 외의 경우는 MessageServerReceiveHandler 클래스안에서 Action 에 따라 각각 처리됨
  4. 처리된 결과를 **클라 전송 4/5 항목과 동일하게 실행**하여 전송

## 서버/클라이언트 콘솔 실행
* ![서버-클라이언트 콘솔](/assets/images/prototype/prototype-dotnetty-im-server-client.png)

### 서버 실행
```
> ./IMServer
```

### 클라 실행
* ./IMClient ID Name : ID가 중복되면 이미 로그인되어 있다고 오류가 출력됨

```
> ./IMClient 1 nick
```

```
> ./IMClient 2 choi
```

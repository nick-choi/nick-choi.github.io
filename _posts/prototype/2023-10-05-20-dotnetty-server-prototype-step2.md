---
layout: article
title: Dotnetty Prototype Step2
tags: C# Dotnetty Server Prototype
---

# 채팅 프로그램으로 오델로 게임 구현하기
* [채팅 구현](/dotnetty-server-prototype-step1)의 Server/Client 소스를 그대로 가져고 와서 확장하여 1:1 오델로 게임 구현
* 채팅과 동일하게 서버 한대와 클라이언트 두대로 구성

## 규칙
* [오델로#규칙](https://ko.wikipedia.org/wiki/오델로#규칙) 참조
* 첫번째와 두번째 규칙만 구현됨 (패스, 게임 종료, 승리 판단 여부는 아직 미구현)

## 구현규칙
### 패킷
* 채팅에서 사용한 StringEncoder/StringDecoder를 사용
* 포멧
  - **CommandKey**::**CommandValue**
  - 예) Put::5,4 // 5,4에 돌을 놓아둡니다.

#### CommandKey
* Client : 유저가 내릴 수 있는 명령
  * *Join* : *자동 명령*, 닉네임 입력하면 자동으로 서버에 등록됩니다.
  * Start : 첫번째 Join 유저가 Host 되어 게임 시작할 수 있으나, 단 구성원이 두명이어야 합니다.
  * Put : 게임 시작후 각자 턴에 특정 좌표에 돌을 놓아둡니다.

* Server : 서버에서 판단하여 전파하는 명령
  * CompleteJoin : Join이 성공적으로 처리되었을 때의 응답명령
  * StartGame : Host 클라이언트의 Start 명령을 받으면 오델로 판을 초기화 후 응답 명령
  * TileType : StartGame 후 각 클라이언트이 돌 색깔을 알려주는 명령
  * Message : Message 뒤의 CommandValue를 클라이언트에서 출력하도록 명령
  * Members : 현재 접속한 구성원들을 알려주는 명령
  * FailPut : 클라이언트의 Put 명령 CommandValue 유효성 실패했을 때, 그 뒤에 오류가 붙어서 전송됨
  * SuccessPut : Put 명령이 문제없이 실행되었을 때 응답
  * FlipTiles : SuccessPut 이후 뒤집어질 돌들의 좌표들을 전송, 클라이언트는 오델로 판에 맞게 출력
  * NextTurn : FlipTiles 처리 후, 다음 턴의 클라이언트를 지정하여 전송

### 클라이언트
* 소스코드 : /Othello/OthelloClient/OthelloClientHandler.cs

1. 클라이언트들은 유저로부터 입력만 받고, 내부 로직을 처리안함
2. 입력받은 내용을 패킷을 통해 모두 서버로 전송
3. 즉, 클라이언트에서는 판단하는 로직이 없음

### 서버
* 소스코드 : /Othello/OthelloServer/OthelloServerHandler.cs

1. 서버는 클라이언트들이 접속하고 게임 시작 후 오델로 판을 생성한
2. 각 클라이언트들에게 턴을 부여하고, 해당 턴에 전송받은 내용의 유효성을 검사, 명령(CommandKey)을 실행
3. 그 결과값을 다시 전체 클라이언트에 전송하고(SendMessage/BroadCast) 2부터 다시 시작

## 소스코드
* [github project](https://github.com/snowpipe-dev/DotNettyServerSamples/tree/main/Othello)
* 프로토타이핑이기 때문에 최적화와 하드 코딩은 신경쓰지 않고 구현에 집중

## 구현중 발견된 문제점
* 패킷단위로 전송되는게 아니라, Tcp 특성상 Stream 으로 전송되다보니 여러패킷이 같이 보내져서 클라이언트에서 Decode하면서 오류 발생
  * 다음 스텝에서 해결할 예정이나 일단 패킷 끝날때 구분자인  **\|** 을 붙여서, Decode할 때 Split 하여 여러 패킷을 분리하여 순차적으로 처리
    - 처리 예) Packet[ SuccessPut::5,4,BLACK\|FlipTiles::BLACK#4,4\|NextTurn::0\| ]
      1. SuccessPut 처리
      2. FlipTiles 처리
      3. NextTurn 처리

* 위의 오델로 규칙 참고 문서를 보면 판정하는 로직이 복잡
  * 여기서는 최적화 신경쓰지 않고 생각나는 데로 처리 (짐승 알고리즘 보다 조금 나은 방법 사용)

* 클라이언트 콘솔 문제
  * 오델로 판을 파악하기 어려움

## 테스트 콘솔화면
* ![서버-클라이언트 오델로 콘솔](/assets/images/prototype/prototype-dotnetty-step2-othello.png)

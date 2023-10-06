---
layout: article
title: Dotnetty Prototype Step1
tags: C# Dotnetty Server Prototype
permalink: /dotnetty-server-prototype-step1
---

# 세상에서 가장 간단한 채팅 서버/클라이언트 구현하기
* 참고 문서 : [Understanding Netty using simple real-world example of Chat server client](https://itsallbinary.com/netty-project-understanding-netty-using-simple-real-world-example-of-chat-server-client-good-for-beginners/)
  * Java 이지만 C#으로 포팅진행합니다.
* Bootstrap 이란? : [나무위키 참고](https://namu.wiki/w/Bootstrap)
  * 일반적으로 한 번 시작되면 알아서 진행되는 일련의 과정

## 네티 구성요소
간단하고 높은 수준에서 Netty 서버 또는 클라이언트에는 이러한 기본 클래스가 필요합니다.
* **Program** – 이 클래스는 서버 또는 클라이언트를 부트스트랩합니다. 서버의 경우 지정된 Host/Port에서 서버를 시작합니다. 클라이언트의 경우 제공된 서버에 연결하여 연결을 생성합니다.
* **Channel Handler** – 채널 핸들러는 채널 활성, 채널 읽기 또는 예외 발생 등과 같은 다양한 이벤트를 처리합니다.

## DotNetty를 이용한 채팅 서버-클라이언트 애플리케이션
1. 콘솔 입력 기반 채팅 클라이언트 애플리케이션을 만듭니다.
2. 클라이언트를 시작할 때 우리는 그의 이름을 묻고 그 후에 다른 클라이언트에게 보낼 채팅 메시지를 받습니다.
3. 채팅 서버에 이름 및 채팅 메시지를 보냅니다.
4. 그러면 채팅 서버는 보낸 사람의 이름과 함께 해당 메시지를 모든 클라이언트에 게시합니다.

다음은 서버와 클라이언트의 구성 요소를 보여주는 다이어그램입니다. 아래 다이어그램은 한 클라이언트에서 다른 클라이언트로의 채팅 메시지 "Hello"의 통신 경로도 추적합니다.
![서버-클라이언트 채팅](/assets/images/prototype/prototype-dotnetty-chat-server-client.jpeg)

## 코딩하기
* **종속성** – DotNetty 서버 클라이언트 프레임워크를 사용하려면 다음과 같은 package가 필요합니다.
  - DotNetty.Common
  - DotNetty.Codecs
  - DotNetty.Handlers
  - DotNetty.Transport

## Bootstrapping 네티
* **ServerBootstrap** – 서버 채널을 부트스트랩하고 서버를 시작하는 코드입니다. 연결을 수신할 포트에 서버를 바인딩합니다.
* **Bootstrap** – 클라이언트 채널을 부트스트랩하는 코드입니다.
* **EventLoopGroup**
  * EventLoop들의 그룹입니다. EventLoop는 등록된 채널에 대한 모든 I/O 작업을 처리합니다.
  * ServerBootstrap에는 두 가지 유형의 EventLoopGroup, 즉 "boss"와 "worker"가 필요합니다. 클라이언트 boostrap에는 보스 그룹이 필요하지 않습니다.
  * Boss EventLoopGroup – 이 EventLoop 그룹은 들어오는 연결(connection)을 수락(accept)하고 등록(register)합니다.
  * Worker EventLoopGroup – Boss가 연결을 수락하고 이를 Worker EventLoopGroup에 등록합니다. Worker는 해당 연결을 통해 통신하는 동안 모든 이벤트를 처리합니다.
* 채널 **TcpServerSocketChannel** – Tcp Socket을 이용하여 새 연결을 허용하도록 서버를 구성합니다. 클라이언트의 경우 TcpSocketChannel을 이용합니다.
* **Decoder/Encoder(StringDecoder / StringEncoder)**
  * Netty 통신은 Byte 형식의 네트워크 소켓 채널을 통해 발생합니다. 따라서 특정 데이터형을 전송하려는 경우 데이터형을 Byte로 인코딩하는 인코더와 Byte를 데이터형로 디코딩하는 인코더를 제공합니다.
  * StringDecoder, StringEncoder는 Netty에서 제공됩니다. 하지만 필요한 모든 데이터 유형에 대해 자체 인코더나 디코더를 만들 수 있습니다.

## 소스코드
* [github project](https://github.com/snowpipe-dev/DotNettyServerSamples)

## 테스트 콘솔화면
* ![서버-클라이언트 콘솔](/assets/images/prototype/prototype-dotnetty-chat-server-client-sample.png)

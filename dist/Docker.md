# Docker
## 실행
* 컨테이너 안의 명령어 실행하기
  ```docker exec -it [ContainerId] /bin/sh```
  
## 컨테이너 삭제
* 동작중인 컨테이너들 확인하기
  ```docker ps```
* 정지된 컨테이너들 확인하기
  ```docker ps -a```
* 컨테이너 중단하기
  ```docker stop [컨테이너 id]```
* 컨테이너 삭제
  ```docker rm [컨테이너 id]```
* 컨테이너 모두 삭제
  ```docker rm `docker ps -a -q` ```
## 이미지 삭제
* 이미지들 확인하기
  ```docker images```
* 이미지 삭제하기
  ```docker rmi [이미지 id]```
* 컨테이너와 이미지 같이 삭제
  ```docker rmi -f [이미지 id]```
  
# 가상 AMR 로봇 노드 (Virtual AMR Robot Node)

ACS 시스템 관제를 테스트하기 위한 가상의 AMR 로봇 역할을 담당하는 Node.js 서버입니다.

## 기능

- AMR 로봇 상태 시뮬레이션
- 네비게이션 명령 처리
- 실시간 위치 업데이트
- 배터리 상태 시뮬레이션
- 맵 기반 경로 계획

## 설치 및 실행

### 1. 의존성 설치
```bash
cd test
npm install
```

### 2. 서버 실행
```bash
npm start
```

또는 개발 모드로 실행 (자동 재시작):
```bash
npm run dev
```

서버는 포트 5000에서 실행됩니다.

## API 엔드포인트

### 1. GET /api/v1/amr/status
로봇의 현재 상태를 조회합니다.

**응답 예시:**
```json
{
  "robot_id": "H-001",
  "robot_name": "HARM3_01",
  "robot_model": "HAMR3",
  "timestamp": "2025-01-15T09:12:34Z",
  "hw_version": "v1.0.0",
  "sw_version": "v1.0.0",
  "driving_status": 0,
  "driving_mode": 0,
  "position_x": 10.00,
  "position_y": 10.00,
  "position_theta": 0.50,
  "velocity_x": 1.00,
  "velocity_y": 1.00,
  "velocity_theta": 1.00,
  "connection_status": true,
  "order_status": 0,
  "path_status": [2, 2, 1, 1, 1],
  "battery_soc": 80.50,
  "battery_voltage": 56.50,
  "battery_soh": 100.0,
  "charging_status": true,
  "error_code": 0,
  "error_msg": ""
}
```

### 2. POST /api/v1/amr/command
로봇에게 명령을 전송합니다.

**요청 예시 (네비게이션):**
```json
{
  "action": "execute",
  "type": "navigate",
  "params": {
    "goto_node_id": "test_room"
  }
}
```

**요청 예시 (정지):**
```json
{
  "action": "stop"
}
```

**응답 예시:**
```json
{
  "robot_id": "H-001",
  "order_status": 2
}
```

### 3. GET /health
서버 상태를 확인합니다.

### 4. GET /api/v1/map/nodes (디버깅용)
사용 가능한 맵 노드 목록을 조회합니다.

## 상태 코드 설명

### driving_status
- 0: 정지
- 1: 주행중
- 2: 회전중

### driving_mode
- 0: 수동
- 1: 자동

### order_status
- 0: 대기
- 1: 작업 수신
- 2: 작업 실행중
- 3: 작업 완료
- 4: 작업 실패

### path_status
경로 상태를 나타내는 배열 (각 요소는 경로 세그먼트의 상태)
- 0: 대기
- 1: 계획됨
- 2: 실행중
- 3: 완료

## 사용 가능한 노드

맵 파일(`map1_node1_node.yaml`)에 정의된 노드들:
- `home` (index: 777): 홈 위치
- `test_room` (index: 101): 테스트 룸
- `path1`, `path2`, `path3`: 경로 노드들
- `child1`, `child2`, `child3`, `child4`: 자식 노드들

## 테스트 예시

### curl을 사용한 테스트

1. 상태 조회:
```bash
curl http://localhost:5000/api/v1/amr/status
```

2. test_room으로 이동:
```bash
curl -X POST http://localhost:5000/api/v1/amr/command \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute",
    "type": "navigate",
    "params": {
      "goto_node_id": "test_room"
    }
  }'
```

3. 로봇 정지:
```bash
curl -X POST http://localhost:5000/api/v1/amr/command \
  -H "Content-Type: application/json" \
  -d '{
    "action": "stop"
  }'
```

## 특징

- **실시간 시뮬레이션**: 로봇이 실제로 목표 지점으로 이동하는 것을 시뮬레이션
- **배터리 소모**: 주행 중 배터리가 점진적으로 감소
- **오류 처리**: 존재하지 않는 노드나 잘못된 명령에 대한 적절한 오류 응답
- **상태 추적**: 미션 실행 상태를 실시간으로 추적
- **자동 복귀**: 미션 완료 후 자동으로 대기 상태로 복귀

## 로그

서버 실행 시 다음과 같은 정보가 표시됩니다:
- 서버 시작 알림
- 로봇 정보 (ID, 초기 위치)
- API 엔드포인트 목록
- 미션 실행 및 완료 로그

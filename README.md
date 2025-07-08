# AMR 관제 시스템 (Autonomous Mobile Robot Control System)

## 프로젝트 소개

AMR(Autonomous Mobile Robot) 관제 시스템은 자율주행 로봇들을 실시간으로 모니터링하고 관제할 수 있는 3D 시각화 대시보드입니다.

### 주요 기능

- 🤖 **실시간 로봇 모니터링**: 로봇의 위치, 상태, 배터리 수준 실시간 추적
- 🎯 **미션 관리**: 로봇 임무 생성, 할당, 모니터링
- 🗺️ **3D 시각화**: Three.js 기반 3D 지하철 노선도 스타일 맵
- 📊 **대시보드**: 시스템 상태 및 통계 정보 표시
- 🔋 **배터리 관리**: 충전소 배치 및 배터리 상태 모니터링

## 기술 스택

### 백엔드
- **Node.js** + **Express.js**: RESTful API 서버
- **SQLite3**: 경량 데이터베이스
- **CORS**: 크로스 오리진 리소스 공유
- **Morgan**: HTTP 요청 로깅

### 프론트엔드
- **React 19**: 사용자 인터페이스
- **Vite**: 빠른 개발 서버 및 빌드 도구
- **Three.js**: 3D 그래픽 렌더링
- **@react-three/fiber**: React Three.js 통합
- **@react-three/drei**: Three.js 유틸리티
- **Axios**: HTTP 클라이언트

## 프로젝트 구조

```
volvo_test/
├── backend/                    # Node.js 백엔드 서버
│   ├── db/                     # SQLite 데이터베이스
│   │   └── amr.db             # 로봇 및 미션 데이터
│   ├── index.js               # 서버 진입점
│   ├── package.json           # 백엔드 의존성
│   └── package-lock.json
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── 3d/           # 3D 렌더링 컴포넌트
│   │   │   ├── layout/       # 레이아웃 컴포넌트
│   │   │   └── ui/           # UI 컴포넌트
│   │   ├── contexts/         # React Context
│   │   ├── hooks/            # Custom Hooks
│   │   ├── pages/            # 페이지 컴포넌트
│   │   ├── services/         # API 서비스
│   │   └── constants/        # 상수 정의
│   ├── package.json          # 프론트엔드 의존성
│   └── vite.config.js        # Vite 설정
├── .gitignore                 # Git 제외 파일
└── README.md                  # 프로젝트 문서
```

## 설치 및 실행

### 사전 요구사항
- Node.js 18.x 이상
- npm 또는 yarn

### 1. 저장소 클론
```bash
git clone <repository-url>
cd volvo_test
```

### 2. 백엔드 설치 및 실행
```bash
cd backend
npm install
npm run dev
```

백엔드 서버가 `http://localhost:3000`에서 실행됩니다.

### 3. 프론트엔드 설치 및 실행
새 터미널에서:
```bash
cd frontend
npm install
npm run dev
```

프론트엔드 개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 4. 브라우저에서 접속
`http://localhost:5173`에서 AMR 관제 시스템을 사용할 수 있습니다.

## API 엔드포인트

### 로봇 API
- `GET /api/robots` - 모든 로봇 정보 조회
- `GET /api/robots/:id` - 특정 로봇 정보 조회
- `PUT /api/robots/:id` - 로봇 정보 업데이트

### 미션 API
- `GET /api/missions` - 모든 미션 조회
- `GET /api/missions/:id` - 특정 미션 조회
- `POST /api/missions` - 새 미션 생성
- `PUT /api/missions/:id` - 미션 업데이트
- `DELETE /api/missions/:id` - 미션 삭제

## 사용 방법

1. **메인 페이지**: 전체 로봇 현황과 3D 맵을 확인
2. **맵 정보**: 상세한 시설 정보 및 경로 분석
3. **로그**: 시스템 활동 로그 조회
4. **설정**: 시스템 설정 관리

### 3D 맵 조작
- **마우스 드래그**: 카메라 회전
- **마우스 휠**: 줌 인/아웃
- **로봇 클릭**: 로봇 세부 정보 표시
- **뷰 모드**: 전체 보기, 로봇 추적, 경로 분석

## 개발 정보

### 백엔드 스크립트
```bash
npm start      # 프로덕션 실행
npm run dev    # 개발 모드 (nodemon)
```

### 프론트엔드 스크립트
```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # ESLint 검사
```

## 데이터베이스 스키마

### robots 테이블
```sql
CREATE TABLE robots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'idle',
    battery INTEGER DEFAULT 100,
    location_x REAL DEFAULT 0,
    location_y REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### missions 테이블
```sql
CREATE TABLE missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    robot_id INTEGER,
    mission_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    start_x REAL,
    start_y REAL,
    target_x REAL,
    target_y REAL,
    FOREIGN KEY (robot_id) REFERENCES robots(id)
);
```

## 기여 방법

1. 이 저장소를 포크합니다
2. 새 브랜치를 생성합니다 (`git checkout -b feature/새기능`)
3. 변경사항을 커밋합니다 (`git commit -am '새 기능 추가'`)
4. 브랜치에 푸시합니다 (`git push origin feature/새기능`)
5. Pull Request를 생성합니다

## 라이선스

이 프로젝트는 MIT 라이선스하에 배포됩니다.

## 문제 해결

### 일반적인 문제

1. **포트 충돌**: 백엔드 포트(3000) 또는 프론트엔드 포트(5173)가 사용 중인 경우
2. **데이터베이스 연결 오류**: `backend/db/` 폴더 권한 확인
3. **3D 렌더링 문제**: WebGL 지원 브라우저 사용 필요

### 로그 확인
- 백엔드 로그: 터미널에서 확인
- 프론트엔드 로그: 브라우저 개발자 도구 콘솔 확인

## 연락처

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해 주세요.

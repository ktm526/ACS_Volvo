// 로봇 상태
export const ROBOT_STATUS = {
  IDLE: 'idle',
  MOVING: 'moving',
  ERROR: 'error',
  CHARGING: 'charging'
};

// 임무 상태
export const MISSION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// 스테이션 타입
export const STATION_TYPES = {
  CHARGING: 'charging',
  LOADING: 'loading',
  WAITING: 'waiting'
};

// 색상 팔레트
export const COLORS = {
  PRIMARY: '#00c3ff',
  ACCENT: '#00e4ff',
  SUCCESS: '#06d6a0',
  WARNING: '#ffd166',
  ERROR: '#ef476f',
  WHITE: '#ffffff',
  DARK: '#000000'
};

// 스테이션 데이터
export const STATIONS = [
  { id: 1, name: '충전소 A', x: -8, y: 8, type: STATION_TYPES.CHARGING },
  { id: 2, name: '충전소 B', x: 8, y: -8, type: STATION_TYPES.CHARGING },
  { id: 3, name: '작업장 1', x: -8, y: -8, type: STATION_TYPES.LOADING },
  { id: 4, name: '작업장 2', x: 8, y: 8, type: STATION_TYPES.LOADING },
  { id: 5, name: '대기소', x: 0, y: 0, type: STATION_TYPES.WAITING }
];

// 경로 데이터
export const PATHS = [
  {
    id: 1,
    type: 'current',
    color: '#00e4ff',
    points: [[-2, 3], [-4, 5], [-6, 6], [-8, 8]]
  },
  {
    id: 2,
    type: 'planned',
    color: '#ffd166',
    points: [[2, -2], [4, -4], [6, -6], [8, -8]]
  },
  {
    id: 3,
    type: 'default',
    color: 'rgba(255,255,255,1)',
    points: [[-8, 8], [-4, 4], [0, 0], [4, -4], [8, -8]]
  },
  {
    id: 4,
    type: 'default',
    color: 'rgba(255,255,255,0.3)',
    points: [[-8, -8], [-4, -4], [0, 0], [4, 4], [8, 8]]
  }
];

// API 엔드포인트
export const API_ENDPOINTS = {
  ROBOTS: '/api/robots',
  MISSIONS: '/api/missions'
};

// 메뉴 아이템
export const MENU_ITEMS = [
  { id: 'main', label: '메인', path: '/' },
  { id: 'map', label: '맵 정보', path: '/map' },
  { id: 'log', label: '로그', path: '/log' },
  { id: 'settings', label: '설정', path: '/settings' }
]; 
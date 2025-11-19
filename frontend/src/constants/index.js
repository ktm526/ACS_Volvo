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
  MISSIONS: '/api/missions',
  MOVE_REQUEST: '/api/robots/move'
};

// 메뉴 아이템
export const MENU_ITEMS = [
  { id: 'main', label: '메인', path: '/' },
  { id: 'video', label: '영상', path: '/video' },
  { id: 'log', label: '로그', path: '/log' },
  { id: 'settings', label: '설정', path: '/settings' }
];

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://158.247.245.149:3000/api';

export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3000';

// 공통 상태 색상 시스템 (메인 페이지와 타임라인 통일)
export const STATUS_COLORS = {
  // 완료/성공 상태
  COMPLETED: '#22C55E',     // 녹색
  SUCCESS: '#22C55E',       // 녹색
  
  // 진행중 상태  
  IN_PROGRESS: '#3B82F6',   // 파란색
  ACTIVE: '#3B82F6',        // 파란색
  
  // 대기/시작 전 상태
  PENDING: '#9CA3AF',       // 회색
  NOT_STARTED: '#9CA3AF',   // 회색
  IDLE: '#9CA3AF',          // 회색
  
  // 오류/차단/실패 상태
  ERROR: '#EF4444',         // 빨간색
  FAILED: '#EF4444',        // 빨간색
  BLOCKED: '#EF4444',       // 빨간색
  
  // 일시정지/충전 상태
  PAUSED: '#F59E0B',        // 주황색
  CHARGING: '#F59E0B',      // 주황색
  
  // 취소 상태
  CANCELED: '#6B7280',      // 어두운 회색
  
  // 기본 상태
  DEFAULT: '#6B7280'        // 어두운 회색
};

// 로봇 상태별 색상 시스템 (새로운 order_status 기반)
export const ROBOT_STATUS_COLORS = {
  IDLE: '#22C55E',          // 녹색 (대기 - order_status: 0)
  STOP: '#EF4444',          // 빨간색 (정지 - order_status: 1)
  WORKING: '#3B82F6',       // 파란색 (작업중 - order_status: 2)
  PAUSE: '#F59E0B',         // 주황색 (일시정지 - order_status: 3)
  CHARGING: '#F59E0B',      // 주황색 (충전중)
  ERROR: '#EF4444',         // 빨간색 (오류)
  DISCONNECTED: '#6B7280',  // 회색 (연결 끊김)
  DEFAULT: '#6B7280'        // 회색 (기본)
};

// 상태별 색상 매핑 함수
export const getStatusColor = (status, type = 'mission') => {
  const normalizedStatus = status?.toLowerCase().replace('_', '');
  
  // 로봇 상태인 경우 (새로운 order_status 기반)
  if (type === 'robot') {
    switch (normalizedStatus) {
      case 'idle':
        return ROBOT_STATUS_COLORS.IDLE;
      case 'stop':
        return ROBOT_STATUS_COLORS.STOP;
      case 'working':
        return ROBOT_STATUS_COLORS.WORKING;
      case 'pause':
        return ROBOT_STATUS_COLORS.PAUSE;
      case 'charging':
        return ROBOT_STATUS_COLORS.CHARGING;
      case 'error':
        return ROBOT_STATUS_COLORS.ERROR;
      case 'disconnected':
        return ROBOT_STATUS_COLORS.DISCONNECTED;
      // 하위 호환성을 위한 기존 상태들
      case 'moving':
        return ROBOT_STATUS_COLORS.WORKING; // moving을 working으로 매핑
      default:
        return ROBOT_STATUS_COLORS.DEFAULT;
    }
  }
  
  // 미션/태스크 상태인 경우
  switch (normalizedStatus) {
    case 'completed':
    case 'success':
      return STATUS_COLORS.COMPLETED;
      
    case 'inprogress':
    case 'in_progress':
    case 'active':
      return STATUS_COLORS.IN_PROGRESS;
      
    case 'pending':
    case 'notstarted':
    case 'not_started':
    case 'idle':
      return STATUS_COLORS.PENDING;
      
    case 'error':
    case 'failed':
    case 'blocked':
      return STATUS_COLORS.ERROR;
      
    case 'paused':
    case 'charging':
      return STATUS_COLORS.PAUSED;
      
    case 'canceled':
    case 'cancelled':
      return STATUS_COLORS.CANCELED;
      
    default:
      return STATUS_COLORS.DEFAULT;
  }
};

// 상태별 아이콘 매핑 함수
export const getStatusIcon = (status) => {
  const normalizedStatus = status?.toLowerCase().replace('_', '');
  
  switch (normalizedStatus) {
    case 'completed':
    case 'success':
      return 'fas fa-check-circle';
      
    case 'inprogress':
    case 'in_progress':
    case 'active':
      return 'fas fa-spinner fa-spin';
      
    case 'pending':
    case 'notstarted':
    case 'not_started':
    case 'idle':
      return 'fas fa-clock';
      
    case 'error':
    case 'failed':
    case 'blocked':
      return 'fas fa-exclamation-triangle';
      
    case 'paused':
    case 'charging':
      return 'fas fa-pause';
      
    case 'canceled':
    case 'cancelled':
      return 'fas fa-times-circle';
      
    default:
      return 'fas fa-circle';
  }
}; 
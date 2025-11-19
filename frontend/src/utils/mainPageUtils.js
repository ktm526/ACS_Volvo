// MainPage에서 사용되는 유틸리티 함수들
import { getStatusColor as getCommonStatusColor } from '../constants';

export const getStatusColor = (status, type = 'mission') => {
  return getCommonStatusColor(status, type);
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return 'var(--status-error)';
    case 'high': return 'var(--status-warning)';
    case 'medium': return 'var(--status-info)';
    case 'low': return 'var(--text-tertiary)';
    default: return 'var(--text-secondary)';
  }
};

export const getTypeIcon = (type) => {
  switch (type) {
    case 'transport': return 'fas fa-truck';
    case 'inspection': return 'fas fa-search';
    case 'organize': return 'fas fa-boxes';
    case 'packaging': return 'fas fa-gift';
    case 'maintenance': return 'fas fa-tools';
    default: return 'fas fa-tasks';
  }
};

export const getRobotStatusIcon = (status) => {
  switch (status) {
    case 'idle': return 'fas fa-pause';        // 대기 (order_status: 0)
    case 'stop': return 'fas fa-stop';         // 정지 (order_status: 1)
    case 'working': return 'fas fa-play';      // 작업중 (order_status: 2)
    case 'pause': return 'fas fa-pause-circle'; // 일시정지 (order_status: 3)
    case 'charging': return 'fas fa-bolt';     // 충전중
    case 'error': return 'fas fa-times';       // 오류
    case 'disconnected': return 'fas fa-unlink'; // 연결 끊김
    // 하위 호환성을 위한 기존 상태들
    case 'moving': return 'fas fa-play';       // moving을 working으로 처리
    default: return 'fas fa-pause';
  }
};

export const getRobotStatusColor = (status) => {
  switch (status) {
    case 'moving': return 'var(--status-success)';
    case 'charging': return 'var(--status-warning)';
    case 'error': return 'var(--status-error)';
    case 'idle': return 'var(--status-info)';
    default: return 'var(--status-info)';
  }
};

export const calculateStats = (robots) => {
  if (!robots || robots.length === 0) {
    return {
      total: 0,
      idle: 0,
      stop: 0,
      working: 0,
      pause: 0,
      charging: 0,
      error: 0,
      averageBattery: 0
    };
  }

  return {
    total: robots.length,
    idle: robots.filter(r => r.status === 'idle').length,
    stop: robots.filter(r => r.status === 'stop').length,
    working: robots.filter(r => r.status === 'working' || r.status === 'moving').length, // moving도 working으로 카운트
    pause: robots.filter(r => r.status === 'pause').length,
    charging: robots.filter(r => r.status === 'charging').length,
    error: robots.filter(r => r.status === 'error' || r.status === 'disconnected').length,
    averageBattery: Math.round(robots.reduce((sum, r) => sum + (r.battery || 0), 0) / robots.length)
  };
};

export const calculateMissionStats = (missions) => {
  if (!missions || missions.length === 0) {
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      urgent: 0
    };
  }

  return {
    total: missions.length,
    pending: missions.filter(m => m.status === 'pending').length,
    inProgress: missions.filter(m => m.status === 'in_progress').length,
    completed: missions.filter(m => m.status === 'completed').length,
    urgent: missions.filter(m => m.priority === 'urgent').length
  };
};

export const getStatusText = (status) => {
  switch (status) {
    case 'pending': return '대기';
    case 'in_progress': return '진행중';
    case 'completed': return '완료';
    case 'failed': return '실패';
    default: return status;
  }
};

export const getPriorityText = (priority) => {
  switch (priority) {
    case 'urgent': return '긴급';
    case 'high': return '높음';
    case 'medium': return '보통';
    case 'low': return '낮음';
    default: return priority;
  }
}; 
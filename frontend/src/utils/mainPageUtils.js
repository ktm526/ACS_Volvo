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
    case 'moving': return 'fas fa-play';
    case 'charging': return 'fas fa-bolt';
    case 'error': return 'fas fa-times';
    case 'idle': return 'fas fa-pause';
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
      moving: 0,
      idle: 0,
      charging: 0,
      error: 0,
      averageBattery: 0
    };
  }

  return {
    total: robots.length,
    moving: robots.filter(r => r.status === 'moving').length,
    idle: robots.filter(r => r.status === 'idle').length,
    charging: robots.filter(r => r.status === 'charging').length,
    error: robots.filter(r => r.status === 'error').length,
    averageBattery: Math.round(robots.reduce((sum, r) => sum + r.battery, 0) / robots.length)
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
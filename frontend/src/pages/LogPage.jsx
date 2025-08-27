import React, { useState, useEffect } from 'react';
import { useRobots } from '../hooks/useRobots';
import { useMissions } from '../hooks/useMissions';
import TabComponent from '../components/log/TabComponent';
import DashboardTab from '../components/log/DashboardTab';
import LogTab from '../components/log/LogTab';

const LogPage = () => {
  const { robots } = useRobots();
  const { missions } = useMissions();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    level: 'all',
    category: 'all',
    robot: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    // 더 풍부한 모의 로그 데이터
    // 오늘 날짜로 설정된 모의 로그 데이터
    const today = new Date();
    const mockLogs = [
      {
        id: 1,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 30, 22),
        level: 'success',
        category: 'mission',
        robotId: 'Robot-001',
        message: 'A구역에서 B구역으로 물품 이송 완료',
        details: '소요시간: 12분 30초, 운반 물품: 전자부품 5박스',
        duration: 750 // 초 단위
      },
      {
        id: 2,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 28, 15),
        level: 'warning',
        category: 'system',
        robotId: 'Robot-002',
        message: '로봇 배터리 부족 경고',
        details: '배터리 잔량: 15%, 충전소로 이동 중',
        duration: null
      },
      {
        id: 3,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 25, 33),
        level: 'error',
        category: 'navigation',
        robotId: 'Robot-003',
        message: '경로 계획 실패',
        details: '목적지: C구역, 장애물 감지로 인한 재계획 필요',
        duration: null
      },
      {
        id: 4,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 22, 45),
        level: 'info',
        category: 'robot',
        robotId: 'Robot-002',
        message: '충전소 A에서 충전 시작',
        details: '예상 충전 시간: 45분',
        duration: 2700
      },
      {
        id: 5,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 20, 18),
        level: 'success',
        category: 'mission',
        robotId: 'Robot-004',
        message: '창고 정리 임무 완료',
        details: '정리된 구역: D구역, 이동된 물품: 23개',
        duration: 1800
      },
      {
        id: 6,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 45, 12),
        level: 'success',
        category: 'mission',
        robotId: 'Robot-001',
        message: '품질 검사 임무 완료',
        details: '검사 완료: 50개 제품, 불량품: 2개 발견',
        duration: 900
      },
      {
        id: 7,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 30, 5),
        level: 'info',
        category: 'system',
        robotId: 'Robot-003',
        message: '정기 점검 완료',
        details: '모든 센서 정상, 다음 점검 예정',
        duration: null
      },
      {
        id: 8,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 15, 30),
        level: 'warning',
        category: 'navigation',
        robotId: 'Robot-005',
        message: '경로 지연 발생',
        details: '예상보다 5분 지연, 다른 로봇과의 충돌 회피',
        duration: null
      },
      {
        id: 9,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 50, 18),
        level: 'success',
        category: 'mission',
        robotId: 'Robot-005',
        message: '포장 작업 완료',
        details: '포장 완료: 30박스, 출고 대기 상태',
        duration: 2100
      },
      {
        id: 10,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30, 45),
        level: 'info',
        category: 'robot',
        robotId: 'Robot-001',
        message: '작업 시작',
        details: '오늘 첫 번째 임무 시작',
        duration: null
      },
      // 더 많은 태스크 데이터 추가
      {
        id: 11,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 15, 0),
        level: 'success',
        category: 'mission',
        robotId: 'Robot-003',
        message: '물류센터 입고 작업 완료',
        details: '입고 완료: 100박스, 재고 업데이트 완료',
        duration: 3600
      },
      {
        id: 12,
        timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 30, 0),
        level: 'info',
        category: 'robot',
        robotId: 'Robot-004',
        message: '충전 완료 및 작업 준비',
        details: '배터리 100%, 첫 번째 임무 대기 중',
        duration: 1800
      }
    ];

    setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 500);
  }, []);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const filteredLogs = logs.filter(log => {
    if (filters.level !== 'all' && log.level !== filters.level) return false;
    if (filters.category !== 'all' && log.category !== filters.category) return false;
    if (filters.robot !== 'all' && log.robotId !== filters.robot) return false;
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (log.timestamp < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (log.timestamp > toDate) return false;
    }
    
    return true;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'success': return 'var(--status-success)';
      case 'info': return 'var(--status-info)';
      case 'warning': return 'var(--status-warning)';
      case 'error': return 'var(--status-error)';
      default: return 'var(--text-secondary)';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'success': return 'fas fa-check-circle';
      case 'info': return 'fas fa-info-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'error': return 'fas fa-times-circle';
      default: return 'fas fa-circle';
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  };

  // 통계 계산
  const stats = {
    totalLogs: filteredLogs.length,
    successCount: filteredLogs.filter(log => log.level === 'success').length,
    errorCount: filteredLogs.filter(log => log.level === 'error').length,
    warningCount: filteredLogs.filter(log => log.level === 'warning').length,
    totalWorkTime: filteredLogs.reduce((total, log) => total + (log.duration || 0), 0)
  };

  // 로봇별 작업 시간
  const robotWorkTime = {};
  filteredLogs.forEach(log => {
    if (log.duration && log.robotId) {
      robotWorkTime[log.robotId] = (robotWorkTime[log.robotId] || 0) + log.duration;
    }
  });

  // 로봇별 작업 건수
  const robotTaskCount = {};
  filteredLogs.forEach(log => {
    if (log.robotId) {
      robotTaskCount[log.robotId] = (robotTaskCount[log.robotId] || 0) + 1;
    }
  });

  // 고유 로봇 목록
  const uniqueRobots = [...new Set(logs.map(log => log.robotId))];

  const toggleLogExpansion = (logId) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  // 탭 설정
  const tabs = [
    { id: 'dashboard', label: '대시보드', icon: 'fas fa-chart-bar' },
    { id: 'logs', label: '로그', icon: 'fas fa-list-alt' }
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: isMobile ? 'var(--space-md)' : 'var(--space-xl)',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Pretendard, sans-serif',
      overflow: 'auto'
    }}>
      {/* 탭 컴포넌트 */}
      <TabComponent 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
      />

      {/* 탭 내용 */}
      {activeTab === 'dashboard' && (
        <DashboardTab 
          filters={filters}
          onFilterChange={handleFilterChange}
          uniqueRobots={uniqueRobots}
          stats={stats}
          formatDuration={formatDuration}
          robotWorkTime={robotWorkTime}
          robotTaskCount={robotTaskCount}
        />
      )}

      {activeTab === 'logs' && (
        <LogTab 
          filteredLogs={filteredLogs}
          expandedLogs={expandedLogs}
          onToggleExpansion={toggleLogExpansion}
          getLevelColor={getLevelColor}
          getLevelIcon={getLevelIcon}
          formatDuration={formatDuration}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}
    </div>
  );
};

export default LogPage; 
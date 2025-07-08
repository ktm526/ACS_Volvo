import React, { useState, useEffect } from 'react';
import { useRobots } from '../hooks/useRobots';
import { useMissions } from '../hooks/useMissions';

const LogPage = () => {
  const { robots } = useRobots();
  const { missions } = useMissions();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [filters, setFilters] = useState({
    level: 'all',
    category: 'all',
    robot: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    // 더 풍부한 모의 로그 데이터
    const mockLogs = [
      {
        id: 1,
        timestamp: new Date('2024-01-15 14:30:22'),
        level: 'success',
        category: 'mission',
        robotId: 'Robot-001',
        message: 'A구역에서 B구역으로 물품 이송 완료',
        details: '소요시간: 12분 30초, 운반 물품: 전자부품 5박스',
        duration: 750 // 초 단위
      },
      {
        id: 2,
        timestamp: new Date('2024-01-15 14:28:15'),
        level: 'warning',
        category: 'system',
        robotId: 'Robot-002',
        message: '로봇 배터리 부족 경고',
        details: '배터리 잔량: 15%, 충전소로 이동 중',
        duration: null
      },
      {
        id: 3,
        timestamp: new Date('2024-01-15 14:25:33'),
        level: 'error',
        category: 'navigation',
        robotId: 'Robot-003',
        message: '경로 계획 실패',
        details: '목적지: C구역, 장애물 감지로 인한 재계산 필요',
        duration: null
      },
      {
        id: 4,
        timestamp: new Date('2024-01-15 14:22:45'),
        level: 'info',
        category: 'robot',
        robotId: 'Robot-002',
        message: '충전소 A에서 충전 시작',
        details: '예상 충전 시간: 45분',
        duration: 2700
      },
      {
        id: 5,
        timestamp: new Date('2024-01-15 14:20:18'),
        level: 'success',
        category: 'mission',
        robotId: 'Robot-004',
        message: '창고 정리 임무 완료',
        details: '정리된 구역: D구역, 이동된 물품: 23개',
        duration: 1800
      },
      {
        id: 6,
        timestamp: new Date('2024-01-15 13:45:12'),
        level: 'success',
        category: 'mission',
        robotId: 'Robot-001',
        message: '품질 검사 임무 완료',
        details: '검사 완료: 50개 제품, 불량품: 2개 발견',
        duration: 900
      },
      {
        id: 7,
        timestamp: new Date('2024-01-15 13:30:05'),
        level: 'info',
        category: 'system',
        robotId: 'Robot-003',
        message: '정기 점검 완료',
        details: '모든 센서 정상, 다음 점검: 2024-01-22',
        duration: null
      },
      {
        id: 8,
        timestamp: new Date('2024-01-15 12:15:30'),
        level: 'warning',
        category: 'navigation',
        robotId: 'Robot-005',
        message: '경로 지연 발생',
        details: '예상보다 5분 지연, 다른 로봇과의 충돌 회피',
        duration: null
      },
      {
        id: 9,
        timestamp: new Date('2024-01-15 11:50:18'),
        level: 'success',
        category: 'mission',
        robotId: 'Robot-005',
        message: '포장 작업 완료',
        details: '포장 완료: 30박스, 출고 대기 상태',
        duration: 2100
      },
      {
        id: 10,
        timestamp: new Date('2024-01-15 10:30:45'),
        level: 'info',
        category: 'robot',
        robotId: 'Robot-001',
        message: '작업 시작',
        details: '오늘 첫 번째 임무 시작',
        duration: null
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

  // 시간대별 활동
  const hourlyActivity = {};
  filteredLogs.forEach(log => {
    const hour = log.timestamp.getHours();
    hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
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

  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: 'var(--space-xl)',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Pretendard, sans-serif',
      overflow: 'auto'
    }}>
      {/* 통계 대시보드 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 'var(--space-md)', 
        marginBottom: 'var(--space-xl)' 
      }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ 
              padding: 'var(--space-md)', 
              backgroundColor: 'var(--status-info)20', 
              borderRadius: 'var(--radius-lg)',
              color: 'var(--status-info)'
            }}>
              <i className="fas fa-list" style={{ fontSize: 'var(--font-size-xl)' }}></i>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>{stats.totalLogs}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>총 로그</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ 
              padding: 'var(--space-md)', 
              backgroundColor: 'var(--status-success)20', 
              borderRadius: 'var(--radius-lg)',
              color: 'var(--status-success)'
            }}>
              <i className="fas fa-check-circle" style={{ fontSize: 'var(--font-size-xl)' }}></i>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>{stats.successCount}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>성공</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ 
              padding: 'var(--space-md)', 
              backgroundColor: 'var(--status-error)20', 
              borderRadius: 'var(--radius-lg)',
              color: 'var(--status-error)'
            }}>
              <i className="fas fa-times-circle" style={{ fontSize: 'var(--font-size-xl)' }}></i>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>{stats.errorCount}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>오류</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ 
              padding: 'var(--space-md)', 
              backgroundColor: 'var(--primary-color)20', 
              borderRadius: 'var(--radius-lg)',
              color: 'var(--primary-color)'
            }}>
              <i className="fas fa-clock" style={{ fontSize: 'var(--font-size-xl)' }}></i>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>{formatDuration(stats.totalWorkTime)}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>총 작업시간</div>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fas fa-filter"></i>
            필터 및 검색
          </div>
        </div>
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            {/* 레벨 필터 */}
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
                로그 레벨
              </label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                <option value="all">전체</option>
                <option value="success">성공</option>
                <option value="info">정보</option>
                <option value="warning">경고</option>
                <option value="error">오류</option>
              </select>
            </div>

            {/* 카테고리 필터 */}
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
                카테고리
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                <option value="all">전체</option>
                <option value="mission">임무</option>
                <option value="robot">로봇</option>
                <option value="system">시스템</option>
                <option value="navigation">네비게이션</option>
              </select>
            </div>

            {/* 로봇 필터 */}
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
                로봇
              </label>
              <select
                value={filters.robot}
                onChange={(e) => handleFilterChange('robot', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                <option value="all">전체</option>
                {uniqueRobots.map(robot => (
                  <option key={robot} value={robot}>{robot}</option>
                ))}
              </select>
            </div>

            {/* 시작 날짜 */}
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
                시작 날짜
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)'
                }}
              />
            </div>

            {/* 종료 날짜 */}
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
                종료 날짜
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-xl)' }}>
        {/* 로그 목록 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-list-alt"></i>
              활동 로그 ({filteredLogs.length})
            </div>
          </div>
          <div className="card-content">
            <div style={{
              maxHeight: '600px',
              overflowY: 'auto',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)'
            }}>
              {filteredLogs.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--font-size-lg)',
                  padding: 'var(--space-2xl)'
                }}>
                  필터 조건에 맞는 로그가 없습니다.
                </div>
              ) : (
                filteredLogs.map((log, index) => {
                  const isExpanded = expandedLogs.has(log.id);
                  return (
                    <div key={log.id}>
                      {/* 메인 로그 행 */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: 'var(--space-md) var(--space-lg)',
                          borderBottom: index < filteredLogs.length - 1 ? '1px solid var(--border-primary)' : 'none',
                          backgroundColor: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                          cursor: log.details ? 'pointer' : 'default',
                          transition: 'background-color 0.2s ease',
                          minHeight: '60px'
                        }}
                        onClick={() => log.details && toggleLogExpansion(log.id)}
                        onMouseEnter={(e) => {
                          if (log.details) {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)';
                        }}
                      >
                        {/* 시간 */}
                        <div style={{
                          width: '80px',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-tertiary)',
                          fontFamily: 'monospace',
                          flexShrink: 0
                        }}>
                          {log.timestamp.toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>

                        {/* 레벨 */}
                        <div style={{
                          width: '70px',
                          flexShrink: 0,
                          marginRight: 'var(--space-md)'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            padding: 'var(--space-xs) var(--space-sm)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            backgroundColor: getLevelColor(log.level),
                            color: 'white',
                            minWidth: '50px',
                            textAlign: 'center'
                          }}>
                            {log.level === 'success' ? '성공' :
                             log.level === 'error' ? '오류' :
                             log.level === 'warning' ? '경고' : '정보'}
                          </span>
                        </div>

                        {/* 로봇 */}
                        <div style={{
                          width: '100px',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--primary-color)',
                          fontWeight: '600',
                          flexShrink: 0,
                          marginRight: 'var(--space-md)'
                        }}>
                          {log.robotId}
                        </div>

                        {/* 카테고리 */}
                        <div style={{
                          width: '80px',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          fontWeight: '500',
                          flexShrink: 0,
                          marginRight: 'var(--space-md)'
                        }}>
                          {log.category === 'mission' ? '임무' :
                           log.category === 'robot' ? '로봇' :
                           log.category === 'system' ? '시스템' : '네비게이션'}
                        </div>

                        {/* 메시지 */}
                        <div style={{
                          flex: 1,
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-primary)',
                          lineHeight: '1.4',
                          paddingRight: 'var(--space-md)'
                        }}>
                          {log.message}
                        </div>

                        {/* 소요시간 */}
                        <div style={{
                          width: '80px',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-tertiary)',
                          textAlign: 'right',
                          flexShrink: 0,
                          marginRight: 'var(--space-md)'
                        }}>
                          {log.duration ? formatDuration(log.duration) : '-'}
                        </div>

                        {/* 확장 표시 */}
                        {log.details && (
                          <div style={{
                            width: '20px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexShrink: 0
                          }}>
                            <i 
                              className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}
                              style={{
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--text-tertiary)',
                                transition: 'transform 0.2s ease'
                              }}
                            ></i>
                          </div>
                        )}
                      </div>

                      {/* 확장 상세 정보 */}
                      {log.details && isExpanded && (
                        <div style={{
                          padding: 'var(--space-md) var(--space-lg)',
                          backgroundColor: 'var(--bg-tertiary)',
                          borderBottom: index < filteredLogs.length - 1 ? '1px solid var(--border-primary)' : 'none',
                          borderLeft: `4px solid ${getLevelColor(log.level)}`
                        }}>
                          <div style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--space-xs)',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            상세 정보
                          </div>
                          <div style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-primary)',
                            lineHeight: '1.5',
                            marginLeft: 'var(--space-lg)'
                          }}>
                            {log.details}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* 로봇별 작업시간 */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fas fa-robot"></i>
                로봇별 작업시간
              </div>
            </div>
            <div className="card-content">
              {Object.keys(robotWorkTime).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                  작업시간 데이터가 없습니다.
                </div>
              ) : (
                Object.entries(robotWorkTime)
                  .sort(([,a], [,b]) => b - a)
                  .map(([robotId, workTime]) => (
                    <div key={robotId} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 'var(--space-sm) 0',
                      borderBottom: '1px solid var(--border-primary)'
                    }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>{robotId}</span>
                      <span style={{ 
                        fontSize: 'var(--font-size-sm)', 
                        color: 'var(--primary-color)',
                        fontWeight: '600'
                      }}>
                        {formatDuration(workTime)}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* 시간대별 활동 */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fas fa-chart-bar"></i>
                시간대별 활동
              </div>
            </div>
            <div className="card-content">
              {Object.keys(hourlyActivity).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                  활동 데이터가 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  {Object.entries(hourlyActivity)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([hour, count]) => {
                      const maxCount = Math.max(...Object.values(hourlyActivity));
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={hour} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <span style={{ 
                            fontSize: 'var(--font-size-xs)', 
                            minWidth: '40px',
                            color: 'var(--text-secondary)'
                          }}>
                            {hour}시
                          </span>
                          <div style={{
                            flex: 1,
                            height: '8px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: 'var(--primary-color)',
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                          <span style={{ 
                            fontSize: 'var(--font-size-xs)', 
                            minWidth: '20px',
                            color: 'var(--text-secondary)',
                            textAlign: 'right'
                          }}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogPage; 
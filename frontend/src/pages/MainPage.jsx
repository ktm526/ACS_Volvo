import React, { useState, useEffect } from 'react';
import Scene3D from '../components/3d/Scene3D';
import { useRobots } from '../hooks/useRobots';
import { useMissions } from '../hooks/useMissions';
import { useAppContext } from '../contexts/AppContext.jsx';

const MainPage = () => {
  const { robots, loading: robotsLoading, error: robotsError } = useRobots();
  const { missions, loading: missionsLoading, error: missionsError } = useMissions();
  const { state } = useAppContext();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedRobot, setSelectedRobot] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [liveDataEnabled, setLiveDataEnabled] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('robots'); // 'robots' 또는 'missions'

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 가상 실시간 데이터 시뮬레이션
  const [simulatedRobots, setSimulatedRobots] = useState([
    {
      id: 'Robot-001',
      name: 'AGV-Alpha',
      status: 'moving',
      location_x: -5,
      location_y: 3,
      battery: 85,
      currentMission: '물품 운반 중',
      destination: '작업장 B',
      speed: 1.2,
      path: [[-5, 3], [-3, 3], [-1, 3], [1, 3], [3, 3], [5, 3]],
      currentPathIndex: 2,
      estimatedTime: '3분 15초'
    },
    {
      id: 'Robot-002',
      name: 'AGV-Beta',
      status: 'charging',
      location_x: -8,
      location_y: 8,
      battery: 15,
      currentMission: '충전 중',
      destination: '충전소 A',
      speed: 0,
      path: [],
      currentPathIndex: 0,
      estimatedTime: '45분'
    },
    {
      id: 'Robot-003',
      name: 'AGV-Gamma',
      status: 'idle',
      location_x: 0,
      location_y: 0,
      battery: 67,
      currentMission: '대기 중',
      destination: null,
      speed: 0,
      path: [],
      currentPathIndex: 0,
      estimatedTime: null
    },
    {
      id: 'Robot-004',
      name: 'AGV-Delta',
      status: 'moving',
      location_x: 6,
      location_y: -4,
      battery: 92,
      currentMission: '검수 작업',
      destination: '검수장 C',
      speed: 0.8,
      path: [[6, -4], [4, -4], [2, -4], [0, -4], [-2, -4], [-4, -4]],
      currentPathIndex: 1,
      estimatedTime: '7분 30초'
    },
    {
      id: 'Robot-005',
      name: 'AGV-Echo',
      status: 'error',
      location_x: 2,
      location_y: -6,
      battery: 43,
      currentMission: '오류 발생',
      destination: null,
      speed: 0,
      path: [],
      currentPathIndex: 0,
      estimatedTime: null
    }
  ]);

  // 가상 작업 목록 데이터
  const [simulatedMissions, setSimulatedMissions] = useState([
    {
      id: 'MISSION-001',
      title: '물품 운반 작업',
      status: 'in_progress',
      assignedRobot: 'Robot-001',
      robotName: 'AGV-Alpha',
      priority: 'high',
      type: 'transport',
      startLocation: 'A구역',
      endLocation: '작업장 B',
      startTime: new Date('2024-01-15 14:15:00'),
      estimatedCompletion: new Date('2024-01-15 14:35:00'),
      progress: 65,
      description: '전자부품 5박스를 A구역에서 작업장 B로 이송'
    },
    {
      id: 'MISSION-002',
      title: '검수 작업',
      status: 'in_progress',
      assignedRobot: 'Robot-004',
      robotName: 'AGV-Delta',
      priority: 'medium',
      type: 'inspection',
      startLocation: '검수장 C',
      endLocation: '검수장 C',
      startTime: new Date('2024-01-15 14:00:00'),
      estimatedCompletion: new Date('2024-01-15 14:40:00'),
      progress: 45,
      description: '완제품 50개 품질 검사'
    },
    {
      id: 'MISSION-003',
      title: '창고 정리',
      status: 'completed',
      assignedRobot: 'Robot-005',
      robotName: 'AGV-Echo',
      priority: 'low',
      type: 'organize',
      startLocation: 'D구역',
      endLocation: 'D구역',
      startTime: new Date('2024-01-15 13:30:00'),
      estimatedCompletion: new Date('2024-01-15 14:00:00'),
      progress: 100,
      description: 'D구역 물품 정리 및 재배치'
    },
    {
      id: 'MISSION-004',
      title: '포장 작업',
      status: 'completed',
      assignedRobot: 'Robot-005',
      robotName: 'AGV-Echo',
      priority: 'medium',
      type: 'packaging',
      startLocation: '포장실',
      endLocation: '출고대기실',
      startTime: new Date('2024-01-15 11:30:00'),
      estimatedCompletion: new Date('2024-01-15 12:30:00'),
      progress: 100,
      description: '완제품 30박스 포장 및 출고 준비'
    },
    {
      id: 'MISSION-005',
      title: '긴급 배송',
      status: 'pending',
      assignedRobot: null,
      robotName: null,
      priority: 'urgent',
      type: 'transport',
      startLocation: '긴급창고',
      endLocation: '출고구',
      startTime: null,
      estimatedCompletion: null,
      progress: 0,
      description: '긴급 주문 건 즉시 배송 필요'
    },
    {
      id: 'MISSION-006',
      title: '정기 점검',
      status: 'pending',
      assignedRobot: 'Robot-003',
      robotName: 'AGV-Gamma',
      priority: 'low',
      type: 'maintenance',
      startLocation: '점검소',
      endLocation: '점검소',
      startTime: new Date('2024-01-15 16:00:00'),
      estimatedCompletion: new Date('2024-01-15 16:30:00'),
      progress: 0,
      description: '정기 시스템 점검 및 센서 교정'
    }
  ]);

  // 로봇 위치 시뮬레이션 업데이트
  useEffect(() => {
    if (!liveDataEnabled) return;

    const interval = setInterval(() => {
      setSimulatedRobots(prev => prev.map(robot => {
        if (robot.status === 'moving' && robot.path.length > 0) {
          const nextIndex = (robot.currentPathIndex + 1) % robot.path.length;
          const nextPos = robot.path[nextIndex];
          return {
            ...robot,
            location_x: nextPos[0],
            location_y: nextPos[1],
            currentPathIndex: nextIndex
          };
        }
        return robot;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [liveDataEnabled]);

  // 통계 계산
  const activeRobots = simulatedRobots || robots || [];
  const activeMissions = simulatedMissions || missions || [];
  
  const stats = {
    total: activeRobots.length,
    moving: activeRobots.filter(r => r.status === 'moving').length,
    idle: activeRobots.filter(r => r.status === 'idle').length,
    charging: activeRobots.filter(r => r.status === 'charging').length,
    error: activeRobots.filter(r => r.status === 'error').length,
    averageBattery: activeRobots.length > 0 ? Math.round(activeRobots.reduce((sum, r) => sum + r.battery, 0) / activeRobots.length) : 0
  };

  const missionStats = {
    total: activeMissions.length,
    pending: activeMissions.filter(m => m.status === 'pending').length,
    inProgress: activeMissions.filter(m => m.status === 'in_progress').length,
    completed: activeMissions.filter(m => m.status === 'completed').length,
    urgent: activeMissions.filter(m => m.priority === 'urgent').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'var(--status-warning)';
      case 'in_progress': return 'var(--status-info)';
      case 'completed': return 'var(--status-success)';
      case 'failed': return 'var(--status-error)';
      default: return 'var(--text-secondary)';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'var(--status-error)';
      case 'high': return 'var(--status-warning)';
      case 'medium': return 'var(--status-info)';
      case 'low': return 'var(--text-tertiary)';
      default: return 'var(--text-secondary)';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'transport': return 'fas fa-truck';
      case 'inspection': return 'fas fa-search';
      case 'organize': return 'fas fa-boxes';
      case 'packaging': return 'fas fa-gift';
      case 'maintenance': return 'fas fa-tools';
      default: return 'fas fa-tasks';
    }
  };

  // 로딩 상태
  if (robotsLoading || missionsLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: 'var(--bg-primary)',
        flexDirection: 'column',
        gap: 'var(--space-lg)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid var(--primary-color)20',
          borderTop: '4px solid var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-lg)',
          fontWeight: '500'
        }}>
          시스템 초기화 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Pretendard, sans-serif',
      overflow: 'hidden'
    }}>
      {/* 상단 컨트롤 바 */}
      <div style={{
        height: '80px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-xl)',
        flexShrink: 0
      }}>
        {/* 왼쪽: 시스템 상태 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            backgroundColor: 'var(--status-success)20',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--status-success)30'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-success)',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600' }}>
              시스템 정상
            </span>
          </div>
          
          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-tertiary)',
            fontFamily: 'monospace'
          }}>
            {currentTime.toLocaleString('ko-KR')}
          </div>
        </div>

        {/* 중앙: 뷰 모드 전환 */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-pill)',
          padding: 'var(--space-xs)'
        }}>
          {[
            { id: 'overview', label: '전체 보기', icon: 'fas fa-th-large' },
            { id: 'robot-focus', label: '로봇 추적', icon: 'fas fa-crosshairs' },
            { id: 'path-view', label: '경로 분석', icon: 'fas fa-route' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-sm) var(--space-lg)',
                backgroundColor: viewMode === mode.id ? 'var(--primary-color)' : 'transparent',
                color: viewMode === mode.id ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <i className={mode.icon}></i>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* 우측: 라이브 데이터 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={liveDataEnabled}
              onChange={(e) => setLiveDataEnabled(e.target.checked)}
              style={{ display: 'none' }}
            />
            <div style={{
              width: '40px',
              height: '20px',
              backgroundColor: liveDataEnabled ? 'var(--primary-color)' : 'var(--bg-tertiary)',
              borderRadius: '10px',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                backgroundColor: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                left: liveDataEnabled ? '22px' : '2px',
                transition: 'all 0.2s ease'
              }}></div>
            </div>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
              실시간 데이터
            </span>
          </label>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 왼쪽 사이드바 - 로봇 정보 */}
        <div style={{
          width: '350px',
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-primary)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 탭 헤더 */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            <button
              onClick={() => setSidebarTab('robots')}
              style={{
                flex: 1,
                padding: 'var(--space-md)',
                backgroundColor: sidebarTab === 'robots' ? 'var(--bg-secondary)' : 'transparent',
                border: 'none',
                borderBottom: sidebarTab === 'robots' ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: sidebarTab === 'robots' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)'
              }}
            >
              <i className="fas fa-robot"></i>
              <span>로봇 현황</span>
            </button>
            <button
              onClick={() => setSidebarTab('missions')}
              style={{
                flex: 1,
                padding: 'var(--space-md)',
                backgroundColor: sidebarTab === 'missions' ? 'var(--bg-secondary)' : 'transparent',
                border: 'none',
                borderBottom: sidebarTab === 'missions' ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: sidebarTab === 'missions' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)'
              }}
            >
              <i className="fas fa-tasks"></i>
              <span>작업 목록</span>
            </button>
          </div>

          {/* 통계 헤더 */}
          <div style={{
            padding: 'var(--space-lg)',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            <h3 style={{
              margin: 0,
              marginBottom: 'var(--space-md)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              {sidebarTab === 'robots' ? '로봇 현황' : '작업 현황'}
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-md)'
            }}>
              {sidebarTab === 'robots' ? (
                <>
                  <div style={{
                    padding: 'var(--space-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: '700',
                      color: 'var(--primary-color)'
                    }}>
                      {stats.total}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    }}>
                      총 로봇
                    </div>
                  </div>

                  <div style={{
                    padding: 'var(--space-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: '700',
                      color: 'var(--status-success)'
                    }}>
                      {stats.moving}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    }}>
                      작업 중
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    padding: 'var(--space-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: '700',
                      color: 'var(--primary-color)'
                    }}>
                      {missionStats.total}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    }}>
                      총 작업
                    </div>
                  </div>

                  <div style={{
                    padding: 'var(--space-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: '700',
                      color: 'var(--status-info)'
                    }}>
                      {missionStats.inProgress}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    }}>
                      진행 중
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 컨텐츠 영역 */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--space-md)'
          }}>
            {sidebarTab === 'robots' ? (
              // 로봇 목록
              activeRobots.map(robot => (
                <div
                  key={robot.id}
                  onClick={() => setSelectedRobot(robot.id === selectedRobot ? null : robot.id)}
                  style={{
                    padding: 'var(--space-md)',
                    marginBottom: 'var(--space-sm)',
                    backgroundColor: selectedRobot === robot.id ? 'var(--primary-color)20' : 'var(--bg-tertiary)',
                    border: selectedRobot === robot.id ? '1px solid var(--primary-color)' : '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRobot !== robot.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-quaternary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRobot !== robot.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                >
                  {/* 로봇 헤더 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: robot.status === 'moving' ? 'var(--status-success)' :
                                       robot.status === 'charging' ? 'var(--status-warning)' :
                                       robot.status === 'error' ? 'var(--status-error)' : 'var(--status-info)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <i className={
                          robot.status === 'moving' ? 'fas fa-play' :
                          robot.status === 'charging' ? 'fas fa-bolt' :
                          robot.status === 'error' ? 'fas fa-times' : 'fas fa-pause'
                        }></i>
                      </div>
                      <div>
                        <div style={{
                          fontSize: 'var(--font-size-base)',
                          fontWeight: '600',
                          color: 'var(--text-primary)'
                        }}>
                          {robot.name || robot.id}
                        </div>
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-tertiary)'
                        }}>
                          {robot.id}
                        </div>
                      </div>
                    </div>

                    {/* 배터리 표시 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-xs)'
                    }}>
                      <div style={{
                        width: '30px',
                        height: '12px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '2px',
                        position: 'relative',
                        border: '1px solid var(--border-primary)'
                      }}>
                        <div style={{
                          width: `${robot.battery}%`,
                          height: '100%',
                          backgroundColor: robot.battery > 50 ? 'var(--status-success)' :
                                         robot.battery > 20 ? 'var(--status-warning)' : 'var(--status-error)',
                          borderRadius: '1px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)',
                        fontWeight: '600'
                      }}>
                        {robot.battery}%
                      </span>
                    </div>
                  </div>

                  {/* 현재 상태 */}
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    {robot.currentMission}
                  </div>

                  {/* 위치 정보 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-tertiary)'
                  }}>
                    <span>위치: ({robot.location_x}, {robot.location_y})</span>
                    {robot.estimatedTime && (
                      <span>예상: {robot.estimatedTime}</span>
                    )}
                  </div>

                  {/* 확장된 정보 (선택된 로봇) */}
                  {selectedRobot === robot.id && (
                    <div style={{
                      marginTop: 'var(--space-md)',
                      paddingTop: 'var(--space-md)',
                      borderTop: '1px solid var(--border-primary)'
                    }}>
                      {robot.destination && (
                        <div style={{ marginBottom: 'var(--space-sm)' }}>
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-tertiary)',
                            fontWeight: '600'
                          }}>
                            목적지: 
                          </span>
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-primary)',
                            marginLeft: 'var(--space-xs)'
                          }}>
                            {robot.destination}
                          </span>
                        </div>
                      )}
                      
                      {robot.speed > 0 && (
                        <div style={{ marginBottom: 'var(--space-sm)' }}>
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-tertiary)',
                            fontWeight: '600'
                          }}>
                            속도: 
                          </span>
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-primary)',
                            marginLeft: 'var(--space-xs)'
                          }}>
                            {robot.speed} m/s
                          </span>
                        </div>
                      )}

                      {robot.path.length > 0 && (
                        <div>
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-tertiary)',
                            fontWeight: '600'
                          }}>
                            경로: 
                          </span>
                          <span style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-primary)',
                            marginLeft: 'var(--space-xs)'
                          }}>
                            {robot.currentPathIndex + 1}/{robot.path.length} 포인트
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              // 작업 목록
              activeMissions.map(mission => (
                <div
                  key={mission.id}
                  style={{
                    padding: 'var(--space-md)',
                    marginBottom: 'var(--space-sm)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-quaternary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                >
                  {/* 작업 헤더 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(mission.status) + '20',
                        border: `1px solid ${getStatusColor(mission.status)}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getStatusColor(mission.status)
                      }}>
                        <i className={getTypeIcon(mission.type)}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 'var(--font-size-base)',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--space-xs)'
                        }}>
                          {mission.title}
                        </div>
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-tertiary)'
                        }}>
                          {mission.id}
                        </div>
                      </div>
                    </div>

                    {/* 우선순위 표시 */}
                    <div style={{
                      padding: 'var(--space-xs) var(--space-sm)',
                      backgroundColor: getPriorityColor(mission.priority) + '20',
                      border: `1px solid ${getPriorityColor(mission.priority)}30`,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600',
                      color: getPriorityColor(mission.priority),
                      textTransform: 'uppercase'
                    }}>
                      {mission.priority === 'urgent' ? '긴급' :
                       mission.priority === 'high' ? '높음' :
                       mission.priority === 'medium' ? '보통' : '낮음'}
                    </div>
                  </div>

                  {/* 상태 및 진행률 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    <span style={{
                      padding: 'var(--space-xs) var(--space-sm)',
                      backgroundColor: getStatusColor(mission.status) + '20',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600',
                      color: getStatusColor(mission.status),
                      textTransform: 'uppercase'
                    }}>
                      {mission.status === 'pending' ? '대기' :
                       mission.status === 'in_progress' ? '진행중' :
                       mission.status === 'completed' ? '완료' : '실패'}
                    </span>
                    
                    {mission.status === 'in_progress' && (
                      <div style={{ flex: 1 }}>
                        <div style={{
                          height: '6px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${mission.progress}%`,
                            height: '100%',
                            backgroundColor: 'var(--status-info)',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-tertiary)',
                          textAlign: 'right',
                          marginTop: 'var(--space-xs)'
                        }}>
                          {mission.progress}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 할당된 로봇 */}
                  {mission.assignedRobot && (
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-xs)'
                    }}>
                      <i className="fas fa-robot" style={{ marginRight: 'var(--space-xs)' }}></i>
                      {mission.robotName} ({mission.assignedRobot})
                    </div>
                  )}

                  {/* 위치 정보 */}
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-tertiary)',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    <i className="fas fa-map-marker-alt" style={{ marginRight: 'var(--space-xs)' }}></i>
                    {mission.startLocation} → {mission.endLocation}
                  </div>

                  {/* 시간 정보 */}
                  {mission.startTime && (
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)'
                    }}>
                      <i className="fas fa-clock" style={{ marginRight: 'var(--space-xs)' }}></i>
                      {mission.startTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      {mission.estimatedCompletion && (
                        <span> - {mission.estimatedCompletion.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 중앙: 3D 뷰 */}
        <div style={{
          flex: 1,
          position: 'relative',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <Scene3D 
            robots={activeRobots}
            missions={activeMissions}
            viewMode={viewMode}
            selectedRobot={selectedRobot}
            showPaths={true}
            showStations={true}
            showGrid={true}
            showLabels={true}
          />
          
          {/* 3D 뷰 오버레이 정보 */}
          <div style={{
            position: 'absolute',
            top: 'var(--space-lg)',
            right: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)'
          }}>
            {/* 범례 */}
            <div style={{
              padding: 'var(--space-md)',
              backgroundColor: 'var(--bg-overlay)',
              backdropFilter: 'blur(10px)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)'
            }}>
              <h4 style={{
                margin: 0,
                marginBottom: 'var(--space-sm)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                범례
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                {[
                  { color: 'var(--status-success)', label: '작업 중', icon: 'fas fa-play' },
                  { color: 'var(--status-warning)', label: '충전 중', icon: 'fas fa-bolt' },
                  { color: 'var(--status-info)', label: '대기 중', icon: 'fas fa-pause' },
                  { color: 'var(--status-error)', label: '오류', icon: 'fas fa-times' }
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    fontSize: 'var(--font-size-xs)'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className={item.icon} style={{ 
                        fontSize: '6px', 
                        color: 'white' 
                      }}></i>
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 시스템 메트릭스 */}
            <div style={{
              padding: 'var(--space-md)',
              backgroundColor: 'var(--bg-overlay)',
              backdropFilter: 'blur(10px)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)'
            }}>
              <h4 style={{
                margin: 0,
                marginBottom: 'var(--space-sm)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                시스템 지표
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-xs)'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>평균 배터리</span>
                  <span style={{ 
                    color: 'var(--text-primary)', 
                    fontWeight: '600' 
                  }}>
                    {stats.averageBattery}%
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-xs)'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>활성화율</span>
                  <span style={{ 
                    color: 'var(--text-primary)', 
                    fontWeight: '600' 
                  }}>
                    {Math.round((stats.moving / stats.total) * 100)}%
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-xs)'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>오류율</span>
                  <span style={{ 
                    color: stats.error > 0 ? 'var(--status-error)' : 'var(--status-success)', 
                    fontWeight: '600' 
                  }}>
                    {Math.round((stats.error / stats.total) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default MainPage; 
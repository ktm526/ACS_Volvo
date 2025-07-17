import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';

const MapControls = ({ 
  robots = [], 
  onViewModeChange,
  onZoomChange,
  onRobotTrack,
  viewMode = 'overview',
  trackedRobot = null,
  zoomLevel = 1,
  className = '',
  availableMaps = [],
  selectedMap = null,
  onMapSelect,
  mapLoading = false
}) => {
  const { state } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRobotList, setShowRobotList] = useState(false);
  const [showMapList, setShowMapList] = useState(false);
  const controlsRef = useRef(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target)) {
        setShowRobotList(false);
        setShowMapList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewModeToggle = () => {
    const newMode = viewMode === 'overview' ? 'angled' : 'overview';
    onViewModeChange?.(newMode);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.5, 3);
    onZoomChange?.(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.5, 0.5);
    onZoomChange?.(newZoom);
  };

  const handleRobotSelect = (robotId) => {
    onRobotTrack?.(robotId === trackedRobot ? null : robotId);
    setShowRobotList(false);
  };

  const handleMapSelect = (map) => {
    onMapSelect?.(map);
    setShowMapList(false);
  };

  const getViewModeIcon = () => {
    return viewMode === 'overview' ? 'fa-eye' : 'fa-cube';
  };

  const getViewModeText = () => {
    return viewMode === 'overview' ? '탑뷰' : '기울임';
  };

  // 활성화된 로봇들만 필터링
  const activeRobots = robots.filter(robot => 
    robot.status === 'moving' || robot.status === 'working' || robot.status === 'idle'
  );

  return (
    <div 
      ref={controlsRef}
      className={`map-controls ${className}`}
      style={{
        position: 'absolute',
        top: 'var(--space-lg)',
        right: 'var(--space-lg)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
        userSelect: 'none'
      }}
    >
      {/* 메인 컨트롤 패널 */}
      <div style={{
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-primary)',
        borderRadius: '12px',
        padding: 'var(--space-sm)',
        boxShadow: 'var(--shadow-glow)',
        transition: 'all 0.3s ease'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isExpanded ? 'var(--space-sm)' : '0',
          padding: '4px 0'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)'
          }}>
            <i className="fas fa-map" style={{ fontSize: '10px' }}></i>
            지도 컨트롤
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'var(--primary-color)';
              e.target.style.background = 'rgba(0, 212, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'var(--text-secondary)';
              e.target.style.background = 'none';
            }}
          >
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
          </button>
        </div>

        {/* 확장된 컨트롤들 */}
        {isExpanded && (
          <>
            {/* 맵 선택 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-sm)',
              padding: '8px 0',
              borderBottom: '1px solid var(--border-primary)',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                minWidth: '40px'
              }}>
                맵:
              </div>
              <button
                onClick={() => setShowMapList(!showMapList)}
                disabled={mapLoading}
                style={{
                  background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: mapLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  minWidth: '120px',
                  justifyContent: 'space-between',
                  opacity: mapLoading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!mapLoading) {
                    e.target.style.background = 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 212, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!mapLoading) {
                    e.target.style.background = 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <i className="fas fa-map" style={{ fontSize: '10px' }}></i>
                  <span style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    maxWidth: '80px'
                  }}>
                    {mapLoading ? '로딩...' : selectedMap?.name || '맵 선택'}
                  </span>
                </div>
                <i className={`fas fa-chevron-${showMapList ? 'up' : 'down'}`} style={{ fontSize: '10px' }}></i>
              </button>
              
              {/* 맵 드롭다운 */}
              {showMapList && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '48px',
                  right: 0,
                  background: 'var(--bg-overlay)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  padding: 'var(--space-xs)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 1001,
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {availableMaps.length > 0 ? (
                    availableMaps.map((map) => (
                      <button
                        key={map.id}
                        onClick={() => handleMapSelect(map)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: selectedMap?.id === map.id ? 'var(--primary-color)20' : 'transparent',
                          border: selectedMap?.id === map.id ? '1px solid var(--primary-color)' : '1px solid transparent',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-xs)',
                          marginBottom: '2px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'var(--primary-color)30';
                          e.target.style.borderColor = 'var(--primary-color)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = selectedMap?.id === map.id ? 'var(--primary-color)20' : 'transparent';
                          e.target.style.borderColor = selectedMap?.id === map.id ? 'var(--primary-color)' : 'transparent';
                        }}
                      >
                        <i className="fas fa-map" style={{ fontSize: '10px' }}></i>
                        <span style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          flex: 1
                        }}>
                          {map.name}
                        </span>
                        {selectedMap?.id === map.id && (
                          <i className="fas fa-check" style={{ fontSize: '10px', color: 'var(--primary-color)' }}></i>
                        )}
                      </button>
                    ))
                  ) : (
                    <div style={{
                      padding: '8px 12px',
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                      textAlign: 'center'
                    }}>
                      사용 가능한 맵이 없습니다
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 뷰 모드 전환 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-sm)',
              padding: '8px 0',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                minWidth: '40px'
              }}>
                시점:
              </div>
              <button
                onClick={handleViewModeToggle}
                style={{
                  background: 'linear-gradient(135deg, var(--primary-color)20, var(--primary-color)10)',
                  border: '1px solid var(--primary-color)40',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  minWidth: '70px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, var(--primary-color)30, var(--primary-color)15)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 212, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, var(--primary-color)20, var(--primary-color)10)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <i className={`fas ${getViewModeIcon()}`} style={{ fontSize: '10px' }}></i>
                {getViewModeText()}
              </button>
            </div>

            {/* 줌 컨트롤 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-sm)',
              padding: '8px 0',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                minWidth: '40px'
              }}>
                줌:
              </div>
              <div style={{
                display: 'flex',
                gap: '4px'
              }}>
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                  style={{
                    background: zoomLevel <= 0.5 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: zoomLevel <= 0.5 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    fontSize: '12px',
                    cursor: zoomLevel <= 0.5 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px'
                  }}
                  onMouseEnter={(e) => {
                    if (zoomLevel > 0.5) {
                      e.target.style.background = 'var(--border-primary)';
                      e.target.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (zoomLevel > 0.5) {
                      e.target.style.background = 'var(--bg-secondary)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <i className="fas fa-minus" style={{ fontSize: '10px' }}></i>
                </button>
                
                <div style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10px',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  minWidth: '40px',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {Math.round(zoomLevel * 100)}%
                </div>
                
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  style={{
                    background: zoomLevel >= 3 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: zoomLevel >= 3 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    fontSize: '12px',
                    cursor: zoomLevel >= 3 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px'
                  }}
                  onMouseEnter={(e) => {
                    if (zoomLevel < 3) {
                      e.target.style.background = 'var(--border-primary)';
                      e.target.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (zoomLevel < 3) {
                      e.target.style.background = 'var(--bg-secondary)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <i className="fas fa-plus" style={{ fontSize: '10px' }}></i>
                </button>
              </div>
            </div>

            {/* 로봇 트래킹 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                minWidth: '40px'
              }}>
                추적:
              </div>
              <button
                onClick={() => setShowRobotList(!showRobotList)}
                style={{
                  background: trackedRobot ? 'linear-gradient(135deg, var(--primary-color)30, var(--primary-color)15)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  minWidth: '100px',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = trackedRobot ? 
                    'linear-gradient(135deg, var(--primary-color)40, var(--primary-color)20)' : 
                    'var(--border-primary)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = trackedRobot ? 
                    'linear-gradient(135deg, var(--primary-color)30, var(--primary-color)15)' : 
                    'var(--bg-secondary)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}>
                  {trackedRobot || '로봇 선택'}
                </span>
                <i className={`fas fa-chevron-${showRobotList ? 'up' : 'down'}`} style={{ fontSize: '10px' }}></i>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 로봇 선택 드롭다운 */}
      {showRobotList && (
        <div style={{
          background: 'var(--bg-overlay)',
          backdropFilter: 'blur(15px)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          padding: 'var(--space-sm)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '200px',
          overflowY: 'auto',
          minWidth: '150px'
        }}>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontWeight: '600',
            marginBottom: 'var(--space-xs)',
            padding: '4px 0',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            활성 로봇 ({activeRobots.length}대)
          </div>
          
          {/* 추적 해제 옵션 */}
          {trackedRobot && (
            <button
              onClick={() => handleRobotSelect(null)}
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '6px',
                padding: '6px 8px',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--border-primary)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--bg-tertiary)';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
              추적 해제
            </button>
          )}
          
          {activeRobots.length === 0 ? (
            <div style={{
              padding: 'var(--space-sm)',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: '11px'
            }}>
              활성 로봇이 없습니다
            </div>
          ) : (
            activeRobots.map(robot => (
              <button
                key={robot.id}
                onClick={() => handleRobotSelect(robot.id)}
                style={{
                  width: '100%',
                  background: trackedRobot === robot.id ? 
                    'linear-gradient(135deg, var(--primary-color)25, var(--primary-color)10)' : 
                    'transparent',
                  border: '1px solid ' + (trackedRobot === robot.id ? 'var(--primary-color)50' : 'transparent'),
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (trackedRobot !== robot.id) {
                    e.target.style.background = 'var(--bg-tertiary)';
                    e.target.style.border = '1px solid var(--border-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (trackedRobot !== robot.id) {
                    e.target.style.background = 'transparent';
                    e.target.style.border = '1px solid transparent';
                  }
                }}
              >
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}>
                  {robot.id}
                </span>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: robot.status === 'moving' ? '#00ff88' :
                             robot.status === 'working' ? '#00d4ff' :
                             robot.status === 'idle' ? '#ffdd00' :
                             robot.status === 'charging' ? '#ff8040' : '#666',
                  flexShrink: 0,
                  marginLeft: 'var(--space-xs)'
                }} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MapControls; 
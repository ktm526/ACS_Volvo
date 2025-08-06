import React, { useState, useEffect } from 'react';
import { STATION_TYPES } from '../../constants';
import { useMissions } from '../../hooks/useMissions';

const TaskAddModal = ({ isOpen, onClose, onTaskCreated, robots = [], mapData = null }) => {
  const { createMission } = useMissions();
  
  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    type: 'navigation',
    priority: 'medium',
    robotId: null // null이면 비지정
  });
  
  const [waypoints, setWaypoints] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 노드 타입을 스테이션 타입으로 변환하는 함수
  const getNodeType = (nodeType) => {
    // 노드 타입에 따라 적절한 스테이션 타입 반환
    switch (nodeType) {
      case 1: return STATION_TYPES.CHARGING;
      case 2: return STATION_TYPES.LOADING;
      case 0: 
      default: return STATION_TYPES.WAITING;
    }
  };

  // 지도 노드들을 스테이션으로 변환
  const stations = mapData?.nodes ? mapData.nodes.map(node => ({
    id: node.id,
    name: node.name || `Node ${node.id}`,
    x: node.position_x,
    y: node.position_y,
    type: getNodeType(node.type) // 노드 타입을 스테이션 타입으로 변환
  })) : [];

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        type: 'navigation',
        priority: 'medium',
        robotId: null
      });
      setWaypoints([]);
      setError('');
    }
  }, [isOpen]);

  // 웨이포인트 추가
  const addWaypoint = (station) => {
    const newWaypoint = {
      id: Date.now(),
      stationId: station.id,
      stationName: station.name,
      x: station.x,
      y: station.y,
      type: station.type,
      order: waypoints.length + 1
    };
    setWaypoints([...waypoints, newWaypoint]);
  };

  // 웨이포인트 제거
  const removeWaypoint = (waypointId) => {
    const updatedWaypoints = waypoints
      .filter(wp => wp.id !== waypointId)
      .map((wp, index) => ({ ...wp, order: index + 1 }));
    setWaypoints(updatedWaypoints);
  };

  // 웨이포인트 순서 변경
  const moveWaypoint = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= waypoints.length) return;
    
    const newWaypoints = [...waypoints];
    [newWaypoints[index], newWaypoints[newIndex]] = [newWaypoints[newIndex], newWaypoints[index]];
    
    // 순서 업데이트
    newWaypoints.forEach((wp, idx) => {
      wp.order = idx + 1;
    });
    
    setWaypoints(newWaypoints);
  };

  // 스테이션 타입별 아이콘
  const getStationIcon = (type) => {
    switch (type) {
      case STATION_TYPES.CHARGING: return 'fas fa-bolt';
      case STATION_TYPES.LOADING: return 'fas fa-boxes';
      case STATION_TYPES.WAITING: return 'fas fa-pause';
      default: return 'fas fa-map-marker-alt';
    }
  };

  // 스테이션 타입별 색상
  const getStationColor = (type) => {
    switch (type) {
      case STATION_TYPES.CHARGING: return 'var(--status-success)';
      case STATION_TYPES.LOADING: return 'var(--status-warning)';
      case STATION_TYPES.WAITING: return 'var(--status-info)';
      default: return 'var(--text-secondary)';
    }
  };

  // 우선순위 색상
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef476f';
      case 'medium': return '#ffd166';
      case 'low': return '#06d6a0';
      default: return 'var(--text-secondary)';
    }
  };

  // 태스크 생성
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('태스크 이름을 입력해주세요.');
      return;
    }
    
    if (waypoints.length === 0) {
      setError('최소 하나의 웨이포인트를 추가해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const missionData = {
        name: formData.name.trim(),
        robot_id: formData.robotId,
        mission_type: formData.type,
        status: 'pending',
        priority: formData.priority,
        waypoints: waypoints,
        description: ''
      };

      await createMission(missionData);
      onTaskCreated?.();
      onClose();
    } catch (err) {
      console.error('태스크 생성 실패:', err);
      setError('태스크 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        width: '90vw',
        maxWidth: '1200px',
        height: '90vh',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 헤더 */}
        <div style={{
          padding: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 'var(--font-size-2xl)',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              새 태스크 생성
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)'
            }}>
              지도 노드를 선택하여 AMR 이동 경로를 설정하세요
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-lg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
              e.target.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 메인 컨텐츠 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden'
          }}>
            {/* 왼쪽 - 폼 */}
            <div style={{
              width: '350px',
              padding: 'var(--space-lg)',
              borderRight: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-secondary)',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                {/* 태스크 이름 */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-sm)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    태스크 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="태스크 이름을 입력하세요"
                    style={{
                      width: '100%',
                      padding: 'var(--space-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                    required
                  />
                </div>

                {/* 태스크 타입 */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-sm)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    태스크 타입
                  </label>
                  <input
                    type="text"
                    value="이동"
                    disabled
                    style={{
                      width: '100%',
                      padding: 'var(--space-md)',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-tertiary)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  />
                </div>

                {/* 우선순위 */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-sm)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    우선순위
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {['high', 'medium', 'low'].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority })}
                        style={{
                          flex: 1,
                          padding: 'var(--space-sm)',
                          backgroundColor: formData.priority === priority ? getPriorityColor(priority) : 'var(--bg-tertiary)',
                          border: `1px solid ${formData.priority === priority ? getPriorityColor(priority) : 'var(--border-primary)'}`,
                          borderRadius: 'var(--radius-md)',
                          color: formData.priority === priority ? 'white' : 'var(--text-primary)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {priority === 'high' ? '높음' : priority === 'medium' ? '보통' : '낮음'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AMR 선택 */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-sm)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    AMR 할당
                  </label>
                  <select
                    value={formData.robotId || ''}
                    onChange={(e) => setFormData({ ...formData, robotId: e.target.value || null })}
                    style={{
                      width: '100%',
                      padding: 'var(--space-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    <option value="">자동 할당</option>
                    {robots.map((robot) => (
                      <option key={robot.id} value={robot.id}>
                        {robot.name} ({robot.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <div style={{
                    padding: 'var(--space-md)',
                    backgroundColor: 'rgba(239, 71, 111, 0.1)',
                    border: '1px solid rgba(239, 71, 111, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ef476f',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* 가운데 - 스테이션 목록 */}
            <div style={{
              width: '350px',
              padding: 'var(--space-lg)',
              borderRight: '1px solid var(--border-primary)',
              overflow: 'auto'
            }}>
              <h3 style={{
                margin: '0 0 var(--space-lg) 0',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                지도 노드 목록 ({stations.length}개)
              </h3>
              
              {stations.length === 0 ? (
                <div style={{
                  padding: 'var(--space-xl)',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  <i className="fas fa-map" style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}></i>
                  <p>지도 데이터를 불러올 수 없습니다.<br />지도를 선택해주세요.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {stations.map((station) => (
                    <div
                      key={station.id}
                      onClick={() => addWaypoint(station)}
                      style={{
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-md)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-card)';
                        e.target.style.borderColor = getStationColor(station.type);
                        e.target.style.boxShadow = `0 0 20px ${getStationColor(station.type)}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-tertiary)';
                        e.target.style.borderColor = 'var(--border-primary)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: getStationColor(station.type),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        <i className={getStationIcon(station.type)}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: '2px'
                        }}>
                          {station.name}
                        </div>
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-secondary)'
                        }}>
                          ({station.x.toFixed(2)}, {station.y.toFixed(2)}) • {station.type === 'charging' ? '충전' : station.type === 'loading' ? '작업' : '대기'}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-tertiary)'
                      }}>
                        <i className="fas fa-plus"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 오른쪽 - 웨이포인트 목록 */}
            <div style={{
              flex: 1,
              padding: 'var(--space-lg)',
              overflow: 'auto'
            }}>
              <h3 style={{
                margin: '0 0 var(--space-lg) 0',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '700',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)'
              }}>
                <i className="fas fa-route"></i>
                이동 경로 ({waypoints.length}개)
              </h3>
              
              {waypoints.length === 0 ? (
                <div style={{
                  padding: 'var(--space-xl)',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  <i className="fas fa-map-marker-alt" style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}></i>
                  <p>왼쪽 노드 목록에서 선택하여<br />이동 경로를 추가해주세요</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {waypoints.map((waypoint, index) => (
                    <div
                      key={waypoint.id}
                      style={{
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-md)'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '700'
                      }}>
                        {index + 1}
                      </div>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: getStationColor(waypoint.type),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 'var(--font-size-xs)'
                      }}>
                        <i className={getStationIcon(waypoint.type)}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: '2px'
                        }}>
                          {waypoint.stationName}
                        </div>
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-secondary)'
                        }}>
                          ({waypoint.x.toFixed(2)}, {waypoint.y.toFixed(2)})
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        <button
                          type="button"
                          onClick={() => moveWaypoint(index, 'up')}
                          disabled={index === 0}
                          style={{
                            width: '28px',
                            height: '28px',
                            backgroundColor: index === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-sm)',
                            color: index === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                            fontSize: 'var(--font-size-xs)',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="fas fa-chevron-up"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveWaypoint(index, 'down')}
                          disabled={index === waypoints.length - 1}
                          style={{
                            width: '28px',
                            height: '28px',
                            backgroundColor: index === waypoints.length - 1 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-sm)',
                            color: index === waypoints.length - 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                            fontSize: 'var(--font-size-xs)',
                            cursor: index === waypoints.length - 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="fas fa-chevron-down"></i>
                        </button>
                        <button
                          type="button"        
                          onClick={() => removeWaypoint(waypoint.id)}
                          style={{
                            width: '28px',
                            height: '28px',
                            backgroundColor: 'rgba(239, 71, 111, 0.1)',
                            border: '1px solid rgba(239, 71, 111, 0.3)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#ef476f',
                            fontSize: 'var(--font-size-xs)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(239, 71, 111, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(239, 71, 111, 0.1)';
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 푸터 */}
          <div style={{
            padding: 'var(--space-lg)',
            borderTop: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-md)'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '100px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--bg-primary)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'var(--bg-tertiary)';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                padding: 'var(--space-md) var(--space-xl)',
                backgroundColor: isSubmitting ? 'var(--bg-tertiary)' : 'var(--primary-color)',
                border: `1px solid ${isSubmitting ? 'var(--border-primary)' : 'var(--primary-color)'}`,
                borderRadius: 'var(--radius-md)',
                color: isSubmitting ? 'var(--text-secondary)' : 'white',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)',
                minWidth: '140px',
                boxShadow: isSubmitting ? 'none' : '0 0 20px rgba(0, 212, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = '#00b8e6';
                  e.target.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = 'var(--primary-color)';
                  e.target.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  생성 중...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i>
                  태스크 생성
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAddModal; 
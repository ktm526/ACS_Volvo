import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getStatusColor } from '../../constants';
import { getTypeIcon, getPriorityColor } from '../../utils/mainPageUtils';
import { useAppContext } from '../../contexts/AppContext';
import { api } from '../../services/api';

const MissionDetailModal = ({ mission, isOpen, onClose, onMissionUpdate }) => {
  if (!isOpen || !mission) return null;

  const { state } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const statusColor = getStatusColor(mission.status);
  const priorityColor = getPriorityColor(mission.priority);

  // ESC 키로 모달 닫기 + body 스크롤 방지
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // body 스크롤 방지
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('ko-KR');
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': '대기중',
      'in_progress': '진행중',
      'completed': '완료',
      'failed': '실패',
      'cancelled': '취소됨'
    };
    return statusMap[status] || status;
  };

  const getPriorityText = (priority) => {
    const priorityMap = {
      'high': '높음',
      'medium': '보통',
      'low': '낮음'
    };
    return priorityMap[priority] || priority;
  };

  const getTypeText = (type) => {
    const typeMap = {
      'transport': '운송',
      'delivery': '배송',
      'pickup': '픽업',
      'cleaning': '청소',
      'inspection': '점검',
      'maintenance': '정비'
    };
    return typeMap[type] || type;
  };

  const handleOverlayClick = (e) => {
    // 오버레이 클릭 시에만 모달 닫기 (안전한 체크)
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  // 모달 내부 클릭 시 이벤트 전파 방지
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // 작업 취소 핸들러
  const handleCancelMission = async () => {
    if (mission.status === 'completed' || mission.status === 'cancelled') {
      return;
    }

    const confirmed = window.confirm(
      `정말로 "${mission.name || mission.title}" 작업을 취소하시겠습니까?\n\n` +
      '이 작업은 되돌릴 수 없습니다.'
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      console.log(`🚫 작업 취소 요청: ${mission.name} (ID: ${mission.id})`);
      
      // API를 통해 작업 취소
      await api.updateMissionStatus(mission.id, 'cancelled');

      console.log(`✅ 작업 취소 완료: ${mission.name}`);
      
      // 상위 컴포넌트에 업데이트 알림
      if (onMissionUpdate) {
        onMissionUpdate();
      }
      
      // 모달 닫기
      onClose();
      
    } catch (error) {
      console.error('❌ 작업 취소 실패:', error);
      alert('작업 취소에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 정보 항목 컴포넌트
  const InfoItem = ({ label, value, color, isMonospace = false, unit = '' }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'var(--space-sm) 0',
      borderBottom: '1px solid var(--border-primary)'
    }}>
      <span style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)',
        fontWeight: '600'
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 'var(--font-size-sm)',
        color: color || 'var(--text-primary)',
        fontWeight: '600',
        fontFamily: isMonospace ? '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace' : 'inherit'
      }}>
        {value}{unit}
      </span>
    </div>
  );

  // 섹션 컴포넌트
  const Section = ({ title, children, columns = 1 }) => (
    <div style={{
      marginBottom: 'var(--space-lg)'
    }}>
      <h3 style={{
        margin: '0 0 var(--space-md) 0',
        fontSize: 'var(--font-size-base)',
        fontWeight: '700',
        color: 'var(--text-primary)',
        borderLeft: '3px solid var(--primary-color)',
        paddingLeft: 'var(--space-sm)'
      }}>
        {title}
      </h3>
      <div style={{
        padding: 'var(--space-md)',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-primary)',
        display: 'grid',
        gridTemplateColumns: columns > 1 ? `repeat(${columns}, 1fr)` : '1fr',
        gap: columns > 1 ? 'var(--space-md)' : '0'
      }}>
        {children}
      </div>
    </div>
  );

  const modalContent = (
    <div
      className={`app ${state.ui.theme}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--overlay-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(3px)',
        padding: '20px'
      }}
      onClick={handleOverlayClick}
    >
              <div
        onClick={handleModalClick}
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-primary)',
          overflow: 'hidden'
        }}
      >
        {/* 헤더 (고정) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-primary)',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${statusColor}, ${statusColor}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bg-primary)',
              fontSize: '20px',
              fontWeight: '600',
              boxShadow: `0 0 20px ${statusColor}50`
            }}>
              <i className={getTypeIcon(mission.mission_type || mission.type)}></i>
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: 'var(--font-size-xl)',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {mission.title || mission.name || 'Unknown Mission'}
              </h2>
              <p style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-tertiary)'
              }}>
                미션 ID: {mission.id} • 타입: {getTypeText(mission.mission_type || mission.type)}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
              e.target.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 콘텐츠 영역 (스크롤 가능) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-lg)',
          paddingTop: 'var(--space-lg)'
        }}>
        {/* 기본 상태 정보 */}
        <Section title="미션 상태" columns={3}>
          <div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)'
            }}>
              현재 상태
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <div style={{
                padding: '6px 12px',
                background: `linear-gradient(135deg, ${statusColor}20, ${statusColor}10)`,
                borderRadius: '6px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: statusColor,
                border: `1px solid ${statusColor}40`
              }}>
                {getStatusText(mission.status)}
              </div>
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)'
            }}>
              우선순위
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <div style={{
                padding: '6px 12px',
                background: `linear-gradient(135deg, ${priorityColor}20, ${priorityColor}10)`,
                borderRadius: '6px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: priorityColor,
                border: `1px solid ${priorityColor}40`
              }}>
                {getPriorityText(mission.priority)}
              </div>
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)'
            }}>
              진행률
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <div style={{
                flex: 1,
                height: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${mission.progress || 0}%`,
                  backgroundColor: mission.progress >= 100 ? 'var(--status-success)' : 
                                   mission.progress >= 50 ? 'var(--status-warning)' : 'var(--primary-color)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: '700',
                color: 'var(--text-primary)',
                minWidth: '35px'
              }}>
                {mission.progress || 0}%
              </span>
            </div>
          </div>
        </Section>

        {/* 할당 정보 */}
        <Section title="할당 정보" columns={2}>
          <div>
            <InfoItem label="할당된 로봇 ID" value={mission.robot_id || '미할당'} />
            <InfoItem label="로봇 이름" value={mission.robot_name || 'N/A'} />
          </div>
          <div>
            <InfoItem label="미션 타입" value={getTypeText(mission.mission_type || mission.type)} />
            <InfoItem label="설명" value={mission.description || 'N/A'} />
          </div>
        </Section>

        {/* 위치 정보 */}
        {(mission.start_x !== undefined || mission.target_x !== undefined) && (
          <Section title="위치 정보" columns={2}>
            <div>
              <h4 style={{
                margin: '0 0 var(--space-sm) 0',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: 'var(--text-secondary)'
              }}>
                시작 위치
              </h4>
              <InfoItem label="X 좌표" value={mission.start_x !== undefined ? mission.start_x.toFixed(2) : 'N/A'} isMonospace={true} />
              <InfoItem label="Y 좌표" value={mission.start_y !== undefined ? mission.start_y.toFixed(2) : 'N/A'} isMonospace={true} />
            </div>
            <div>
              <h4 style={{
                margin: '0 0 var(--space-sm) 0',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: 'var(--text-secondary)'
              }}>
                목표 위치
              </h4>
              <InfoItem label="X 좌표" value={mission.target_x !== undefined ? mission.target_x.toFixed(2) : 'N/A'} isMonospace={true} />
              <InfoItem label="Y 좌표" value={mission.target_y !== undefined ? mission.target_y.toFixed(2) : 'N/A'} isMonospace={true} />
            </div>
          </Section>
        )}

        {/* 웨이포인트 정보 */}
        {mission.waypoints && mission.waypoints.length > 0 && (
          <Section title="웨이포인트 정보">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-md)'
            }}>
              {mission.waypoints.map((waypoint, index) => (
                <div key={index} style={{
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-primary)'
                }}>
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-tertiary)',
                    marginBottom: 'var(--space-xs)',
                    fontWeight: '600'
                  }}>
                    웨이포인트 {index + 1}
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    fontFamily: 'monospace'
                  }}>
                    {waypoint.stationName || waypoint.name || `Station ${waypoint.stationId || waypoint.id || index + 1}`}
                  </div>
                  {(waypoint.x !== undefined && waypoint.y !== undefined) && (
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                      marginTop: 'var(--space-xs)',
                      fontFamily: 'monospace'
                    }}>
                      ({waypoint.x.toFixed(2)}, {waypoint.y.toFixed(2)})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 시간 정보 */}
        <Section title="시간 정보" columns={2}>
          <div>
            <InfoItem label="생성 시간" value={formatDate(mission.created_at)} isMonospace={true} />
            <InfoItem label="시작 시간" value={formatDate(mission.start_time)} isMonospace={true} />
          </div>
          <div>
            <InfoItem label="완료 시간" value={formatDate(mission.end_time)} isMonospace={true} />
            <InfoItem label="마지막 업데이트" value={formatDate(mission.updated_at)} isMonospace={true} />
          </div>
        </Section>

        {/* 추가 정보 */}
        <Section title="추가 정보">
          <InfoItem label="생성자" value={mission.created_by || 'System'} />
          <InfoItem label="예상 소요 시간" value={mission.estimated_duration ? `${mission.estimated_duration}분` : 'N/A'} />
          <InfoItem label="실제 소요 시간" value={mission.actual_duration ? `${mission.actual_duration}분` : 'N/A'} />
          <InfoItem label="오류 메시지" value={mission.error_message || '없음'} color={mission.error_message ? 'var(--status-error)' : 'var(--status-success)'} />
        </Section>

        {/* 하단 버튼 영역 */}
        <div style={{
          marginTop: 'var(--space-lg)',
          paddingTop: 'var(--space-lg)',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--space-md)'
        }}>
          <button
            onClick={handleCancelMission}
            disabled={mission.status === 'completed' || mission.status === 'cancelled' || isLoading}
            style={{
              padding: '12px 24px',
              border: mission.status === 'completed' || mission.status === 'cancelled' 
                ? '1px solid var(--border-primary)' 
                : '1px solid var(--status-error)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: mission.status === 'completed' || mission.status === 'cancelled' 
                ? 'var(--bg-tertiary)' 
                : 'transparent',
              color: mission.status === 'completed' || mission.status === 'cancelled' 
                ? 'var(--text-tertiary)' 
                : 'var(--status-error)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '600',
              cursor: mission.status === 'completed' || mission.status === 'cancelled' 
                ? 'not-allowed' 
                : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}
            onMouseEnter={(e) => {
              if (mission.status !== 'completed' && mission.status !== 'cancelled') {
                e.target.style.backgroundColor = 'var(--status-error)';
                e.target.style.color = 'var(--bg-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (mission.status !== 'completed' && mission.status !== 'cancelled') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--status-error)';
              }
            }}
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-times-circle"></i>
            )}
            {isLoading ? '취소 중...' :
             mission.status === 'completed' ? '완료된 작업' : 
             mission.status === 'cancelled' ? '취소된 작업' : '작업 취소'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MissionDetailModal; 
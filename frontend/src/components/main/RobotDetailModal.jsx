import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getStatusColor } from '../../constants';
import { getRobotStatusIcon } from '../../utils/mainPageUtils';
import { useAppContext } from '../../contexts/AppContext';

const RobotDetailModal = ({ robot, isOpen, onClose }) => {
  if (!isOpen || !robot) return null;

  const { state } = useAppContext();
  const statusColor = getStatusColor(robot.status, 'robot');
  const position = {
    x: robot.location_x !== undefined ? robot.location_x : 0,
    y: robot.location_y !== undefined ? robot.location_y : 0
  };
  const battery = robot.battery || robot.battery_soc || 0;

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

  const formatBoolean = (value) => {
    if (value === true || value === 1) return '예';
    if (value === false || value === 0) return '아니오';
    return 'N/A';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'idle': '대기중',
      'stop': '정지',
      'working': '작업중',
      'pause': '일시정지',
      'charging': '충전중',
      'error': '오류',
      'disconnected': '연결끊김',
      // 하위 호환성
      'moving': '작업중'
    };
    return statusMap[status] || status;
  };

  const getDrivingStatusText = (drivingStatus) => {
    const statusMap = {
      0: '정지',
      1: '이동중',
      2: '회전중',
      3: '후진중'
    };
    return statusMap[drivingStatus] || `상태 ${drivingStatus}`;
  };

  const getDrivingModeText = (drivingMode) => {
    const modeMap = {
      0: '수동',
      1: '자동',
      2: '원격제어'
    };
    return modeMap[drivingMode] || `모드 ${drivingMode}`;
  };

  const getConnectionStatusColor = (connected) => {
    return (connected === true || connected === 1) ? 'var(--status-success)' : 'var(--status-error)';
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
          padding: 'var(--space-lg)',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '95vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-primary)'
        }}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-primary)',
          paddingBottom: 'var(--space-md)'
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
              <i className={getRobotStatusIcon(robot.status)}></i>
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: 'var(--font-size-xl)',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {robot.name}
              </h2>
              <p style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-tertiary)'
              }}>
                로봇 ID: {robot.id} • IP: {robot.ip_address || 'N/A'}
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

        {/* 기본 상태 정보 */}
        <Section title="기본 상태" columns={2}>
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
                padding: '4px 8px',
                background: `linear-gradient(135deg, ${statusColor}20, ${statusColor}10)`,
                borderRadius: '6px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: statusColor,
                border: `1px solid ${statusColor}40`
              }}>
                {getStatusText(robot.status)}
              </div>
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)'
            }}>
              연결 상태
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getConnectionStatusColor(robot.connection_status),
                boxShadow: `0 0 8px ${getConnectionStatusColor(robot.connection_status)}60`
              }} />
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: getConnectionStatusColor(robot.connection_status)
              }}>
                {formatBoolean(robot.connection_status)}
              </span>
            </div>
          </div>
        </Section>

        {/* 배터리 정보 */}
        <Section title="배터리 정보">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-md)'
          }}>
            <div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-xs)'
              }}>
                충전량 (SOC)
              </div>
              <div style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: '700',
                color: battery > 30 ? 'var(--status-success)' : 
                       battery > 15 ? 'var(--status-warning)' : 'var(--status-error)'
              }}>
                {robot.battery_soc || battery}%
              </div>
            </div>
            <div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-xs)'
              }}>
                전압
              </div>
              <div style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: '600',
                color: 'var(--text-primary)',
                fontFamily: 'monospace'
              }}>
                {robot.battery_voltage || 0}V
              </div>
            </div>
            <div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-xs)'
              }}>
                건강도 (SOH)
              </div>
              <div style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                {robot.battery_soh || 100}%
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              충전 중:
            </span>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: '600',
              color: robot.charging_status ? 'var(--status-success)' : 'var(--text-primary)'
            }}>
              {formatBoolean(robot.charging_status)}
            </span>
          </div>
        </Section>

        {/* 위치 및 이동 정보 */}
        <Section title="위치 및 이동 정보" columns={2}>
          <div>
            <InfoItem label="X 좌표" value={position.x.toFixed(2)} isMonospace={true} />
            <InfoItem label="Y 좌표" value={position.y.toFixed(2)} isMonospace={true} />
            <InfoItem label="각도" value={robot.angle || robot.position_theta || 0} isMonospace={true} unit="°" />
          </div>
          <div>
            <InfoItem label="주행 상태" value={getDrivingStatusText(robot.driving_status)} />
            <InfoItem label="주행 모드" value={getDrivingModeText(robot.driving_mode)} />
            <InfoItem label="목적지 노드" value={robot.destination_node_id || 'N/A'} />
          </div>
        </Section>

        {/* 속도 정보 */}
        <Section title="속도 정보" columns={1}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-md)'
          }}>
            <div>
              <InfoItem label="X 속도" value={robot.velocity_x || 0} isMonospace={true} unit=" m/s" />
            </div>
            <div>
              <InfoItem label="Y 속도" value={robot.velocity_y || 0} isMonospace={true} unit=" m/s" />
            </div>
            <div>
              <InfoItem label="각속도" value={robot.velocity_theta || 0} isMonospace={true} unit=" rad/s" />
            </div>
          </div>
        </Section>

        {/* 작업 정보 */}
        <Section title="작업 정보">
          <InfoItem label="현재 작업 ID" value={robot.current_task_id || '없음'} />
          <InfoItem label="작업 상태" value={robot.task_status || 'idle'} />
          <InfoItem label="현재 웨이포인트" value={robot.current_waypoint_index !== undefined ? robot.current_waypoint_index : 'N/A'} />
          <InfoItem label="명령 상태" value={robot.order_status !== undefined ? robot.order_status : 'N/A'} />
          <InfoItem label="경로 상태" value={robot.path_status || 'N/A'} />
        </Section>

        {/* 시스템 정보 */}
        <Section title="시스템 정보" columns={2}>
          <div>
            <InfoItem label="로봇 모델" value={robot.robot_model || 'N/A'} />
            <InfoItem label="하드웨어 버전" value={robot.hw_version || 'N/A'} isMonospace={true} />
            <InfoItem label="소프트웨어 버전" value={robot.sw_version || 'N/A'} isMonospace={true} />
          </div>
          <div>
            <InfoItem label="포트" value={robot.port || 80} isMonospace={true} />
            <InfoItem label="오류 코드" value={robot.error_code || 0} color={robot.error_code ? 'var(--status-error)' : 'var(--status-success)'} />
            <InfoItem label="오류 메시지" value={robot.error_msg || '없음'} color={robot.error_msg ? 'var(--status-error)' : 'var(--status-success)'} />
          </div>
        </Section>

        {/* 타임스탬프 정보 */}
        <Section title="시간 정보">
          <InfoItem label="마지막 업데이트" value={formatDate(robot.last_updated)} isMonospace={true} />
          <InfoItem label="마지막 상태 확인" value={formatDate(robot.last_status_check)} isMonospace={true} />
          <InfoItem label="AMR 타임스탬프" value={formatDate(robot.amr_timestamp)} isMonospace={true} />
          <InfoItem label="마지막 명령 전송" value={formatDate(robot.last_command_sent)} isMonospace={true} />
        </Section>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default RobotDetailModal; 
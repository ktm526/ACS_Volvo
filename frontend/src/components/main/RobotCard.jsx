import React, { useState } from 'react';
import { getRobotStatusIcon, getRobotStatusColor } from '../../utils/mainPageUtils';
import { getStatusColor } from '../../constants';

const RobotCard = ({ robot, isTracked, onShowDetail, onTrackToggle, isMobile = false }) => {
  const isActiveSelection = isTracked; // 추적 상태를 기준으로 강조
  const [isHovered, setIsHovered] = useState(false);
  
  // 안전한 기본값 설정
  const position = {
    x: robot?.location_x !== undefined ? robot.location_x : 0,
    y: robot?.location_y !== undefined ? robot.location_y : 0
  };
  const battery = robot?.battery || 0;
  const status = robot?.status || 'unknown';
  const name = robot?.name || robot?.id || 'Unknown Robot';
  const currentTask = robot?.currentTask || null;

  // 디버깅: RobotCard 위치 데이터 확인
  if (position.x !== 0 || position.y !== 0) {
    console.log('✅ RobotCard - 위치 데이터 매핑 성공:', {
      robot_id: robot?.id,
      robot_name: name,
      원본_location_x: robot?.location_x,
      원본_location_y: robot?.location_y,
      매핑된_position: position
    });
  } else {
    console.log('❌ RobotCard - 위치 데이터가 0,0입니다:', {
      robot_id: robot?.id,
      robot_name: name,
      원본_location_x: robot?.location_x,
      원본_location_y: robot?.location_y,
      타입_location_x: typeof robot?.location_x,
      타입_location_y: typeof robot?.location_y,
      전체_로봇_데이터: robot
    });
  }
  
  const statusColor = getStatusColor(status, 'robot');
  
  // 카드 스타일 계산 (성능 최적화)
  const getCardStyle = () => {
    const baseStyle = {
      padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
      marginBottom: 'var(--space-sm)',
      borderRadius: 'var(--radius-lg)',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      willChange: 'transform, box-shadow, border-color',
      backfaceVisibility: 'hidden'
    };

    if (isActiveSelection) {
      return {
        ...baseStyle,
        background: `linear-gradient(135deg, var(--bg-card) 0%, ${statusColor}05 100%)`,
        border: `2px solid ${statusColor}`,
        boxShadow: `
          0 0 30px ${statusColor}60,
          0 0 60px ${statusColor}30,
          0 0 100px ${statusColor}15,
          inset 0 0 20px ${statusColor}10
        `,
        transform: 'translateZ(0) scale(1.02) translateY(-2px)'
      };
    } else if (isHovered) {
      return {
        ...baseStyle,
        background: `linear-gradient(135deg, var(--bg-card) 0%, ${statusColor}03 100%)`,
        border: `2px solid ${statusColor}80`,
        boxShadow: `
          0 0 20px ${statusColor}40,
          0 0 40px ${statusColor}20,
          0 0 80px ${statusColor}10
        `,
        transform: 'translateZ(0) scale(1.01) translateY(-1px)'
      };
    } else {
      return {
        ...baseStyle,
        background: `linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-card) 100%)`,
        border: '1px solid var(--border-primary)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transform: 'translateZ(0) scale(1)'
      };
    }
  };
  
  const handleInfoAreaClick = (e) => {
    // 정보 영역 클릭 시 상세 모달 표시
    if (onShowDetail) {
      onShowDetail(robot);
    }
  };

  const handleTrackToggle = (e) => {
    e.stopPropagation();
    if (onTrackToggle) {
      onTrackToggle(isTracked ? null : robot.id);
    }
  };

  return (
    <div
      style={getCardStyle()}
    >
      {/* 선택 표시 */}
      {isActiveSelection && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          background: `linear-gradient(180deg, ${statusColor}, ${statusColor}cc, ${statusColor}88)`,
          boxShadow: `0 0 15px ${statusColor}80`,
          willChange: 'transform'
        }} />
      )}

      {/* 빛나는 배경 효과 (선택 시) */}
      {(isActiveSelection || isHovered) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 30% 30%, ${statusColor}08, transparent 70%)`,
          opacity: isActiveSelection ? 0.8 : 0.4,
          transition: 'opacity 0.3s ease',
          willChange: 'opacity'
        }} />
      )}



      {/* 로봇 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-sm)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <div style={{
            width: isMobile ? '28px' : '36px',
            height: isMobile ? '28px' : '36px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${statusColor}, ${statusColor}cc)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--bg-primary)',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            boxShadow: `
              0 0 20px ${statusColor}50,
              0 0 40px ${statusColor}25,
              inset 0 0 10px rgba(255, 255, 255, 0.1)
            `,
            willChange: 'transform',
            transition: 'all 0.3s ease'
          }}>
            <i className={getRobotStatusIcon(status)}></i>
          </div>
          <div>
            <div style={{
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              {name}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '2px'
            }}>
              ID: {robot?.id || 'N/A'}
            </div>
            {robot?.angle !== undefined && (
              <div style={{
                fontSize: '10px',
                color: 'var(--text-tertiary)',
                marginTop: '1px'
              }}>
                방향: {((robot.angle * 180 / Math.PI) % 360).toFixed(0)}°
              </div>
            )}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)'
        }}>
          {/* 추적 버튼 */}
          <button
            className="track-button"
            onClick={handleTrackToggle}
            style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: isTracked ? statusColor : 'var(--text-secondary)',
              fontSize: isMobile ? '14px' : '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: isTracked ? 
                `0 0 10px ${statusColor}80` : 
                'none',
              position: 'relative',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.target.style.color = isTracked ? statusColor : 'var(--primary-color)';
              e.target.style.textShadow = `0 0 15px ${isTracked ? statusColor : 'var(--primary-color)'}`;
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = isTracked ? statusColor : 'var(--text-secondary)';
              e.target.style.textShadow = isTracked ? `0 0 10px ${statusColor}80` : 'none';
              e.target.style.transform = 'scale(1)';
            }}
            title={isTracked ? '추적 해제' : '추적 시작'}
          >
            <i className="fas fa-crosshairs"></i>
          </button>

          {/* 상태 표시 */}
          <div style={{
            padding: isMobile ? '6px 10px' : '8px 12px',
            background: `linear-gradient(135deg, ${statusColor}20, ${statusColor}10)`,
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '700',
            color: statusColor,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            border: `1px solid ${statusColor}40`,
            boxShadow: `
              0 0 10px ${statusColor}30,
              inset 0 0 5px rgba(255, 255, 255, 0.1)
            `,
            textShadow: `0 0 5px ${statusColor}40`
          }}>
            {status}
          </div>
        </div>
      </div>

      {/* 디바이더 */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--border-primary), transparent)',
        margin: 'var(--space-sm) 0',
        position: 'relative',
        zIndex: 1
      }} />

      {/* 로봇 정보 영역 (클릭 가능) */}
      <div 
        onClick={handleInfoAreaClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: isMobile ? 'var(--space-xs)' : 'var(--space-sm)',
          rowGap: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          position: 'relative',
          zIndex: 1,
          cursor: 'pointer',
          padding: 'var(--space-sm)',
          margin: 'calc(-1 * var(--space-sm))',
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* 위치 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          <span style={{ 
            fontWeight: '600',
            minWidth: '35px'
          }}>위치:</span>
          <span style={{ 
            color: 'var(--text-primary)',
            fontWeight: '700',
            fontFamily: '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            ({position.x.toFixed(1)}, {position.y.toFixed(1)})
          </span>
        </div>
        
        {/* 스테이션 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          <span style={{ 
            fontWeight: '600',
            minWidth: '45px'
          }}>스테이션:</span>
          <span style={{ 
            color: robot?.station ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: '600',
            fontSize: '11px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {robot?.station || 'N/A'}
          </span>
        </div>
        
        {/* 작업 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          <span style={{ 
            fontWeight: '600',
            minWidth: '35px'
          }}>작업:</span>
          <span style={{ 
            color: currentTask ? 'var(--primary-color)' : 'var(--text-tertiary)',
            fontWeight: '600',
            fontSize: '11px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {currentTask || '대기 중'}
          </span>
        </div>
        
        {/* 배터리 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          <span style={{ 
            fontWeight: '600',
            minWidth: '45px'
          }}>배터리:</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflow: 'hidden'
          }}>
            {/* 배터리 퍼센트 */}
            <span style={{
              fontSize: '11px',
              color: 'var(--text-primary)',
              fontWeight: '700',
              minWidth: '30px',
              flexShrink: 0
            }}>
              {battery}%
            </span>
            {/* 배터리 아이콘 */}
            <div style={{
              width: '20px',
              height: '12px',
              border: '1px solid var(--text-secondary)',
              borderRadius: '2px',
              position: 'relative',
              backgroundColor: 'var(--bg-primary)',
              flexShrink: 0
            }}>
              {/* 배터리 플러스 단자 */}
              <div style={{
                position: 'absolute',
                right: '-2px',
                top: '3px',
                width: '2px',
                height: '6px',
                backgroundColor: 'var(--text-secondary)',
                borderRadius: '0 1px 1px 0'
              }} />
              {/* 배터리 레벨 */}
              <div style={{
                position: 'absolute',
                left: '1px',
                top: '1px',
                bottom: '1px',
                width: `${Math.max(0, (battery / 100) * 16)}px`,
                background: battery > 60 ? 
                  'linear-gradient(90deg, #00ff88, #00dd77)' :
                  battery > 30 ? 
                  'linear-gradient(90deg, #ffdd00, #ffcc00)' :
                  'linear-gradient(90deg, #ff4444, #ff3333)',
                borderRadius: '1px',
                transition: 'width 0.3s ease',
                boxShadow: battery > 60 ? 
                  '0 0 4px #00ff8860' :
                  battery > 30 ? 
                  '0 0 4px #ffdd0060' :
                  '0 0 4px #ff444460'
              }} />
            </div>
          </div>
        </div>

        {/* 호버 시 반투명 오버레이 */}
        {isHovered && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 15,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: isMobile ? '11px' : '12px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="fas fa-mouse-pointer" style={{ fontSize: '12px', opacity: 0.8 }}></i>
              클릭하여 상세 정보 조회
            </div>
          </div>
        )}
      </div>

      {/* 현재 작업 표시 (있는 경우) */}
      {currentTask && (
        <div style={{
          marginTop: 'var(--space-sm)',
          padding: '8px 12px',
          background: `linear-gradient(135deg, var(--primary-color)10, var(--primary-color)05)`,
          borderRadius: '6px',
          border: `1px solid var(--primary-color)30`,
          fontSize: '11px',
          color: 'var(--text-secondary)',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <i className="fas fa-tasks" style={{
              color: 'var(--primary-color)',
              fontSize: '10px'
            }}></i>
            <span style={{
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              {currentTask}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RobotCard; 
import React, { useState } from 'react';
import { getPriorityColor, getTypeIcon } from '../../utils/mainPageUtils';
import { getStatusColor, getStatusIcon } from '../../constants';

const MissionCard = ({ mission, isMobile = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // 안전한 기본값 설정
  const name = mission?.name || 'Unknown Mission';
  const type = mission?.type || 'unknown';
  const status = mission?.status || 'pending';
  const priority = mission?.priority || 'low';
  const assignedRobot = mission?.assignedRobot || 'N/A';
  const progress = mission?.progress || 0;
  
  const statusColor = getStatusColor(status);
  const priorityColor = getPriorityColor(priority);
  
  // Date 객체를 안전하게 포맷팅하는 함수
  const formatDateTime = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      let date;
      
      // Date 객체인 경우
      if (dateValue instanceof Date) {
        date = dateValue;
      }
      // 문자열인 경우 Date로 변환 시도
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          // 유효하지 않은 날짜 문자열이면 그대로 반환
          return dateValue;
        }
      }
      // 기타 경우
      else {
        return String(dateValue);
      }
      
      // MM.DD.HH:MM:SS 형식으로 포맷팅
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${month}.${day}.${hours}:${minutes}:${seconds}`;
      
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'N/A';
    }
  };

  // 카드 스타일 계산
  const getCardStyle = () => {
    const baseStyle = {
      padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
      marginBottom: 'var(--space-sm)',
      borderRadius: 'var(--radius-lg)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      willChange: 'transform, box-shadow, border-color',
      backfaceVisibility: 'hidden'
    };

    if (isHovered) {
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

  return (
    <div
      style={getCardStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 우선순위 표시 바 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        background: `linear-gradient(180deg, ${priorityColor}, ${priorityColor}cc, ${priorityColor}88)`,
        boxShadow: `0 0 15px ${priorityColor}60`
      }} />

      {/* 빛나는 배경 효과 (호버 시) */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 30% 30%, ${statusColor}08, transparent 70%)`,
          opacity: 0.4,
          transition: 'opacity 0.3s ease',
          willChange: 'opacity'
        }} />
      )}

      {/* 미션 헤더 */}
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
            <i className={getTypeIcon(type)}></i>
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
              {type}
            </div>
          </div>
        </div>
        
        {/* 상태 표시만 남김 */}
        <div style={{
          padding: isMobile ? '4px 8px' : '6px 10px',
          background: `linear-gradient(135deg, ${statusColor}20, ${statusColor}10)`,
          borderRadius: '6px',
          fontSize: '10px',
          fontWeight: '700',
          color: statusColor,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          border: `1px solid ${statusColor}40`,
          boxShadow: `
            0 0 8px ${statusColor}30,
            inset 0 0 3px rgba(255, 255, 255, 0.1)
          `,
          textShadow: `0 0 5px ${statusColor}40`
        }}>
          {status}
        </div>
      </div>

      {/* AMR 및 진행률 표시 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-sm)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* AMR 정보 (1 비율) */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-primary)',
          fontWeight: '700',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {assignedRobot}
        </div>
        
        {/* 진행률 (3 비율) */}
        <div style={{
          flex: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: '600'
          }}>
            진행률:
          </div>
          <div style={{
            flex: 1,
            height: '8px',
            backgroundColor: 'var(--border-primary)',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: progress >= 100 ? 
                `linear-gradient(90deg, #00ff88, #00dd77)` :
                progress >= 75 ? 
                `linear-gradient(90deg, #00d4ff, #00b8e6)` :
                progress >= 50 ? 
                `linear-gradient(90deg, #ffdd00, #ffcc00)` :
                `linear-gradient(90deg, #ff8800, #ff7700)`,
              transition: 'width 0.3s ease',
              borderRadius: '4px',
              boxShadow: progress >= 100 ? 
                `0 0 8px #00ff8840` :
                progress >= 75 ? 
                `0 0 8px #00d4ff40` :
                progress >= 50 ? 
                `0 0 8px #ffdd0040` :
                `0 0 8px #ff880040`
            }} />
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-primary)',
            fontWeight: '700',
            minWidth: '35px',
            textAlign: 'right'
          }}>
            {progress}%
          </div>
        </div>
      </div>

      {/* 디바이더 */}
      <div style={{
        height: '1px',
        backgroundColor: 'var(--border-primary)',
        margin: '0 var(--space-sm) var(--space-sm) var(--space-sm)',
        opacity: 1,
        position: 'relative',
        zIndex: 1
      }} />

      {/* 작업 정보 */}
      <div style={{
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : undefined,
        gridTemplateColumns: isMobile ? undefined : '1fr auto 1fr',
        gap: isMobile ? 'var(--space-xs)' : 'var(--space-xs)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* 왼쪽 컬럼 - 생성시각, 시작시각 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)'
        }}>
          {/* 생성 시각 */}
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
            }}>생성 시각:</span>
            <span style={{ 
              color: 'var(--text-primary)',
              fontWeight: '600',
              fontSize: '11px',
              fontFamily: '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatDateTime(mission?.createdTime)}
            </span>
          </div>
          
          {/* 시작 시각 */}
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
            }}>시작 시각:</span>
            <span style={{ 
              color: 'var(--text-primary)',
              fontWeight: '600',
              fontSize: '11px',
              fontFamily: '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatDateTime(mission?.startTime)}
            </span>
          </div>
        </div>

        {/* 세로 디바이더 - 데스크톱에서만 표시 */}
        {!isMobile && (
          <div style={{
            width: '1px',
            backgroundColor: 'var(--border-primary)',
            opacity: 0.7,
            margin: '0 var(--space-sm)'
          }} />
        )}

        {/* 오른쪽 컬럼 - 우선도, 종료시각 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)'
        }}>
          {/* 우선도 */}
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
            }}>우선도:</span>
            <span style={{ 
              color: priorityColor,
              fontWeight: '700',
              fontSize: '11px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {priority}
            </span>
          </div>
          
          {/* 종료 시각 */}
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
            }}>종료 시각:</span>
            <span style={{ 
              color: 'var(--text-primary)',
              fontWeight: '600',
              fontSize: '11px',
              fontFamily: '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatDateTime(mission?.endTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionCard; 
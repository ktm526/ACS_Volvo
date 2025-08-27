import React, { useState, useEffect, useRef } from 'react';
import { getPriorityColor, getTypeIcon } from '../../utils/mainPageUtils';
import { getStatusColor, getStatusIcon } from '../../constants';

const MissionCard = ({ mission, onShowDetail, isMobile = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const prevMissionRef = useRef(null);
  
  // 안전한 기본값 설정 - 백엔드 데이터 구조에 맞게 수정
  const title = mission?.title || mission?.name || 'Unknown Mission';
  const type = mission?.mission_type || mission?.type || 'transport';
  const status = mission?.status || 'pending';
  const priority = mission?.priority || 'medium';
  const robotId = mission?.robot_id;
  const robotName = mission?.robot_name || (robotId ? `Robot ${robotId}` : 'N/A');
  const progress = mission?.progress || 0;
  const id = mission?.id;
  
  const statusColor = getStatusColor(status);
  const priorityColor = getPriorityColor(priority);

  // 업데이트 감지 및 애니메이션
  useEffect(() => {
    if (prevMissionRef.current && mission) {
      const prev = prevMissionRef.current;
      const hasChanges = 
        prev.status !== mission.status ||
        prev.progress !== mission.progress ||
        prev.robot_id !== mission.robot_id;
      
      if (hasChanges) {
        setIsUpdating(true);
        const timer = setTimeout(() => setIsUpdating(false), 800);
        return () => clearTimeout(timer);
      }
    }
    
    // 현재 미션 데이터를 이전 값으로 저장 (깊은 복사)
    if (mission) {
      prevMissionRef.current = {
        status: mission.status,
        progress: mission.progress,
        robot_id: mission.robot_id
      };
    }
  }, [mission?.status, mission?.progress, mission?.robot_id]);
  
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

  // 상태별 한국어 표시
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

  // 우선순위별 한국어 표시
  const getPriorityText = (priority) => {
    const priorityMap = {
      'high': '높음',
      'medium': '보통',
      'low': '낮음'
    };
    return priorityMap[priority] || priority;
  };

  // 미션 타입별 한국어 표시
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

    if (isUpdating) {
      return {
        ...baseStyle,
        background: `linear-gradient(135deg, var(--bg-card) 0%, var(--primary-color)08 100%)`,
        border: `2px solid var(--primary-color)60`,
        boxShadow: `
          0 0 25px var(--primary-color)50,
          0 0 50px var(--primary-color)25,
          0 0 100px var(--primary-color)15
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

  // 정보 영역 클릭 핸들러 (로봇 카드와 동일한 패턴)
  const handleInfoAreaClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShowDetail) {
      onShowDetail(mission);
    }
  };

  return (
    <>
      <div
        style={getCardStyle()}
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

      {/* 빛나는 배경 효과 (호버 시 또는 업데이트 시) */}
      {(isHovered || isUpdating) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isUpdating 
            ? `radial-gradient(circle at 50% 50%, var(--primary-color)12, transparent 70%)`
            : `radial-gradient(circle at 30% 30%, ${statusColor}08, transparent 70%)`,
          opacity: isUpdating ? 0.6 : 0.4,
          transition: 'opacity 0.3s ease',
          willChange: 'opacity',
          animation: isUpdating ? 'pulse 1s ease-in-out' : 'none'
        }} />
      )}

      {/* 업데이트 표시등 */}
      {isUpdating && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color)',
          boxShadow: `0 0 15px var(--primary-color)80`,
          animation: 'pulse 1s ease-in-out',
          zIndex: 10
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
              {title}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '2px'
            }}>
              {getTypeText(type)} • ID: {id}
            </div>
          </div>
        </div>
        
        {/* 상태 표시 */}
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
          {getStatusText(status)}
        </div>
      </div>

      {/* 로봇 및 진행률 표시 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-sm)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* 로봇 정보 */}
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
          <i className="fas fa-robot" style={{ marginRight: '6px', color: 'var(--text-secondary)' }}></i>
          {robotName}
        </div>
        
        {/* 진행률 */}
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
              transition: 'width 0.6s ease-out',
              borderRadius: '4px',
              boxShadow: progress >= 100 ? 
                `0 0 8px #00ff8840` :
                progress >= 75 ? 
                `0 0 8px #00d4ff40` :
                progress >= 50 ? 
                `0 0 8px #ffdd0040` :
                `0 0 8px #ff880040`,
              animation: isUpdating ? 'pulse 0.5s ease-in-out' : 'none'
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

      {/* 미션 정보 영역 (클릭 가능) */}
      <div 
        onClick={handleInfoAreaClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : '1fr auto 1fr',
          gap: isMobile ? 'var(--space-xs)' : 'var(--space-xs)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          position: 'relative',
          zIndex: 1,
          cursor: 'pointer',
          padding: 'var(--space-sm)',
          margin: 'calc(-1 * var(--space-sm))',
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.3s ease'
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
            }}>생성:</span>
            <span style={{ 
              color: 'var(--text-primary)',
              fontWeight: '600',
              fontSize: '11px',
              fontFamily: '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatDateTime(mission?.created_at)}
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
            }}>시작:</span>
            <span style={{ 
              color: 'var(--text-primary)',
              fontWeight: '600',
              fontSize: '11px',
              fontFamily: '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatDateTime(mission?.start_time)}
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
              {getPriorityText(priority)}
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
            }}>완료:</span>
            <span style={{ 
              color: 'var(--text-primary)',
              fontWeight: '600',
              fontSize: '11px',
              fontFamily: '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatDateTime(mission?.end_time)}
            </span>
                    </div>
        </div>

        {/* 호버 시 클릭 가이드 오버레이 */}
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
      </div>
    </>
  );
};

export default MissionCard; 
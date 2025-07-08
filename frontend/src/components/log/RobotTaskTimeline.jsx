import React, { useState, useRef, useEffect } from 'react';
import { getStatusColor, getStatusIcon } from '../../constants';

const RobotTaskTimeline = () => {
  const [timeRange, setTimeRange] = useState('12h');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const timelineContainerRef = useRef(null);
  const timelineMainRef = useRef(null);

  // 노션 스타일 태스크 데이터
  const generateTaskData = () => {
    const now = new Date();
    const baseTime = new Date(now.getTime() - 8 * 60 * 60 * 1000); // 8시간 전부터 시작
    
    return [
      {
        id: 'task-1',
        title: '물류센터 부품 적재',
        robotId: 'Robot-001',
        status: 'completed',
        startTime: new Date(baseTime.getTime()),
        endTime: new Date(baseTime.getTime() + 45 * 60 * 1000),
        assignee: 'Robot-001',
        category: 'logistics',
        progress: 100,
        description: '전자부품 50박스 적재 완료'
      },
      {
        id: 'task-2',
        title: '작업장1 부품 운송',
        robotId: 'Robot-001',
        status: 'completed',
        startTime: new Date(baseTime.getTime() + 60 * 60 * 1000),
        endTime: new Date(baseTime.getTime() + 90 * 60 * 1000),
        assignee: 'Robot-001',
        category: 'transport',
        progress: 100,
        description: '부품 운송 임무 완료'
      },
      {
        id: 'task-3',
        title: '장비 점검 및 정비',
        robotId: 'Robot-001',
        status: 'in-progress',
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
        assignee: 'Robot-001',
        category: 'maintenance',
        progress: 65,
        description: '정기 점검 진행 중'
      },
      {
        id: 'task-4',
        title: '배터리 충전',
        robotId: 'Robot-002',
        status: 'completed',
        startTime: new Date(baseTime.getTime() + 30 * 60 * 1000),
        endTime: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000),
        assignee: 'Robot-002',
        category: 'maintenance',
        progress: 100,
        description: '배터리 충전 완료'
      },
      {
        id: 'task-5',
        title: '포장센터 작업 지원',
        robotId: 'Robot-002',
        status: 'completed',
        startTime: new Date(baseTime.getTime() + 2.5 * 60 * 60 * 1000),
        endTime: new Date(baseTime.getTime() + 4 * 60 * 60 * 1000),
        assignee: 'Robot-002',
        category: 'packaging',
        progress: 100,
        description: '포장 작업 지원 완료'
      },
      {
        id: 'task-6',
        title: '품질검사 보조',
        robotId: 'Robot-003',
        status: 'completed',
        startTime: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000),
        endTime: new Date(baseTime.getTime() + 3 * 60 * 60 * 1000),
        assignee: 'Robot-003',
        category: 'quality',
        progress: 100,
        description: '품질검사 보조 완료'
      },
      {
        id: 'task-7',
        title: '시스템 오류 복구',
        robotId: 'Robot-003',
        status: 'blocked',
        startTime: new Date(now.getTime() - 30 * 60 * 1000),
        endTime: new Date(now.getTime() + 30 * 60 * 1000),
        assignee: 'Robot-003',
        category: 'maintenance',
        progress: 20,
        description: '시스템 오류 복구 대기'
      },
      {
        id: 'task-8',
        title: '창고 정리 및 재배치',
        robotId: 'Robot-004',
        status: 'completed',
        startTime: new Date(baseTime.getTime() + 1 * 60 * 60 * 1000),
        endTime: new Date(baseTime.getTime() + 3.5 * 60 * 60 * 1000),
        assignee: 'Robot-004',
        category: 'organization',
        progress: 100,
        description: '창고 정리 완료'
      },
      {
        id: 'task-9',
        title: '긴급 배송 임무',
        robotId: 'Robot-005',
        status: 'in-progress',
        startTime: new Date(now.getTime() - 45 * 60 * 1000),
        endTime: new Date(now.getTime() + 15 * 60 * 1000),
        assignee: 'Robot-005',
        category: 'delivery',
        progress: 80,
        description: '긴급 배송 진행 중'
      },
      {
        id: 'task-10',
        title: '출고장 작업',
        robotId: 'Robot-005',
        status: 'not-started',
        startTime: new Date(now.getTime() + 30 * 60 * 1000),
        endTime: new Date(now.getTime() + 90 * 60 * 1000),
        assignee: 'Robot-005',
        category: 'shipping',
        progress: 0,
        description: '출고장 작업 예정'
      }
    ];
  };

  const tasks = generateTaskData();

  // 시간 범위 계산
  const getTimeRange = () => {
    const now = new Date();
    let startTime, endTime;

    switch (timeRange) {
      case '12h':
        startTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        endTime = now;
        break;
      case 'today':
        startTime = new Date(now);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(now);
        endTime.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startTime = new Date(now);
        startTime.setDate(now.getDate() - 7);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(now);
        endTime.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (customStartTime && customEndTime) {
          startTime = new Date(customStartTime);
          endTime = new Date(customEndTime);
        } else {
          startTime = new Date(now);
          startTime.setHours(0, 0, 0, 0);
          endTime = new Date(now);
          endTime.setHours(23, 59, 59, 999);
        }
        break;
      default:
        startTime = new Date(now);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(now);
        endTime.setHours(23, 59, 59, 999);
    }

    return { startTime, endTime };
  };

  const { startTime, endTime } = getTimeRange();
  const totalDuration = endTime - startTime;
  const timelineWidth = Math.max(800, totalDuration / (1000 * 60) * 2);

  // 로봇별 태스크 그룹화
  const robotGroups = tasks.reduce((groups, task) => {
    if (!groups[task.robotId]) {
      groups[task.robotId] = [];
    }
    groups[task.robotId].push(task);
    return groups;
  }, {});

  // 시간을 픽셀로 변환
  const timeToPixel = (time) => {
    const ratio = (time - startTime) / totalDuration;
    return ratio * timelineWidth;
  };

  // 시간 눈금 생성
  const generateTimeMarks = () => {
    const marks = [];
    const currentTime = new Date(startTime);
    const durationInDays = (endTime - startTime) / (24 * 60 * 60 * 1000);
    
    // 일주일 이상이면 날짜+시간, 아니면 시간만
    const showDate = durationInDays >= 7;
    
    if (showDate) {
      // 일주일 이상: 12시간 간격으로 표시 (날짜 포함)
      currentTime.setHours(0, 0, 0, 0); // 자정으로 맞춤
      while (currentTime <= endTime) {
        if (currentTime >= startTime) {
          const isNewDay = currentTime.getHours() === 0;
          marks.push({
            time: new Date(currentTime),
            position: timeToPixel(currentTime),
            label: isNewDay 
              ? currentTime.toLocaleDateString('ko-KR', { 
                  month: 'short', 
                  day: 'numeric' 
                }) + ' ' + currentTime.toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })
              : currentTime.toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })
          });
        }
        currentTime.setHours(currentTime.getHours() + 12);
      }
    } else {
      // 일주일 미만: 1시간 간격으로 표시 (시간만)
      currentTime.setMinutes(0, 0, 0); // 정시로 맞춤
      while (currentTime <= endTime) {
        if (currentTime >= startTime) {
          marks.push({
            time: new Date(currentTime),
            position: timeToPixel(currentTime),
            label: currentTime.toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })
          });
        }
        currentTime.setHours(currentTime.getHours() + 1);
      }
    }
    
    return marks;
  };

  const timeMarks = generateTimeMarks();

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const containers = document.querySelectorAll('.timeline-scroll');
    
    containers.forEach(container => {
      if (container !== e.target) {
        container.scrollLeft = scrollLeft;
      }
    });
  };

  const smoothScrollTo = (targetScroll) => {
    const containers = document.querySelectorAll('.timeline-scroll');
    
    containers.forEach(container => {
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    });
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card-title">
          <i className="fas fa-tasks"></i>
          로봇 태스크 타임라인
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: 'var(--space-xs)',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = 'var(--primary-color)';
            e.target.style.backgroundColor = 'var(--bg-secondary)';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = 'var(--text-secondary)';
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
        </button>
      </div>

      <div 
        className="card-content"
        style={{
          maxHeight: isExpanded ? '1000px' : '0',
          opacity: isExpanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out, padding 0.3s ease-out',
          padding: isExpanded ? 'var(--space-lg)' : '0'
        }}
      >
        {/* 컨트롤 패널 */}
        {isExpanded && (
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-sm)', 
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-md)'
          }}>
          {/* 시간 범위 선택 */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: 'var(--space-xs) var(--space-sm)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-xs)'
            }}
          >
            <option value="12h">12시간</option>
            <option value="today">하루</option>
            <option value="week">일주일</option>
            <option value="custom">사용자 지정</option>
          </select>

          {/* 사용자 정의 시간 */}
          {timeRange === 'custom' && (
            <>
              <input
                type="datetime-local"
                value={customStartTime}
                onChange={(e) => setCustomStartTime(e.target.value)}
                style={{
                  padding: 'var(--space-xs)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-xs)'
                }}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>~</span>
              <input
                type="datetime-local"
                value={customEndTime}
                onChange={(e) => setCustomEndTime(e.target.value)}
                style={{
                  padding: 'var(--space-xs)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-xs)'
                }}
              />
            </>
          )}
        </div>
        )}

        {Object.keys(robotGroups).length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            선택된 시간 범위에 태스크가 없습니다.
          </div>
        ) : (
          <div 
            ref={timelineMainRef}
            style={{ 
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden'
            }}
          >
            {/* 시간 헤더 */}
            <div 
              style={{
                height: '40px',
                backgroundColor: 'var(--bg-secondary)',
                borderBottom: '2px solid var(--border-primary)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                display: 'flex'
              }}
            >
              {/* 로봇 이름 컬럼 헤더 */}
              <div style={{
                width: '120px',
                padding: 'var(--space-sm)',
                borderRight: '1px solid var(--border-primary)',
                fontWeight: '600',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)'
              }}>
                로봇
              </div>
              
              {/* 스크롤 가능한 시간 헤더 */}
              <div 
                ref={timelineContainerRef}
                className="timeline-scroll"
                style={{
                  flex: 1,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  scrollbarWidth: 'thin'
                }}
                onScroll={handleScroll}
              >
                <div style={{
                  width: `${timelineWidth}px`,
                  height: '100%',
                  position: 'relative',
                  backgroundColor: 'var(--bg-secondary)'
                }}>
                  {timeMarks.map((mark, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        left: `${mark.position}px`,
                        top: 0,
                        height: '100%',
                        borderLeft: index === 0 ? 'none' : '1px solid var(--border-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 'var(--space-xs)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)',
                        fontWeight: '500'
                      }}
                    >
                      {mark.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 로봇별 태스크 레인 */}
            <div 
              style={{
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              {Object.entries(robotGroups).map(([robotId, robotTasks], robotIndex) => (
                <div
                  key={robotId}
                  style={{
                    height: '60px',
                    display: 'flex',
                    borderBottom: '1px solid var(--border-primary)',
                    backgroundColor: robotIndex % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)'
                  }}
                >
                  {/* 로봇 이름 */}
                  <div style={{
                    width: '120px',
                    padding: 'var(--space-sm)',
                    borderRight: '1px solid var(--border-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'inherit'
                  }}>
                    <div>
                      <div style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        color: 'var(--primary-color)',
                        marginBottom: '2px'
                      }}>
                        {robotId}
                      </div>
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-tertiary)'
                      }}>
                        {robotTasks.length}개 태스크
                      </div>
                    </div>
                  </div>

                  {/* 태스크 타임라인 */}
                  <div 
                    className="timeline-scroll"
                    style={{
                      flex: 1,
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      scrollbarWidth: 'thin'
                    }}
                    onScroll={handleScroll}
                  >
                    <div style={{
                      width: `${timelineWidth}px`,
                      height: '100%',
                      position: 'relative',
                      backgroundColor: 'inherit'
                    }}>
                      {robotTasks.map((task) => {
                        const startPos = Math.max(0, timeToPixel(task.startTime));
                        const endPos = Math.min(timelineWidth, timeToPixel(task.endTime));
                        const width = Math.max(20, endPos - startPos);
                        
                        return (
                          <div
                            key={task.id}
                            title={`${task.title} (${task.status}) - ${task.description}`}
                            style={{
                              position: 'absolute',
                              left: `${startPos}px`,
                              top: '10px',
                              width: `${width}px`,
                              height: '40px',
                              backgroundColor: getStatusColor(task.status),
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 var(--space-sm)',
                              fontSize: 'var(--font-size-xs)',
                              color: 'white',
                              fontWeight: '500',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className={getStatusIcon(task.status)}></i>
                              <span>{width > 80 ? task.title : task.title.substring(0, 10) + '...'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 범례 */}
        {isExpanded && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 'var(--space-md)',
            padding: 'var(--space-sm)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-xs)'
          }}>
          {/* 상태 범례 */}
          <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: getStatusColor('completed'), borderRadius: '2px' }}></div>
              <span>완료</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: getStatusColor('in-progress'), borderRadius: '2px' }}></div>
              <span>진행중</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: getStatusColor('blocked'), borderRadius: '2px' }}></div>
              <span>차단</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: getStatusColor('not-started'), borderRadius: '2px' }}></div>
              <span>대기</span>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RobotTaskTimeline; 
import React, { useEffect } from 'react';
import RobotCard from './RobotCard';
import MissionCard from './MissionCard';
import { calculateStats, calculateMissionStats } from '../../utils/mainPageUtils';

const Sidebar = ({ 
  sidebarTab, 
  setSidebarTab, 
  robots, 
  missions, 
  trackedRobot,
  onShowRobotDetail,
  onTrackToggle,
  isLoading = false,
  isMobile = false,
  onClose
}) => {
  const stats = calculateStats(robots);
  const missionStats = calculateMissionStats(missions);

  // 동적 CSS 애니메이션 주입
  useEffect(() => {
    const styleId = 'sidebar-animations';
    
    // 기존 스타일 제거
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // 새 스타일 추가
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @keyframes loading-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);

    // 컴포넌트 언마운트 시 스타일 제거
    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-primary)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 모바일 헤더 (닫기 버튼 포함) */}
      {isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-md)',
          borderBottom: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
          <div style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            ACS 제어판
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-primary)';
              e.target.style.borderColor = 'var(--primary-color)';
              e.target.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = 'var(--border-primary)';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* 탭 헤더 */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--border-primary)'
      }}>
        <button
          onClick={() => setSidebarTab('robots')}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
            backgroundColor: sidebarTab === 'robots' ? 'var(--bg-secondary)' : 'transparent',
            border: 'none',
            borderBottom: sidebarTab === 'robots' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: sidebarTab === 'robots' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          <i className="fas fa-robot"></i>
          <span>{isMobile ? '로봇' : '로봇 현황'}</span>
        </button>
        <button
          onClick={() => setSidebarTab('missions')}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
            backgroundColor: sidebarTab === 'missions' ? 'var(--bg-secondary)' : 'transparent',
            border: 'none',
            borderBottom: sidebarTab === 'missions' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: sidebarTab === 'missions' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          <i className="fas fa-tasks"></i>
          <span>{isMobile ? '작업' : '작업 목록'}</span>
        </button>
      </div>

      {/* 통계 헤더 */}
      <div style={{
        padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
        borderBottom: '1px solid var(--border-primary)',
        opacity: isLoading ? 0.6 : 1,
        transition: 'opacity 0.3s ease'
      }}>
        <h3 style={{
          margin: 0,
          marginBottom: 'var(--space-md)',
          fontSize: isMobile ? 'var(--font-size-base)' : 'var(--font-size-lg)',
          fontWeight: '700',
          color: 'var(--text-primary)'
        }}>
          {sidebarTab === 'robots' ? '로봇 현황' : '작업 현황'}
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: isMobile ? 'var(--space-sm)' : 'var(--space-md)'
        }}>
          {sidebarTab === 'robots' ? (
            <>
              <div style={{
                padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {isLoading && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent)',
                    animation: 'loading-shimmer 2s infinite'
                  }}></div>
                )}
                <div style={{
                  fontSize: isMobile ? 'var(--font-size-lg)' : 'var(--font-size-2xl)',
                  fontWeight: '700',
                  color: 'var(--primary-color)'
                }}>
                  {isLoading ? '---' : stats.total}
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
                padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {isLoading && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent)',
                    animation: 'loading-shimmer 2s infinite 0.5s'
                  }}></div>
                )}
                <div style={{
                  fontSize: isMobile ? 'var(--font-size-lg)' : 'var(--font-size-2xl)',
                  fontWeight: '700',
                  color: 'var(--status-success)'
                }}>
                  {isLoading ? '---' : stats.moving}
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
                padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {isLoading && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent)',
                    animation: 'loading-shimmer 2s infinite'
                  }}></div>
                )}
                <div style={{
                  fontSize: isMobile ? 'var(--font-size-lg)' : 'var(--font-size-2xl)',
                  fontWeight: '700',
                  color: 'var(--primary-color)'
                }}>
                  {isLoading ? '---' : missionStats.total}
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
                padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {isLoading && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent)',
                    animation: 'loading-shimmer 2s infinite 0.5s'
                  }}></div>
                )}
                <div style={{
                  fontSize: isMobile ? 'var(--font-size-lg)' : 'var(--font-size-2xl)',
                  fontWeight: '700',
                  color: 'var(--status-info)'
                }}>
                  {isLoading ? '---' : missionStats.inProgress}
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
        padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)'
      }}>
        {isLoading ? (
          // 로딩 중 스켈레톤 UI
          <div style={{ opacity: 0.6 }}>
            {[...Array(isMobile ? 2 : 3)].map((_, index) => (
              <div
                key={index}
                style={{
                  padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
                  marginBottom: 'var(--space-sm)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-lg)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: isMobile ? '100px' : '120px'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent)',
                  animation: `loading-shimmer 2s infinite ${index * 0.3}s`
                }}></div>
                
                {/* 스켈레톤 내용 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  marginBottom: 'var(--space-sm)'
                }}>
                  <div style={{
                    width: isMobile ? '24px' : '32px',
                    height: isMobile ? '24px' : '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-primary)'
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      height: isMobile ? '12px' : '16px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-xs)',
                      width: '70%'
                    }}></div>
                    <div style={{
                      height: isMobile ? '10px' : '12px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      width: '50%'
                    }}></div>
                  </div>
                </div>
                
                <div style={{
                  height: isMobile ? '10px' : '12px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--space-xs)',
                  width: '80%'
                }}></div>
                
                <div style={{
                  height: isMobile ? '8px' : '10px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  width: '60%'
                }}></div>
              </div>
            ))}
          </div>
        ) : (
          // 정상 데이터 표시
          <>
            {sidebarTab === 'robots' ? (
              // 로봇 목록
              robots.map(robot => (
                <RobotCard
                  key={robot.id}
                  robot={robot}
                  isTracked={trackedRobot === robot.id}
                  onShowDetail={onShowRobotDetail}
                  onTrackToggle={onTrackToggle}
                  isMobile={isMobile}
                />
              ))
            ) : (
              // 작업 목록
              <>
                {missions.map(mission => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    isMobile={isMobile}
                  />
                ))}
                
                {/* 작업 추가 버튼 */}
                <button
                  onClick={() => {
                    // TODO: 작업 추가 모달 또는 페이지로 이동
                    console.log('작업 추가 버튼 클릭');
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
                    marginTop: 'var(--space-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '2px dashed var(--border-primary)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-secondary)',
                    fontSize: isMobile ? 'var(--font-size-sm)' : 'var(--font-size-base)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-sm)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-primary)';
                    e.target.style.borderColor = 'var(--primary-color)';
                    e.target.style.color = 'var(--text-primary)';
                    e.target.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                    e.target.style.borderColor = 'var(--border-primary)';
                    e.target.style.color = 'var(--text-secondary)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <i className="fas fa-plus" style={{
                    fontSize: isMobile ? 'var(--font-size-sm)' : 'var(--font-size-base)',
                    opacity: 0.7
                  }}></i>
                  <span>새 작업 추가</span>
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 
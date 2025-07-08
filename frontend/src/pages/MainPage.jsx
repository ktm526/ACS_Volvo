import React, { useState, useEffect } from 'react';
import Scene3D from '../components/3d/Scene3D';
import Sidebar from '../components/main/Sidebar';
import MainViewOverlay from '../components/main/MainViewOverlay';
import MapControls from '../components/main/MapControls';
import { useRobots } from '../hooks/useRobots';
import { useMissions } from '../hooks/useMissions';
import { useSimulatedData } from '../hooks/useSimulatedData';
import { useAppContext } from '../contexts/AppContext.jsx';
import { calculateStats } from '../utils/mainPageUtils';

const MainPage = () => {
  const { robots, loading: robotsLoading, error: robotsError } = useRobots();
  const { missions, loading: missionsLoading, error: missionsError } = useMissions();
  const { state } = useAppContext();

  const [selectedRobot, setSelectedRobot] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [liveDataEnabled, setLiveDataEnabled] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('robots');
  
  // 지도 컨트롤 상태
  const [zoomLevel, setZoomLevel] = useState(1);
  const [trackedRobot, setTrackedRobot] = useState(null);
  
  // 최소 로딩 시간 보장을 위한 상태
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const [dataLoadingComplete, setDataLoadingComplete] = useState(false);

  // 반응형 상태
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 시뮬레이션 데이터 훅 사용
  const { simulatedRobots, simulatedMissions } = useSimulatedData(liveDataEnabled);

  // 실제 데이터 또는 시뮬레이션 데이터 사용
  const activeRobots = simulatedRobots || robots || [];
  const activeMissions = simulatedMissions || missions || [];
  
  // 통계 계산
  const stats = calculateStats(activeRobots);

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      // 모바일에서 데스크톱으로 변경될 때 사이드바 자동 열기
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 지도 컨트롤 핸들러들
  const handleViewModeChange = (newViewMode) => {
    console.log('View mode change:', viewMode, '->', newViewMode);
    setViewMode(newViewMode);
  };

  const handleZoomChange = (newZoomLevel) => {
    console.log('Zoom change:', zoomLevel, '->', newZoomLevel);
    setZoomLevel(newZoomLevel);
  };

  const handleRobotTrack = (robotId) => {
    console.log('Robot track change:', trackedRobot, '->', robotId);
    setTrackedRobot(robotId);
    if (robotId) {
      setSelectedRobot(robotId);
    }
  };

  // 컴포넌트 마운트 시 최소 로딩 시간 타이머 시작
  useEffect(() => {
    const minLoadingTimer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 3000); // 3초 최소 로딩 시간

    return () => clearTimeout(minLoadingTimer);
  }, []);

  // 실제 데이터 로딩 상태 체크
  useEffect(() => {
    if (!robotsLoading && !missionsLoading) {
      setDataLoadingComplete(true);
    }
  }, [robotsLoading, missionsLoading]);

  // 최소 로딩 시간과 데이터 로딩 둘 다 완료되어야 로딩 끝
  const isLoading = !minLoadingComplete || !dataLoadingComplete;

  // CSS 키프레임 스타일을 동적으로 주입
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes cyberspin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes cyberspin-reverse {
        0% { transform: rotate(360deg); }
        100% { transform: rotate(0deg); }
      }
      
      @keyframes pulse-glow {
        0%, 100% { 
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
          box-shadow: 0 0 30px var(--primary-color);
        }
        50% { 
          opacity: 0.7;
          transform: translate(-50%, -50%) scale(1.2);
          box-shadow: 0 0 50px var(--primary-color), 0 0 80px rgba(0, 212, 255, 0.3);
        }
      }
      
      @keyframes particle-orbit {
        0% { 
          transform: translate(-50%, -50%) rotate(0deg) translateY(-${isMobile ? '30px' : '45px'});
          opacity: 1;
        }
        50% { 
          opacity: 0.5;
        }
        100% { 
          transform: translate(-50%, -50%) rotate(360deg) translateY(-${isMobile ? '30px' : '45px'});
          opacity: 1;
        }
      }
      
      @keyframes text-glow {
        0% { 
          text-shadow: 0 0 20px var(--primary-color);
        }
        100% { 
          text-shadow: 0 0 30px var(--primary-color), 0 0 40px var(--accent-color);
        }
      }
      
      @keyframes text-fade {
        0% { opacity: 0.6; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [isMobile]);

  // 사이드바 토글 함수
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // 모바일에서 사이드바 외부 클릭 시 닫기
  const handleOverlayClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

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
      {/* 메인 콘텐츠 영역 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* 모바일 햄버거 메뉴 */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            style={{
              position: 'absolute',
              top: 'var(--space-md)',
              left: 'var(--space-md)',
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-lg)',
              cursor: 'pointer',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
              e.target.style.borderColor = 'var(--primary-color)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
              e.target.style.borderColor = 'var(--border-primary)';
            }}
          >
            <i className={sidebarOpen ? "fas fa-times" : "fas fa-bars"}></i>
          </button>
        )}

        {/* 모바일 오버레이 */}
        {isMobile && sidebarOpen && (
          <div
            onClick={handleOverlayClick}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
              backdropFilter: 'blur(4px)'
            }}
          />
        )}

        {/* 왼쪽 사이드바 */}
        <div style={{
          width: isMobile ? '280px' : '350px',
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          transition: 'transform 0.3s ease',
          position: isMobile ? 'absolute' : 'relative',
          height: '100%',
          zIndex: 1000
        }}>
          <Sidebar
            sidebarTab={sidebarTab}
            setSidebarTab={setSidebarTab}
            robots={activeRobots}
            missions={activeMissions}
            selectedRobot={selectedRobot}
            setSelectedRobot={setSelectedRobot}
            isLoading={isLoading}
            isMobile={isMobile}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* 중앙: 3D 뷰 또는 로딩 화면 */}
        <div style={{
          flex: 1,
          position: 'relative',
          backgroundColor: 'var(--bg-primary)',
          marginLeft: isMobile ? '0' : '0' // 모바일에서는 사이드바가 오버레이되므로 마진 없음
        }}>
          {isLoading ? (
            // 로딩 화면
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 'var(--space-xl)'
            }}>
              {/* 사이버네틱 로딩 아이콘 */}
              <div style={{
                position: 'relative',
                width: isMobile ? '80px' : '120px',
                height: isMobile ? '80px' : '120px'
              }}>
                {/* 외부 링 */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  border: '3px solid transparent',
                  borderTop: '3px solid var(--primary-color)',
                  borderRight: '3px solid var(--accent-color)',
                  borderRadius: '50%',
                  animation: 'cyberspin 2s linear infinite',
                  boxShadow: '0 0 20px var(--primary-color), inset 0 0 20px rgba(0, 212, 255, 0.1)'
                }}></div>
                
                {/* 중간 링 */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '15px',
                  width: 'calc(100% - 30px)',
                  height: 'calc(100% - 30px)',
                  border: '2px solid transparent',
                  borderTop: '2px solid var(--accent-color)',
                  borderLeft: '2px solid var(--primary-color)',
                  borderRadius: '50%',
                  animation: 'cyberspin-reverse 1.5s linear infinite',
                  boxShadow: '0 0 15px var(--accent-color)'
                }}></div>
                
                {/* 내부 링 */}
                <div style={{
                  position: 'absolute',
                  top: '30px',
                  left: '30px',
                  width: 'calc(100% - 60px)',
                  height: 'calc(100% - 60px)',
                  border: '1px solid transparent',
                  borderTop: '1px solid var(--primary-color)',
                  borderBottom: '1px solid var(--accent-color)',
                  borderRadius: '50%',
                  animation: 'cyberspin 1s linear infinite',
                  boxShadow: '0 0 10px var(--primary-color)'
                }}></div>
                
                {/* 중앙 코어 */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? '12px' : '20px',
                  height: isMobile ? '12px' : '20px',
                  backgroundColor: 'var(--primary-color)',
                  borderRadius: '50%',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                  boxShadow: '0 0 30px var(--primary-color)'
                }}></div>
                
                {/* 빛 파티클들 */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: isMobile ? '2px' : '4px',
                      height: isMobile ? '2px' : '4px',
                      backgroundColor: 'var(--accent-color)',
                      borderRadius: '50%',
                      transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-${isMobile ? '30px' : '45px'})`,
                      animation: `particle-orbit 3s linear infinite ${i * 0.125}s`,
                      boxShadow: '0 0 10px var(--accent-color)'
                    }}
                  ></div>
                ))}
              </div>

              <div style={{
                color: 'var(--text-primary)',
                fontSize: isMobile ? 'var(--font-size-lg)' : 'var(--font-size-xl)',
                fontWeight: '600',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textAlign: 'center',
                animation: 'text-glow 2s ease-in-out infinite alternate'
              }}>
                시스템 초기화 중...
              </div>
              
              <div style={{
                color: 'var(--text-tertiary)',
                fontSize: 'var(--font-size-sm)',
                textAlign: 'center',
                animation: 'text-fade 1.5s ease-in-out infinite alternate',
                padding: isMobile ? '0 var(--space-md)' : '0'
              }}>
                ACS 제어 시스템을 준비하고 있습니다
              </div>
              
              {/* 진행률 표시 */}
              <div style={{
                color: 'var(--text-tertiary)',
                fontSize: 'var(--font-size-xs)',
                textAlign: 'center',
                marginTop: 'var(--space-md)'
              }}>
                {!dataLoadingComplete ? '데이터 로딩 중...' : 
                 !minLoadingComplete ? '시스템 준비 중...' : '완료'}
              </div>
            </div>
          ) : (
            // 정상 3D 뷰
            <>
              <Scene3D 
                robots={activeRobots}
                missions={activeMissions}
                viewMode={viewMode}
                selectedRobot={selectedRobot}
                showPaths={true}
                showStations={true}
                showGrid={true}
                showLabels={true}
                zoomLevel={zoomLevel}
                trackedRobot={trackedRobot}
              />
              <MainViewOverlay stats={stats} />
              <MapControls
                robots={activeRobots}
                onViewModeChange={handleViewModeChange}
                onZoomChange={handleZoomChange}
                onRobotTrack={handleRobotTrack}
                viewMode={viewMode}
                trackedRobot={trackedRobot}
                zoomLevel={zoomLevel}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainPage; 
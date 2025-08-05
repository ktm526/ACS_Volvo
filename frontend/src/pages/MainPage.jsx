import React, { useState, useEffect } from 'react';
import Scene3D from '../components/3d/Scene3D';
import Sidebar from '../components/main/Sidebar';
import MainViewOverlay from '../components/main/MainViewOverlay';
import MapControls from '../components/main/MapControls';
import RobotDetailModal from '../components/main/RobotDetailModal';
import { useAppContext } from '../contexts/AppContext.jsx';
import { calculateStats } from '../utils/mainPageUtils';
import { robotsAPI } from '../services/api';

const MainPage = () => {
  const { state, actions } = useAppContext();
  
  // 로봇과 미션 데이터 상태
  const [robots, setRobots] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState({
    robots: true,
    missions: true
  });

  const [liveDataEnabled, setLiveDataEnabled] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('robots');
  
  // localStorage에서 카메라 상태 로드
  const loadCameraState = () => {
    try {
      const savedCameraState = localStorage.getItem('cameraState');
      if (savedCameraState) {
        const parsed = JSON.parse(savedCameraState);
        return {
          viewMode: parsed.viewMode || 'overview',
          zoomLevel: parsed.zoomLevel || 1,
          trackedRobot: null, // 추적 로봇은 세션별로 초기화
          cameraPosition: parsed.cameraPosition || null,
          cameraTarget: parsed.cameraTarget || null,
          cameraRotation: parsed.cameraRotation || null
        };
      }
    } catch (error) {
      console.error('Failed to load camera state from localStorage:', error);
    }
    return {
      viewMode: 'overview',
      zoomLevel: 1,
      trackedRobot: null,
      cameraPosition: null,
      cameraTarget: null,
      cameraRotation: null
    };
  };

  // localStorage에 카메라 상태 저장
  const saveCameraState = (cameraState) => {
    try {
      localStorage.setItem('cameraState', JSON.stringify(cameraState));
    } catch (error) {
      console.error('Failed to save camera state to localStorage:', error);
    }
  };

  // 지도 컨트롤 상태
  const initialCameraState = loadCameraState();
  const [viewMode, setViewMode] = useState(initialCameraState.viewMode);
  const [zoomLevel, setZoomLevel] = useState(initialCameraState.zoomLevel);
  const [trackedRobot, setTrackedRobot] = useState(initialCameraState.trackedRobot);
  const [cameraState, setCameraState] = useState({
    position: initialCameraState.cameraPosition,
    target: initialCameraState.cameraTarget,
    rotation: initialCameraState.cameraRotation
  });
  
  // 맵 관련 상태
  const [availableMaps, setAvailableMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [currentMapData, setCurrentMapData] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  
  // 최소 로딩 시간 보장을 위한 상태
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const [dataLoadingComplete, setDataLoadingComplete] = useState(false);

  // 반응형 상태
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 로봇 상세정보 모달 상태
  const [showRobotDetail, setShowRobotDetail] = useState(false);
  const [selectedRobotDetail, setSelectedRobotDetail] = useState(null);
  
  // 로봇 상세정보 모달 핸들러 도ㅇ해물과 배산ㅣ 마고 닳ㅗㅗㄱ 하님ㅣ 모
  const handleShowRobotDetail = (robot) => {
    setSelectedRobotDetail(robot);
    setShowRobotDetail(true);
  };
  
  const handleCloseRobotDetail = () => {
    setShowRobotDetail(false);
    setSelectedRobotDetail(null);
  };

  // 활성 데이터
  const activeRobots = robots || [];
  const activeMissions = missions || [];
  
  // 통계 계산
  const stats = calculateStats(activeRobots);

  // API URL 설정
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // 로봇 목록 로드
  const loadRobots = async () => {
    try {
      setLoading(prev => ({ ...prev, robots: true }));
      console.log('로봇 데이터 로딩 시작:', `${API_URL}/api/robots`);
      
      const response = await fetch(`${API_URL}/api/robots`);
      console.log('로봇 API 응답 상태:', response.status);
      
      const data = await response.json();
      console.log('로봇 API 응답 데이터:', data);
      
      if (response.ok) {
        const robotsData = data.data || [];
        console.log('설정된 로봇 데이터:', robotsData);
        console.log('첫 번째 로봇 위치 정보:', robotsData[0] ? {
          id: robotsData[0].id,
          name: robotsData[0].name,
          location_x: robotsData[0].location_x,
          location_y: robotsData[0].location_y,
          타입_x: typeof robotsData[0].location_x,
          타입_y: typeof robotsData[0].location_y
        } : 'No robots');
        setRobots(robotsData);
        // AppContext에도 업데이트
        actions.setRobots(robotsData);
      } else {
        console.error('로봇 API 에러:', data);
        actions.addNotification && actions.addNotification({
          type: 'error',
          message: '로봇 목록을 불러오는데 실패했습니다.'
        });
      }
    } catch (error) {
      console.error('로봇 목록 가져오기 실패:', error);
      actions.addNotification && actions.addNotification({
        type: 'error',
        message: '서버 연결에 실패했습니다.'
      });
    } finally {
      setLoading(prev => ({ ...prev, robots: false }));
    }
  };

  // 미션 목록 로드 (현재 백엔드에 미션 API 없음)
  const loadMissions = async () => {
    try {
      setLoading(prev => ({ ...prev, missions: true }));
      // 미션 API가 구현되지 않았으므로 빈 배열로 설정
      console.log('미션 API가 아직 구현되지 않음');
      setMissions([]);
    } catch (error) {
      console.error('미션 목록 가져오기 실패:', error);
      setMissions([]);
    } finally {
      setLoading(prev => ({ ...prev, missions: false }));
    }
  };

  // 맵 목록 가져오기
  const fetchAvailableMaps = async () => {
    console.log('fetchAvailableMaps: 맵 목록 가져오기 시작');
    
    try {
      const url = `${API_URL}/api/maps`;
      console.log('fetchAvailableMaps: API 호출', url);
      
      const response = await fetch(url);
      console.log('fetchAvailableMaps: 응답 상태', response.status);
      
      if (response.ok) {
        const maps = await response.json();
        console.log('fetchAvailableMaps: 맵 목록 로드 완료:', maps);
        setAvailableMaps(maps);
        
        // 첫 번째 맵을 기본 선택
        if (maps.length > 0 && !selectedMap) {
          console.log('fetchAvailableMaps: 첫 번째 맵 선택:', maps[0]);
          setSelectedMap(maps[0]);
        }
      } else {
        console.error('fetchAvailableMaps: 맵 목록을 가져오는데 실패했습니다', response.status, response.statusText);
        const errorText = await response.text();
        console.error('fetchAvailableMaps: 에러 응답:', errorText);
      }
    } catch (error) {
      console.error('fetchAvailableMaps: 맵 목록 가져오기 실패:', error);
    }
  };

  // 맵 데이터 가져오기
  const fetchMapData = async (mapId) => {
    if (!mapId) {
      console.log('fetchMapData: mapId가 없음');
      return;
    }
    
    console.log('fetchMapData: 맵 데이터 가져오기 시작', mapId);
    
    try {
      setMapLoading(true);
      const url = `${API_URL}/api/maps/${mapId}/data?sample=1&limit=999999`;
      console.log('fetchMapData: API 호출', url);
      
      const response = await fetch(url);
      console.log('fetchMapData: 응답 상태', response.status);
      
      if (response.ok) {
        const mapData = await response.json();
        console.log('fetchMapData: 맵 데이터 로드 완료:', mapData);
        setCurrentMapData(mapData);
      } else {
        console.error('fetchMapData: 맵 데이터를 가져오는데 실패했습니다', response.status, response.statusText);
        const errorText = await response.text();
        console.error('fetchMapData: 에러 응답:', errorText);
      }
    } catch (error) {
      console.error('fetchMapData: 맵 데이터 가져오기 실패:', error);
    } finally {
      setMapLoading(false);
    }
  };

  // 맵 선택 핸들러
  const handleMapSelect = (map) => {
    setSelectedMap(map);
    setCurrentMapData(null);
    fetchMapData(map.id);
  };

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

  // 카메라 상태 변경 및 저장 핸들러
  const handleViewModeChange = (newViewMode) => {
    console.log('View mode change:', viewMode, '->', newViewMode);
    setViewMode(newViewMode);
    
    // 카메라 상태 저장
    const newCameraState = {
      viewMode: newViewMode,
      zoomLevel,
      cameraPosition: cameraState.position,
      cameraTarget: cameraState.target,
      cameraRotation: cameraState.rotation
    };
    saveCameraState(newCameraState);
  };

  const handleZoomChange = (newZoomLevel) => {
    console.log('Zoom change:', zoomLevel, '->', newZoomLevel);
    setZoomLevel(newZoomLevel);
    
    // 카메라 상태 저장
    const newCameraState = {
      viewMode,
      zoomLevel: newZoomLevel,
      cameraPosition: cameraState.position,
      cameraTarget: cameraState.target,
      cameraRotation: cameraState.rotation
    };
    saveCameraState(newCameraState);
  };

  const handleRobotTrack = (robotId) => {
    console.log('Robot track change:', trackedRobot, '->', robotId);
    setTrackedRobot(robotId);
  };

  // 3D 씬에서 카메라 상태 변경을 받는 핸들러
  const handleCameraStateChange = (newCameraState) => {
    setCameraState(newCameraState);
    
    // 카메라 상태 저장
    const stateTosave = {
      viewMode,
      zoomLevel,
      cameraPosition: newCameraState.position,
      cameraTarget: newCameraState.target,
      cameraRotation: newCameraState.rotation
    };
    saveCameraState(stateTosave);
  };

  // 컴포넌트 마운트 시 최소 로딩 시간 타이머 시작
  useEffect(() => {
    const minLoadingTimer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 3000); // 3초 최소 로딩 시간

    return () => clearTimeout(minLoadingTimer);
  }, []);

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    loadRobots();
    loadMissions();
    fetchAvailableMaps();
  }, []);

  // 실시간 데이터 업데이트 (3초마다)
  useEffect(() => {
    if (!liveDataEnabled) return;

    const interval = setInterval(() => {
      console.log('🔄 실시간 로봇 데이터 업데이트 중...');
      loadRobots();
    }, 3000); // 3초마다 업데이트

    return () => clearInterval(interval);
  }, [liveDataEnabled]);

  // 선택된 맵이 변경될 때 맵 데이터 가져오기
  useEffect(() => {
    if (selectedMap) {
      fetchMapData(selectedMap.id);
    }
  }, [selectedMap]);

  // 실제 데이터 로딩 상태 체크
  useEffect(() => {
    if (!loading.robots && !loading.missions) {
      setDataLoadingComplete(true);
    }
  }, [loading.robots, loading.missions]);

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

  // AMR 이동 요청 핸들러
  const handleMoveRequest = async (robotId, nodeId) => {
    try {
      console.log('AMR 이동 요청:', { robotId, nodeId });
      
      // API 호출
      const result = await robotsAPI.requestMove(robotId, nodeId);
      console.log('AMR 이동 요청 성공:', result);
      
      // 알림 표시
      if (actions.addNotification) {
        actions.addNotification({
          type: 'success',
          message: `AMR 이동 요청이 완료되었습니다. (로봇 ID: ${robotId}, 노드 ID: ${nodeId})`
        });
      }
      
      // 로봇 데이터 새로고침 (이동 상태 반영)
      setTimeout(() => {
        loadRobots();
      }, 1000);
      
    } catch (error) {
      console.error('AMR 이동 요청 실패:', error);
      
      // 에러 알림 표시
      if (actions.addNotification) {
        actions.addNotification({
          type: 'error',
          message: error.message || 'AMR 이동 요청에 실패했습니다.'
        });
      }
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
            trackedRobot={trackedRobot}
            onShowRobotDetail={handleShowRobotDetail}
            onTrackToggle={handleRobotTrack}
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
                showPaths={true}
                showStations={true}
                showGrid={true}
                showLabels={true}
                zoomLevel={zoomLevel}
                trackedRobot={trackedRobot}
                mapData={currentMapData}
                showMapData={!!currentMapData}
                initialCameraState={cameraState}
                onCameraStateChange={handleCameraStateChange}
                onMoveRequest={handleMoveRequest}
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
                availableMaps={availableMaps}
                selectedMap={selectedMap}
                onMapSelect={handleMapSelect}
                mapLoading={mapLoading}
              />
            </>
          )}
        </div>
      </div>
      
      {/* 로봇 상세정보 모달 */}
      <RobotDetailModal
        robot={selectedRobotDetail}
        isOpen={showRobotDetail}
        onClose={handleCloseRobotDetail}
      />
    </div>
  );
};

export default MainPage; 
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext.jsx';
import { useRobots } from '../../hooks/useRobots';
import { useSimulatedData } from '../../hooks/useSimulatedData';
import { MENU_ITEMS } from '../../constants';

const Header = () => {
  const { state, actions } = useAppContext();
  const { robots, loading: robotsLoading } = useRobots();
  const { simulatedRobots } = useSimulatedData(true); // 시뮬레이션 데이터 사용
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredMenuItem, setHoveredMenuItem] = useState(null);
  const [navHovered, setNavHovered] = useState(false);
  const [showRealTime, setShowRealTime] = useState(true); // 실시간 시간 표시 여부
  const [appStartTime] = useState(new Date()); // 앱 시작 시간
  const [runtime, setRuntime] = useState(0); // 실행 시간 (초)
  const [isCompact, setIsCompact] = useState(false); // 컴팩트 모드 여부
  
  // 애니메이션 배경을 위한 ref들
  const menuRefs = useRef({});
  const navContainerRef = useRef(null);
  const [activeMenuStyle, setActiveMenuStyle] = useState({
    width: 0,
    left: 0,
    opacity: 0
  });

  // 실제 데이터 또는 시뮬레이션 데이터 사용 (MainPage와 동일한 방식)
  const activeRobots = simulatedRobots || robots || [];

  // 활성 메뉴 배경 위치 계산 함수
  const updateActiveMenuPosition = () => {
    const currentMenuItem = menuRefs.current[state.currentPage];
    const navContainer = navContainerRef.current;
    
    if (currentMenuItem && navContainer) {
      const menuRect = currentMenuItem.getBoundingClientRect();
      const navRect = navContainer.getBoundingClientRect();
      
      setActiveMenuStyle({
        width: menuRect.width,
        left: menuRect.left - navRect.left,
        opacity: 1
      });
    }
  };

  // 화면 크기 감지 (950px 이하에서 컴팩트 모드)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsCompact(window.innerWidth <= 950);
      // 화면 크기 변경 시 배경 위치도 업데이트
      setTimeout(() => {
        updateActiveMenuPosition();
      }, 50);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 활성 메뉴 변경 시 배경 위치 업데이트
  useEffect(() => {
    // 약간의 딜레이를 주어 DOM이 완전히 렌더링된 후 계산
    const timer = setTimeout(() => {
      updateActiveMenuPosition();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [state.currentPage, isCompact]);

  // 컴포넌트 마운트 시 초기 위치 설정
  useEffect(() => {
    const timer = setTimeout(() => {
      updateActiveMenuPosition();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // 실행 시간 계산 (초 단위)
      const elapsed = Math.floor((new Date() - appStartTime) / 1000);
      setRuntime(elapsed);
    }, 1000);
    return () => clearInterval(timer);
  }, [appStartTime]);

  const handleMenuClick = (menuId) => {
    actions.setCurrentPage(menuId);
  };

  // 시간 토글 핸들러
  const handleTimeClick = () => {
    setShowRealTime(!showRealTime);
  };

  // 실행 시간 포맷팅 (HH:MM:SS)
  const formatRuntime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 실제 AMR 연결 대수 계산
  const getConnectedAmrCount = () => {
    if (!activeRobots || activeRobots.length === 0) return 0;
    
    // 연결된 로봇의 수를 반환 (상태가 'connected' 또는 활성 상태인 로봇들)
    const connectedRobots = activeRobots.filter(robot => 
      robot.status === 'moving' || 
      robot.status === 'idle' || 
      robot.status === 'working' ||
      robot.status === 'charging'
    );
    
    return connectedRobots.length;
  };

  // 메뉴 아이콘 매핑
  const menuIcons = {
    main: 'fas fa-home',
    map: 'fas fa-map',
    log: 'fas fa-list-alt',
    settings: 'fas fa-cog'
  };
  
  return (
    <header 
      className="header"
      style={{ 
        position: 'relative',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 브랜드 섹션 - 컴팩트 모드에서는 숨김 */}
      {!isCompact && (
        <div className="header-brand">
          <div className="logo-icon">
            <i className="fas fa-robot"></i>
          </div>
          <div>
            <h1>ACS Control</h1>
            <div style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: 'var(--text-tertiary)',
              textTransform: 'none',
              letterSpacing: '0.02em'
            }}>
              Autonomous Control System
            </div>
          </div>
        </div>
      )}

      {/* 중앙 네비게이션 메뉴 */}
      <nav 
        ref={navContainerRef}
        className="header-navigation"
        style={{
          border: '1px solid var(--primary-color)',
          borderColor: navHovered ? 'var(--accent-color)' : 'var(--primary-color)',
          boxShadow: navHovered 
            ? '0 0 20px var(--primary-color), 0 0 35px rgba(0, 212, 255, 0.2)' 
            : '0 0 15px var(--primary-color), 0 0 25px rgba(0, 212, 255, 0.15)',
          transition: 'all 0.3s ease',
          // 컴팩트 모드에서는 더 작게
          padding: isCompact ? '0.5rem' : undefined,
          position: 'relative',
          borderRadius: '50px'
        }}
        onMouseEnter={() => setNavHovered(true)}
        onMouseLeave={() => setNavHovered(false)}
      >
        {/* 애니메이션 배경 */}
        <div 
          style={{
            position: 'absolute',
            top: '4px',
            left: activeMenuStyle.left,
            width: activeMenuStyle.width,
            height: 'calc(100% - 8px)',
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.25), rgba(0, 212, 255, 0.15))',
            borderRadius: '50px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: activeMenuStyle.opacity,
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            zIndex: 1,
            pointerEvents: 'none',
            border: '1px solid rgba(0, 212, 255, 0.4)'
          }}
        />
        
        {MENU_ITEMS.map(item => {
          const isActive = state.currentPage === item.id;
          const isHovered = hoveredMenuItem === item.id;
          
          return (
            <button
              key={item.id}
              ref={el => menuRefs.current[item.id] = el}
              onClick={() => handleMenuClick(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ 
                position: 'relative',
                // 컴팩트 모드에서는 더 작게
                padding: isCompact ? '0.5rem 0.75rem' : undefined,
                fontSize: isCompact ? '0.8rem' : undefined,
                zIndex: 2,
                // 활성 메뉴일 때는 배경 제거 (애니메이션 배경이 대신함)
                background: 'transparent',
                // 활성 메뉴 색상 변경
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                transition: 'color 0.3s ease',
                fontWeight: isActive ? '600' : '400'
              }}
              onMouseEnter={() => setHoveredMenuItem(item.id)}
              onMouseLeave={() => setHoveredMenuItem(null)}
            >
              <i 
                className={menuIcons[item.id]}
                style={{
                  color: isActive ? '#00d4ff' : 'inherit',
                  textShadow: isActive ? '0 0 8px rgba(0, 212, 255, 0.6)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              ></i>
              <span style={{
                color: isActive ? '#ffffff' : 'inherit',
                textShadow: isActive ? '0 0 8px rgba(255, 255, 255, 0.3)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {item.label}
              </span>
              
              {/* 메뉴 아이템별 하단 라인 */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, var(--primary-color), var(--accent-color), var(--primary-color), transparent)',
                  opacity: isHovered ? 1 : (isActive ? 0.7 : 0),
                  boxShadow: isHovered ? '0 0 6px var(--primary-color)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </button>
          );
        })}
      </nav>

      {/* 상태 표시기 */}
      <div className="header-status">
        {/* 컴팩트 모드가 아닐 때만 시간과 네트워크 표시 */}
        {!isCompact && (
          <>
            {/* 1. 시간 (클릭 가능) */}
            <div 
              className="status-indicator"
              onClick={handleTimeClick}
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              <i className={showRealTime ? "fas fa-clock" : "fas fa-stopwatch"}></i>
              <span style={{
                fontVariantNumeric: 'tabular-nums',
                minWidth: '65px',
                display: 'inline-block',
                textAlign: 'center'
              }}>
                {showRealTime 
                  ? currentTime.toLocaleTimeString('ko-KR', { 
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })
                  : formatRuntime(runtime)
                }
              </span>

            </div>
            
            {/* 2. 네트워크 상태 */}
            <div className="status-indicator">
              <i className="fas fa-wifi"></i>
              <span>Network OK</span>
            </div>
          </>
        )}
        
        {/* 3. AMR 연결 상태 - 항상 표시 */}
        <div className={`status-indicator ${state.connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>
            {state.connectionStatus === 'connected' 
              ? `AMR : ${getConnectedAmrCount()}대`
              : 'Disconnected'
            }
          </span>
        </div>
      </div>

      {/* 하단 호버 라인 */}
      <div 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--primary-color), var(--accent-color), var(--primary-color), transparent)',
          opacity: isHovered ? 1 : 0.6,
          boxShadow: isHovered ? '0 0 8px var(--primary-color)' : 'none',
          transition: 'all 0.3s ease'
        }}
      />
    </header>
  );
};

export default Header; 
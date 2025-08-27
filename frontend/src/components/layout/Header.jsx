import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext.jsx';
import { useRobots } from '../../hooks/useRobots';
import { useSimulatedData } from '../../hooks/useSimulatedData';
import { MENU_ITEMS } from '../../constants';

// SVG 로고 컴포넌트
const LogoSvg = ({ fill = "currentColor", ...props }) => (
  <svg 
    version="1.1" 
    id="LogoLayer_1" 
    xmlns="http://www.w3.org/2000/svg" 
    xmlnsXlink="http://www.w3.org/1999/xlink" 
    x="0px" 
    y="0px" 
    width="199.169px" 
    height="29.52px" 
    viewBox="0 0 199.169 29.52" 
    enableBackground="new 0 0 199.169 29.52" 
    xmlSpace="preserve"
    {...props}
  >
    <g>
      <defs>
        <rect id="LogoSVGID_1_" width="199.169" height="29.52"></rect>
      </defs>
      <clipPath id="LogoSVGID_2_">
        <use xlinkHref="#LogoSVGID_1_" overflow="visible"></use>
      </clipPath>
      <path 
        clipPath="url(#LogoSVGID_2_)" 
        className="fill_2E3A8B" 
        fill={fill} 
        d="M64.1,18.993c-0.111,5.302-5.27,6.248-8.491,6.181
        c-8.355-0.176-8.462-6.434-8.461-6.79h4.508v0.079c-0.067,3.252,4.024,3.338,4.024,3.338c1.744,0.037,3.883-0.549,3.957-2.398
        c0.068-1.946-2.308-2.37-5.722-3.41c-1.33-0.396-5.97-1.306-5.876-5.784c0.126-6.021,7.641-5.864,7.641-5.864
        c7.623,0.16,7.96,5.461,7.957,6.043h-4.293v-0.075c0,0,0.052-2.488-3.734-2.567c0,0-3.062-0.063-3.109,2.194
        c-0.034,1.582,1.554,1.962,2.719,2.288C58.255,13.07,64.207,13.846,64.1,18.993 M74.379,4.777l-7.487,19.967h4.585l5.195-13.853
        l5.194,13.853h4.585L78.966,4.777H74.379z M26.709,21.789H2.201c3.093,4.605,9.131,7.731,16.073,7.731s12.98-3.127,16.074-7.731
        c0.595-0.887,1.08-1.827,1.442-2.812h-5.104C30.106,20.615,28.544,21.789,26.709,21.789 M9.84,7.731h24.507
        C31.254,3.126,25.216,0,18.274,0S5.294,3.126,2.201,7.731c-0.595,0.887-1.081,1.828-1.443,2.812h5.104
        C6.442,8.905,8.004,7.731,9.84,7.731 M0.187,12.652C0.064,13.34,0,14.044,0,14.76c0,0.716,0.063,1.42,0.186,2.108h36.176
        c0.122-0.688,0.186-1.393,0.186-2.108c0-0.716-0.064-1.42-0.186-2.108H0.187z M100.624,13.956l-4.59-9.179h-5.608v19.967h4.294
        V10.789l4.831,9.661h2.146l4.83-9.661v13.955h4.294V4.777h-5.608L100.624,13.956z M194.876,4.777v17.933l-5.604-17.933h-7.707
        v19.967h4.293V6.81l5.604,17.934h7.707V4.777H194.876z M172.333,16.585c0,2.371-1.923,4.294-4.294,4.294
        c-2.372,0-4.294-1.923-4.294-4.294V4.777h-4.294v11.808c0,4.743,3.845,8.588,8.588,8.588c4.742,0,8.587-3.845,8.587-8.588V4.777
        h-4.293V16.585z M129.177,12.828h-8.909V4.777h-4.294v19.967h4.294v-8.051h8.909v8.051h4.295V4.777h-4.295V12.828z M146.461,13.956
        l-4.589-9.179h-4.32l6.762,13.525v6.441h4.295v-6.441l6.763-13.525h-4.32L146.461,13.956z"
      ></path>
    </g>
  </svg>
);

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

  // 화면 크기 감지 (950px 이하에서 컴팩트 모드, 768px 이하에서 모바일)
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsCompact(window.innerWidth <= 950);
      setIsMobile(window.innerWidth <= 768);
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

  // 테마 토글 핸들러
  const handleThemeToggle = () => {
    const newTheme = state.ui.theme === 'dark' ? 'light' : 'dark';
    actions.updateUISetting('theme', newTheme);
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
    video: 'fas fa-video',
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
          <div className="logo-icon" style={{
            background: 'transparent',
            width: 'auto',
            height: 'auto',
            borderRadius: 0,
            boxShadow: 'none'
          }}>
          <LogoSvg 
            fill={state.ui.theme === 'dark' ? '#ffffff' : '#303A86'}
            style={{
              width: '120px',
              height: '40px',
              objectFit: 'contain',
              margin: '0 auto'
            }}
          />
          </div>
          <div>
            {/* <h1>ACS Control</h1>
            <div style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: 'var(--text-tertiary)',
              textTransform: 'none',
              letterSpacing: '0.02em'
            }}>
              Autonomous Control System
            </div> */}
          </div>
        </div>
      )}

      {/* 중앙 네비게이션 메뉴 */}
      <nav 
        ref={navContainerRef}
        className="header-navigation"
        style={{
          // 모바일에서는 모든 시각적 효과 제거
          border: isMobile ? 'none' : '1px solid var(--primary-color)',
          borderColor: isMobile ? 'transparent' : (navHovered ? 'var(--accent-color)' : 'var(--primary-color)'),
          boxShadow: isMobile ? 'none' : (navHovered 
            ? '0 0 20px var(--primary-color), 0 0 35px rgba(0, 212, 255, 0.2)' 
            : '0 0 15px var(--primary-color), 0 0 25px rgba(0, 212, 255, 0.15)'),
          transition: 'all 0.3s ease',
          // 컴팩트 모드에서는 더 작게
          padding: isCompact ? '0.5rem' : undefined,
          position: 'relative',
          borderRadius: isMobile ? '0' : '50px',
          background: isMobile ? 'transparent' : undefined
        }}
        onMouseEnter={() => !isMobile && setNavHovered(true)}
        onMouseLeave={() => !isMobile && setNavHovered(false)}
      >
        {/* 애니메이션 배경 - 모바일에서는 숨김 */}
        {!isMobile && (
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
        )}
        
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
                color: isActive ? (state.ui.theme === 'dark' ? '#ffffff' : '#2c3e50') : 'var(--text-secondary)',
                transition: 'color 0.3s ease',
                fontWeight: isActive ? '600' : '400'
              }}
              onMouseEnter={() => !isMobile && setHoveredMenuItem(item.id)}
              onMouseLeave={() => !isMobile && setHoveredMenuItem(null)}
            >
              <i 
                className={menuIcons[item.id]}
                style={{
                  color: isActive ? '#00d4ff' : 'inherit',
                  // 모바일에서는 텍스트 그림자 제거
                  textShadow: isMobile ? 'none' : (isActive ? '0 0 8px rgba(0, 212, 255, 0.6)' : 'none'),
                  transition: 'all 0.3s ease'
                }}
              ></i>
              <span style={{
                color: isActive ? (state.ui.theme === 'dark' ? '#ffffff' : '#2c3e50') : 'inherit',
                // 모바일에서는 텍스트 그림자 제거
                textShadow: isMobile ? 'none' : (isActive && state.ui.theme === 'dark' ? '0 0 8px rgba(255, 255, 255, 0.3)' : 'none'),
                transition: 'all 0.3s ease'
              }}>
                {item.label}
              </span>
              
              {/* 메뉴 아이템별 하단 라인 - 모바일에서는 숨김 */}
              {!isMobile && (
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
              )}
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

        {/* 4. 테마 토글 버튼 */}
        <div 
          className="status-indicator theme-toggle"
          onClick={handleThemeToggle}
          style={{
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            minWidth: 'auto'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          title={state.ui.theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          <i 
            className={state.ui.theme === 'dark' ? "fas fa-sun" : "fas fa-moon"}
            style={{
              fontSize: '1rem',
              color: state.ui.theme === 'dark' ? '#ffa500' : '#4169e1',
              transition: 'all 0.3s ease'
            }}
          ></i>
        </div>
      </div>

      {/* 하단 호버 라인 - 모바일에서는 숨김 */}
      {!isMobile && (
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
      )}
    </header>
  );
};

export default Header; 
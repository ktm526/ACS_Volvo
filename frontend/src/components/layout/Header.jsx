import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext.jsx';
import { MENU_ITEMS } from '../../constants';

const Header = () => {
  const { state, actions } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMenuClick = (menuId) => {
    actions.setCurrentPage(menuId);
  };

  // 메뉴 아이콘 매핑
  const menuIcons = {
    main: 'fas fa-home',
    map: 'fas fa-map',
    log: 'fas fa-list-alt',
    settings: 'fas fa-cog'
  };
  
  return (
    <header className="header">
      {/* 브랜드 섹션 */}
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

      {/* 중앙 네비게이션 메뉴 */}
      <nav className="header-navigation">
        {MENU_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item.id)}
            className={`nav-item ${state.currentPage === item.id ? 'active' : ''}`}
          >
            <i className={menuIcons[item.id]}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 상태 표시기 */}
      <div className="header-status">
        <div className={`status-indicator ${state.connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>{state.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        <div className="status-indicator">
          <i className="fas fa-clock"></i>
          <span>{currentTime.toLocaleTimeString('ko-KR', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
        
        <div className="status-indicator">
          <i className="fas fa-wifi"></i>
          <span>Network OK</span>
        </div>
      </div>
    </header>
  );
};

export default Header; 
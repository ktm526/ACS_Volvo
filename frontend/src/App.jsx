import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext.jsx';
import Header from './components/layout/Header';
import MainPage from './pages/MainPage';
import VideoPage from './pages/VideoPage';
import LogPage from './pages/LogPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

const AppContent = () => {
  const { state } = useAppContext();

  // 테마가 변경될 때마다 body에 클래스 적용
  useEffect(() => {
    document.body.className = state.ui.theme;
  }, [state.ui.theme]);

  const renderCurrentPage = () => {
    switch (state.currentPage) {
      case 'main':
        return <MainPage />;
      case 'video':
        return <VideoPage />;
      case 'log':
        return <LogPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <MainPage />;
    }
  };

  return (
    <div className={`app ${state.ui.theme}`}>
      {/* 헤더 (네비게이션 포함) */}
      <Header />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="content">
        {renderCurrentPage()}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;

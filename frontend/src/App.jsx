import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext.jsx';
import Header from './components/layout/Header';
import MainPage from './pages/MainPage';
import MapPage from './pages/MapPage';
import LogPage from './pages/LogPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

const AppContent = () => {
  const { state } = useAppContext();

  const renderCurrentPage = () => {
    switch (state.currentPage) {
      case 'main':
        return <MainPage />;
      case 'map':
        return <MapPage />;
      case 'log':
        return <LogPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <MainPage />;
    }
  };

  return (
    <div className="app">
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

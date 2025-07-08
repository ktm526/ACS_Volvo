import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext.jsx';

const SettingsPage = () => {
  const { state, actions } = useAppContext();
  const [localSettings, setLocalSettings] = useState({
    showTooltips: state.ui.showTooltips,
    theme: state.ui.theme,
    language: state.ui.language,
    autoRefresh: true,
    refreshInterval: 5,
    notifications: true,
    soundAlerts: false
  });

  const handleSettingChange = (setting, value) => {
    setLocalSettings(prev => ({ ...prev, [setting]: value }));
    if (['showTooltips', 'theme', 'language'].includes(setting)) {
      actions.updateUISetting(setting, value);
    }
  };

  const saveSettings = () => {
    // 실제 앱에서는 여기서 설정을 저장하는 API 호출
    actions.addNotification({
      type: 'success',
      message: '설정이 저장되었습니다.'
    });
  };

  const resetSettings = () => {
    const defaultSettings = {
      showTooltips: true,
      theme: 'dark',
      language: 'ko',
      autoRefresh: true,
      refreshInterval: 5,
      notifications: true,
      soundAlerts: false
    };
    setLocalSettings(defaultSettings);
    Object.keys(defaultSettings).forEach(key => {
      if (['showTooltips', 'theme', 'language'].includes(key)) {
        actions.updateUISetting(key, defaultSettings[key]);
      }
    });
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: 'var(--space-xl)',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Pretendard, sans-serif',
      overflow: 'auto'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'grid',
        gap: 'var(--space-xl)'
      }}>
        {/* 표시 설정 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-eye"></i>
              표시 설정
            </div>
          </div>
          
          <div className="card-content">
            {/* 툴팁 표시 */}
            <div className="card-row">
              <div>
                <div className="card-label" style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>툴팁 표시</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>로봇 호버 시 정보 툴팁을 표시합니다</div>
              </div>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <input
                  type="checkbox"
                  checked={localSettings.showTooltips}
                  onChange={(e) => handleSettingChange('showTooltips', e.target.checked)}
                  style={{ 
                    accentColor: 'var(--primary-color)',
                    transform: 'scale(1.2)'
                  }}
                />
                <span className="card-value">{localSettings.showTooltips ? '켜짐' : '꺼짐'}</span>
              </label>
            </div>

            {/* 테마 설정 */}
            <div className="card-row">
              <div>
                <div className="card-label" style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>테마</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>인터페이스 테마를 선택합니다</div>
              </div>
              <select
                value={localSettings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="dark">다크</option>
                <option value="light">라이트</option>
              </select>
            </div>

            {/* 언어 설정 */}
            <div className="card-row">
              <div>
                <div className="card-label" style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>언어</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>인터페이스 언어를 선택합니다</div>
              </div>
              <select
                value={localSettings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* 데이터 설정 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-database"></i>
              데이터 설정
            </div>
          </div>

          <div className="card-content">
            {/* 자동 새로고침 */}
            <div className="card-row">
              <div>
                <div className="card-label" style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>자동 새로고침</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>데이터를 자동으로 업데이트합니다</div>
              </div>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <input
                  type="checkbox"
                  checked={localSettings.autoRefresh}
                  onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                  style={{ 
                    accentColor: 'var(--primary-color)',
                    transform: 'scale(1.2)'
                  }}
                />
                <span className="card-value">{localSettings.autoRefresh ? '켜짐' : '꺼짐'}</span>
              </label>
            </div>

            {/* 새로고침 간격 */}
            <div className="card-row">
              <div>
                <div className="card-label" style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>새로고침 간격</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>데이터 업데이트 주기를 설정합니다</div>
              </div>
              <select
                value={localSettings.refreshInterval}
                onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                disabled={!localSettings.autoRefresh}
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: localSettings.autoRefresh ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: localSettings.autoRefresh ? 'var(--text-primary)' : 'var(--text-quaternary)',
                  fontSize: 'var(--font-size-sm)',
                  outline: 'none',
                  cursor: localSettings.autoRefresh ? 'pointer' : 'not-allowed'
                }}
              >
                <option value={1}>1초</option>
                <option value={5}>5초</option>
                <option value={10}>10초</option>
                <option value={30}>30초</option>
              </select>
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-bell"></i>
              알림 설정
            </div>
          </div>

          <div className="card-content">
            {/* 알림 활성화 */}
            <div className="card-row">
              <div>
                <div className="card-label" style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>알림</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>시스템 알림을 표시합니다</div>
              </div>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <input
                  type="checkbox"
                  checked={localSettings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  style={{ 
                    accentColor: 'var(--primary-color)',
                    transform: 'scale(1.2)'
                  }}
                />
                <span className="card-value">{localSettings.notifications ? '켜짐' : '꺼짐'}</span>
              </label>
            </div>

            {/* 소리 알림 */}
            <div className="card-row">
              <div>
                <div className="card-label" style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>소리 알림</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>오류 발생 시 소리로 알립니다</div>
              </div>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <input
                  type="checkbox"
                  checked={localSettings.soundAlerts}
                  onChange={(e) => handleSettingChange('soundAlerts', e.target.checked)}
                  disabled={!localSettings.notifications}
                  style={{ 
                    accentColor: 'var(--primary-color)',
                    transform: 'scale(1.2)',
                    opacity: localSettings.notifications ? 1 : 0.5
                  }}
                />
                <span className="card-value" style={{ opacity: localSettings.notifications ? 1 : 0.5 }}>
                  {localSettings.soundAlerts ? '켜짐' : '꺼짐'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          justifyContent: 'center'
        }}>
          <button 
            onClick={saveSettings}
            className="control-btn primary"
            style={{ minWidth: '120px' }}
          >
            <i className="fas fa-save"></i>
            설정 저장
          </button>
          <button 
            onClick={resetSettings}
            className="control-btn"
            style={{ minWidth: '120px' }}
          >
            <i className="fas fa-undo"></i>
            기본값으로 복원
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 
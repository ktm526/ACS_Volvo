import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext.jsx';
import RobotManagementSection from '../components/settings/RobotManagementSection.jsx';

const SettingsPage = () => {
  const { state, actions } = useAppContext();
  const [localSettings, setLocalSettings] = useState({
    // 맵 관리 관련 상태
    mapFile: null,
    mapFileName: '',
    selectedRobotMaps: {} // 로봇별 맵 목록 저장
  });

  const [serverMaps, setServerMaps] = useState([]);
  const [robots, setRobots] = useState([]);
  const [loading, setLoading] = useState({
    maps: false,
    robots: false
  });

  // API URL 설정
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // 서버에서 맵 목록 가져오기
  const fetchServerMaps = async () => {
    setLoading(prev => ({ ...prev, maps: true }));
    try {
      // 실제 API 호출
      const response = await fetch(`${API_URL}/api/maps`);
      if (response.ok) {
        const maps = await response.json();
        setServerMaps(maps);
      } else {
        // API 실패 시 임시 데이터 사용
        setServerMaps([
          { id: 'map001', name: '1층 작업공간', size: '2.3MB', lastModified: '2024-01-15' },
          { id: 'map002', name: '2층 작업공간', size: '1.8MB', lastModified: '2024-01-14' },
          { id: 'map003', name: '창고 A동', size: '3.1MB', lastModified: '2024-01-13' }
        ]);
      }
    } catch (error) {
      console.error('맵 목록 가져오기 실패:', error);
      // 에러 시 임시 데이터 사용
      setServerMaps([
        { id: 'map001', name: '1층 작업공간', size: '2.3MB', lastModified: '2024-01-15' },
        { id: 'map002', name: '2층 작업공간', size: '1.8MB', lastModified: '2024-01-14' },
        { id: 'map003', name: '창고 A동', size: '3.1MB', lastModified: '2024-01-13' }
      ]);
    } finally {
      setLoading(prev => ({ ...prev, maps: false }));
    }
  };

  // 로봇 목록 로드
  const loadRobots = async () => {
    try {
      setLoading(prev => ({ ...prev, robots: true }));
      const response = await fetch(`${API_URL}/api/robots`);
      const data = await response.json();
      
      if (response.ok) {
        setRobots(data.data || []);
        // AppContext에도 업데이트
        actions.setRobots(data.data || []);
      } else {
        actions.addNotification({
          type: 'error',
          message: '로봇 목록을 불러오는데 실패했습니다.'
        });
      }
    } catch (error) {
      console.error('로봇 목록 가져오기 실패:', error);
      actions.addNotification({
        type: 'error',
        message: '서버 연결에 실패했습니다.'
      });
    } finally {
      setLoading(prev => ({ ...prev, robots: false }));
    }
  };

  // 로봇 추가
  const handleAddRobot = async (robotData) => {
    try {
      const response = await fetch(`${API_URL}/api/robots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(robotData),
      });

      const data = await response.json();

      if (response.ok) {
        actions.addNotification({
          type: 'success',
          message: '로봇이 성공적으로 추가되었습니다.'
        });
        loadRobots(); // 목록 새로고침
      } else {
        actions.addNotification({
          type: 'error',
          message: data.error || '로봇 추가에 실패했습니다.'
        });
      }
    } catch (error) {
      actions.addNotification({
        type: 'error',
        message: '서버 연결에 실패했습니다.'
      });
    }
  };

  // 로봇 삭제
  const handleDeleteRobot = async (robotId) => {
    if (!confirm('정말로 이 로봇을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/robots/${robotId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        actions.addNotification({
          type: 'success',
          message: '로봇이 성공적으로 삭제되었습니다.'
        });
        loadRobots(); // 목록 새로고침
      } else {
        actions.addNotification({
          type: 'error',
          message: data.error || '로봇 삭제에 실패했습니다.'
        });
      }
    } catch (error) {
      actions.addNotification({
        type: 'error',
        message: '서버 연결에 실패했습니다.'
      });
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchServerMaps();
    loadRobots();
  }, []);

  const handleSettingChange = (setting, value) => {
    setLocalSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLocalSettings(prev => ({
        ...prev,
        mapFile: file,
        mapFileName: file.name
      }));
    }
  };

  const removeMapFile = () => {
    setLocalSettings(prev => ({
      ...prev,
      mapFile: null,
      mapFileName: ''
    }));
  };

  const handleViewRobotMaps = async (robotId) => {
    try {
      // 실제 API 호출로 해당 로봇의 맵 목록을 가져올 것
      const response = await fetch(`${API_URL}/api/robots/${robotId}/maps`);
      let robotMaps;
      
      if (response.ok) {
        robotMaps = await response.json();
      } else {
        // API 실패 시 임시 데이터 사용
        robotMaps = [
          { id: 'map001', name: '1층 작업공간', isActive: true },
          { id: 'map002', name: '2층 작업공간', isActive: false }
        ];
      }
      
      setLocalSettings(prev => ({
        ...prev,
        selectedRobotMaps: {
          ...prev.selectedRobotMaps,
          [robotId]: robotMaps
        }
      }));

      const robot = robots.find(r => r.id === robotId);
      actions.addNotification({
        type: 'info',
        message: `${robot?.name || '로봇'}의 맵 목록을 조회했습니다.`
      });
    } catch (error) {
      console.error('로봇 맵 목록 가져오기 실패:', error);
      actions.addNotification({
        type: 'error',
        message: '로봇 맵 목록을 가져오는데 실패했습니다.'
      });
    }
  };

  const saveSettings = () => {
    // 실제 앱에서는 여기서 설정을 저장하는 API 호출
    actions.addNotification({
      type: 'success',
      message: '맵 설정이 저장되었습니다.'
    });
  };

  const resetSettings = () => {
    const defaultSettings = {
      mapFile: null,
      mapFileName: '',
      selectedRobotMaps: {}
    };
    setLocalSettings(defaultSettings);
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
        {/* 맵 관리 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-map"></i>
              맵 관리
            </div>
          </div>
          
          <div className="card-content">
            {/* 서버 맵 리스트 */}
            <div className="card-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div className="card-label" style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>서버 맵 목록</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>서버에 저장된 맵 파일들입니다</div>
              </div>

              <div style={{
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                padding: 'var(--space-md)'
              }}>
                {loading.maps ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100px',
                    color: 'var(--text-tertiary)',
                    gap: 'var(--space-sm)'
                  }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: 'var(--font-size-xl)' }}></i>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>맵 목록을 불러오는 중...</div>
                  </div>
                ) : serverMaps.length > 0 ? (
                  <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                    {serverMaps.map((map) => (
                      <div
                        key={map.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-sm) var(--space-md)',
                          backgroundColor: 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-secondary)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <i className="fas fa-map" style={{ color: 'var(--primary-color)' }}></i>
                          <div>
                            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
                              {map.name}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                              {map.size} • 수정됨: {map.lastModified}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                          <button
                            className="control-btn"
                            style={{ 
                              fontSize: 'var(--font-size-xs)', 
                              padding: 'var(--space-xs) var(--space-sm)',
                              minWidth: 'unset'
                            }}
                          >
                            <i className="fas fa-download"></i>
                          </button>
                          <button
                            className="control-btn"
                            style={{ 
                              fontSize: 'var(--font-size-xs)', 
                              padding: 'var(--space-xs) var(--space-sm)',
                              minWidth: 'unset'
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100px',
                    color: 'var(--text-tertiary)',
                    gap: 'var(--space-sm)'
                  }}>
                    <i className="fas fa-map" style={{ fontSize: 'var(--font-size-xl)', opacity: 0.5 }}></i>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>저장된 맵이 없습니다</div>
                  </div>
                )}
              </div>
            </div>

            {/* 맵 파일 업로드 */}
            <div className="card-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div className="card-label" style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>맵 파일 업로드</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>새로운 맵 파일을 업로드합니다</div>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                <label style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '2px dashed var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                  minWidth: '200px'
                }}>
                  <i className="fas fa-upload"></i>
                  파일 선택
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.pdf"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                
                {localSettings.mapFileName && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-sm) var(--space-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    flex: 1
                  }}>
                    <i className="fas fa-file" style={{ color: 'var(--primary-color)' }}></i>
                    <span style={{ fontSize: 'var(--font-size-sm)', flex: 1 }}>
                      {localSettings.mapFileName}
                    </span>
                    <button
                      onClick={removeMapFile}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: 'var(--space-xs)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 로봇 리스트 */}
            <div className="card-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div className="card-label" style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>서버 로봇 목록</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>서버에 등록된 로봇 목록입니다</div>
              </div>

              <div style={{
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                minHeight: '200px',
                padding: 'var(--space-md)'
              }}>
                {loading.robots ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '150px',
                    color: 'var(--text-tertiary)',
                    gap: 'var(--space-sm)'
                  }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: 'var(--font-size-xl)' }}></i>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>로봇 목록을 불러오는 중...</div>
                  </div>
                ) : robots && robots.length > 0 ? (
                  <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                    {robots.map((robot) => (
                      <div key={robot.id}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--space-sm) var(--space-md)',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-secondary)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: robot.status === 'active' ? 'var(--success-color)' : 
                                               robot.status === 'error' ? 'var(--error-color)' : 
                                               'var(--warning-color)'
                              }}
                            />
                            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
                              {robot.name}
                            </span>
                            <span style={{ 
                              fontSize: 'var(--font-size-xs)', 
                              color: 'var(--text-tertiary)',
                              backgroundColor: 'var(--bg-quaternary)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-xs)'
                            }}>
                              {robot.type}
                            </span>
                          </div>
                          <button
                            onClick={() => handleViewRobotMaps(robot.id)}
                            className="control-btn"
                            style={{ 
                              fontSize: 'var(--font-size-xs)', 
                              padding: 'var(--space-xs) var(--space-sm)',
                              minWidth: 'unset'
                            }}
                          >
                            <i className="fas fa-map"></i>
                            맵 목록
                          </button>
                        </div>
                        
                        {/* 로봇의 맵 목록 (조회 시 표시) */}
                        {localSettings.selectedRobotMaps[robot.id] && (
                          <div style={{
                            marginTop: 'var(--space-sm)',
                            padding: 'var(--space-sm)',
                            backgroundColor: 'var(--bg-quaternary)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-tertiary)'
                          }}>
                            <div style={{ 
                              fontSize: 'var(--font-size-xs)', 
                              color: 'var(--text-tertiary)', 
                              marginBottom: 'var(--space-xs)',
                              fontWeight: '500'
                            }}>
                              {robot.name}의 맵 목록:
                            </div>
                            {localSettings.selectedRobotMaps[robot.id].map((map) => (
                              <div key={map.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--space-xs)',
                                fontSize: 'var(--font-size-xs)'
                              }}>
                                <span>{map.name}</span>
                                <span style={{ 
                                  color: map.isActive ? 'var(--success-color)' : 'var(--text-tertiary)',
                                  fontSize: 'var(--font-size-xs)'
                                }}>
                                  {map.isActive ? '활성' : '비활성'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '150px',
                    color: 'var(--text-tertiary)',
                    gap: 'var(--space-sm)'
                  }}>
                    <i className="fas fa-robot" style={{ fontSize: 'var(--font-size-xl)', opacity: 0.5 }}></i>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>등록된 로봇이 없습니다</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 로봇 관리 설정 */}
        <RobotManagementSection 
          robots={robots}
          loading={loading.robots}
          onLoadRobots={loadRobots}
          onAddRobot={handleAddRobot}
          onDeleteRobot={handleDeleteRobot}
        />

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
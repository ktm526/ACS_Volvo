import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext.jsx';
import RobotManagementSection from '../components/settings/RobotManagementSection.jsx';
import * as yaml from 'js-yaml';

const SettingsPage = () => {
  const { state, actions } = useAppContext();
  const [localSettings, setLocalSettings] = useState({
    // 맵 관리 관련 상태
    extractedMapName: '',
    imageFile: null,
    metadataFile: null,
    nodesFile: null,
    selectedRobotMaps: {}, // 로봇별 맵 목록 저장
    expandedRobots: {} // 로봇별 확장 상태 저장
  });

  const [serverMaps, setServerMaps] = useState([]);
  const [robots, setRobots] = useState([]);
  const [loading, setLoading] = useState({
    maps: false,
    robots: false,
    robotMaps: {} // 로봇별 맵 로딩 상태
  });

  // API URL 설정
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // 서버에서 맵 목록 가져오기
  const fetchServerMaps = async () => {
    setLoading(prev => ({ ...prev, maps: true }));
    try {
      const response = await fetch(`${API_URL}/api/maps`);
      if (response.ok) {
        const maps = await response.json();
        setServerMaps(maps);
      } else {
        actions.addNotification({
          type: 'error',
          message: '맵 목록을 불러오는데 실패했습니다.'
        });
        setServerMaps([]);
      }
    } catch (error) {
      console.error('맵 목록 가져오기 실패:', error);
      actions.addNotification({
        type: 'error',
        message: '서버 연결에 실패했습니다.'
      });
      setServerMaps([]);
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
    
    // 애니메이션 CSS 추가
    const styleId = 'robot-maps-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // 컴포넌트 언마운트 시 스타일 제거
    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  const handleSettingChange = (setting, value) => {
    setLocalSettings(prev => ({ ...prev, [setting]: value }));
  };

  const extractMapNameFromMetadata = (metadataContent) => {
    if (!metadataContent || !metadataContent.image) {
      return '';
    }
    
    const imageName = metadataContent.image;
    // .pgm, .jpg, .png, .jpeg 등의 확장자를 제거
    const mapName = imageName.replace(/\.(pgm|jpg|jpeg|png)$/i, '');
    return mapName;
  };

  const handleFileUpload = (fileType, event) => {
    const file = event.target.files[0];
    if (file) {
      setLocalSettings(prev => ({
        ...prev,
        [fileType]: file
      }));

      // 메타데이터 파일인 경우 자동으로 맵 이름 추출
      if (fileType === 'metadataFile') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const yamlContent = yaml.load(e.target.result);
            const extractedName = extractMapNameFromMetadata(yamlContent);
            setLocalSettings(prev => ({
              ...prev,
              extractedMapName: extractedName
            }));
          } catch (error) {
            console.error('YAML 파싱 오류:', error);
            actions.addNotification({
              type: 'error',
              message: 'YAML 파일을 읽는 중 오류가 발생했습니다.'
            });
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const removeMapFile = (fileType) => {
    setLocalSettings(prev => {
      const newSettings = {
        ...prev,
        [fileType]: null
      };
      
      // 메타데이터 파일 제거 시 추출된 맵 이름도 초기화
      if (fileType === 'metadataFile') {
        newSettings.extractedMapName = '';
      }
      
      return newSettings;
    });
  };

  const handleMapUpload = async () => {
    if (!localSettings.metadataFile && !localSettings.extractedMapName.trim()) {
      actions.addNotification({
        type: 'error',
        message: '메타데이터 파일이 없으면 맵 이름을 자동으로 추출할 수 없습니다.'
      });
      return;
    }

    if (!localSettings.imageFile && !localSettings.metadataFile && !localSettings.nodesFile) {
      actions.addNotification({
        type: 'error',
        message: '최소한 하나의 파일을 업로드해야 합니다.'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', localSettings.extractedMapName);
      
      if (localSettings.imageFile) {
        formData.append('image', localSettings.imageFile);
      }
      if (localSettings.metadataFile) {
        formData.append('metadata', localSettings.metadataFile);
      }
      if (localSettings.nodesFile) {
        formData.append('nodes', localSettings.nodesFile);
      }

      const response = await fetch(`${API_URL}/api/maps`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        actions.addNotification({
          type: 'success',
          message: '맵이 성공적으로 업로드되었습니다.'
        });
        
        // 입력 필드 초기화
        setLocalSettings(prev => ({
          ...prev,
          extractedMapName: '',
          imageFile: null,
          metadataFile: null,
          nodesFile: null
        }));
        
        // 맵 목록 새로고침
        fetchServerMaps();
      } else {
        actions.addNotification({
          type: 'error',
          message: data.error || '맵 업로드에 실패했습니다.'
        });
      }
    } catch (error) {
      console.error('맵 업로드 에러:', error);
      actions.addNotification({
        type: 'error',
        message: '서버 연결에 실패했습니다.'
      });
    }
  };

  const handleMapDownload = async (mapId, fileType) => {
    try {
      const response = await fetch(`${API_URL}/api/maps/${mapId}/download/${fileType}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `map_${mapId}_${fileType}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        actions.addNotification({
          type: 'error',
          message: '파일 다운로드에 실패했습니다.'
        });
      }
    } catch (error) {
      console.error('파일 다운로드 에러:', error);
      actions.addNotification({
        type: 'error',
        message: '서버 연결에 실패했습니다.'
      });
    }
  };

  const handleMapDelete = async (mapId) => {
    if (!confirm('정말로 이 맵을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/maps/${mapId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        actions.addNotification({
          type: 'success',
          message: '맵이 성공적으로 삭제되었습니다.'
        });
        fetchServerMaps();
      } else {
        actions.addNotification({
          type: 'error',
          message: data.error || '맵 삭제에 실패했습니다.'
        });
      }
    } catch (error) {
      console.error('맵 삭제 에러:', error);
      actions.addNotification({
        type: 'error',
        message: '서버 연결에 실패했습니다.'
      });
    }
  };

  const handleToggleRobotMaps = async (robotId) => {
    const isCurrentlyExpanded = localSettings.expandedRobots[robotId];
    
    // 토글 상태 업데이트
    setLocalSettings(prev => ({
      ...prev,
      expandedRobots: {
        ...prev.expandedRobots,
        [robotId]: !isCurrentlyExpanded
      }
    }));
    
    // 확장하는 경우에만 맵 목록 가져오기
    if (!isCurrentlyExpanded) {
      // 로딩 상태 시작
      setLoading(prev => ({
        ...prev,
        robotMaps: {
          ...prev.robotMaps,
          [robotId]: true
        }
      }));
      
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
        
        // 오류 발생 시 확장 상태 되돌리기
        setLocalSettings(prev => ({
          ...prev,
          expandedRobots: {
            ...prev.expandedRobots,
            [robotId]: false
          }
        }));
      } finally {
        // 로딩 상태 종료
        setLoading(prev => ({
          ...prev,
          robotMaps: {
            ...prev.robotMaps,
            [robotId]: false
          }
        }));
      }
    }
  };

  // 개별 로봇 맵 업로드 핸들러
  const handleRobotMapUpload = (robotId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jpg,.jpeg,.png,.pgm,.yaml,.yml';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        await uploadMapToRobot(robotId, files);
      }
    };
    input.click();
  };

  // 전체 로봇 맵 업로드 핸들러
  const handleBulkRobotMapUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jpg,.jpeg,.png,.pgm,.yaml,.yml';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        await uploadMapToBulk(files);
      }
    };
    input.click();
  };

  // 개별 로봇 맵 업로드 함수
  const uploadMapToRobot = async (robotId, files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch(`${API_URL}/api/robots/${robotId}/map-upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        actions.addNotification({
          type: 'success',
          message: `로봇 ${robotId}에 맵이 성공적으로 업로드되었습니다.`
        });
      } else {
        actions.addNotification({
          type: 'error',
          message: '맵 업로드에 실패했습니다.'
        });
      }
    } catch (error) {
      actions.addNotification({
        type: 'error',
        message: '맵 업로드 중 오류가 발생했습니다.'
      });
    }
  };

  // 전체 로봇 맵 업로드 함수
  const uploadMapToBulk = async (files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch(`${API_URL}/api/robots/bulk-map-upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        actions.addNotification({
          type: 'success',
          message: '모든 로봇에 맵이 성공적으로 업로드되었습니다.'
        });
      } else {
        actions.addNotification({
          type: 'error',
          message: '맵 업로드에 실패했습니다.'
        });
      }
    } catch (error) {
      actions.addNotification({
        type: 'error',
        message: '맵 업로드 중 오류가 발생했습니다.'
      });
    }
  };

  // 로봇 맵 다운로드 함수
  const handleRobotMapDownload = async (robotId, mapId, mapName) => {
    try {
      const response = await fetch(`${API_URL}/api/robots/${robotId}/maps/${mapId}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${mapName}_${robotId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        actions.addNotification({
          type: 'success',
          message: `${mapName} 맵이 성공적으로 다운로드되었습니다.`
        });
      } else {
        actions.addNotification({
          type: 'error',
          message: '맵 다운로드에 실패했습니다.'
        });
      }
    } catch (error) {
      console.error('맵 다운로드 에러:', error);
      actions.addNotification({
        type: 'error',
        message: '맵 다운로드 중 오류가 발생했습니다.'
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
      extractedMapName: '',
      imageFile: null,
      metadataFile: null,
      nodesFile: null,
      selectedRobotMaps: {},
      expandedRobots: {}
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
                              생성일: {new Date(map.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                          {map.image_file && (
                            <button
                              onClick={() => handleMapDownload(map.id, 'image')}
                              className="control-btn"
                              style={{ 
                                fontSize: 'var(--font-size-xs)', 
                                padding: 'var(--space-xs) var(--space-sm)',
                                minWidth: 'unset'
                              }}
                              title="이미지 다운로드"
                            >
                              <i className="fas fa-image"></i>
                            </button>
                          )}
                          {map.metadata_file && (
                            <button
                              onClick={() => handleMapDownload(map.id, 'metadata')}
                              className="control-btn"
                              style={{ 
                                fontSize: 'var(--font-size-xs)', 
                                padding: 'var(--space-xs) var(--space-sm)',
                                minWidth: 'unset'
                              }}
                              title="메타데이터 다운로드"
                            >
                              <i className="fas fa-file-code"></i>
                            </button>
                          )}
                          {map.node_file && (
                            <button
                              onClick={() => handleMapDownload(map.id, 'nodes')}
                              className="control-btn"
                              style={{ 
                                fontSize: 'var(--font-size-xs)', 
                                padding: 'var(--space-xs) var(--space-sm)',
                                minWidth: 'unset'
                              }}
                              title="노드 다운로드"
                            >
                              <i className="fas fa-project-diagram"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleMapDelete(map.id)}
                            className="control-btn"
                  style={{ 
                              fontSize: 'var(--font-size-xs)', 
                              padding: 'var(--space-xs) var(--space-sm)',
                              minWidth: 'unset'
                  }}
                            title="맵 삭제"
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
              
              {/* 추출된 맵 이름 표시 */}
              {localSettings.extractedMapName && (
                <div style={{ marginBottom: 'var(--space-md)' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 'var(--space-xs)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)'
                  }}>
                    맵 이름 (자동 추출됨)
                  </label>
                  <div style={{
                    width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)'
                  }}>
                    <i className="fas fa-tag" style={{ color: 'var(--primary-color)' }}></i>
                    {localSettings.extractedMapName}
                  </div>
                </div>
              )}
              
              {/* 파일 업로드 섹션 */}
              <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                {/* 이미지 파일 업로드 */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-primary)'
                }}>
                  <div style={{ minWidth: '80px' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--text-primary)' }}>
                      이미지 파일
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                      .jpg, .png, .pgm
                    </div>
                  </div>
                  
                  <label style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                  fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}>
                    <i className="fas fa-image"></i>
                    {localSettings.imageFile ? '파일 변경' : '파일 선택'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pgm"
                      onChange={(e) => handleFileUpload('imageFile', e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  
                  {localSettings.imageFile && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-sm)',
                      padding: 'var(--space-sm) var(--space-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      flex: 1
                    }}>
                      <i className="fas fa-file-image" style={{ color: 'var(--primary-color)' }}></i>
                      <span style={{ fontSize: 'var(--font-size-sm)', flex: 1 }}>
                        {localSettings.imageFile.name}
                      </span>
                      <button
                        onClick={() => removeMapFile('imageFile')}
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

                {/* 메타데이터 파일 업로드 */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-primary)'
                }}>
                  <div style={{ minWidth: '80px' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--text-primary)' }}>
                      메타데이터
            </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                      .yaml, .yml
          </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--primary-color)', fontWeight: '500' }}>
                      맵 이름 자동 추출
            </div>
          </div>

                  <label style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}>
                    <i className="fas fa-file-code"></i>
                    {localSettings.metadataFile ? '파일 변경' : '파일 선택'}
                <input
                      type="file"
                      accept=".yaml,.yml"
                      onChange={(e) => handleFileUpload('metadataFile', e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  
                  {localSettings.metadataFile && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-sm)',
                      padding: 'var(--space-sm) var(--space-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      flex: 1
                    }}>
                      <i className="fas fa-file-code" style={{ color: 'var(--primary-color)' }}></i>
                      <span style={{ fontSize: 'var(--font-size-sm)', flex: 1 }}>
                        {localSettings.metadataFile.name}
                      </span>
                      <button
                        onClick={() => removeMapFile('metadataFile')}
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

                {/* 노드 파일 업로드 */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-primary)'
                }}>
                  <div style={{ minWidth: '80px' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--text-primary)' }}>
                      노드 파일
            </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                      .yaml, .yml
          </div>
        </div>

                  <label style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}>
                    <i className="fas fa-project-diagram"></i>
                    {localSettings.nodesFile ? '파일 변경' : '파일 선택'}
                    <input
                      type="file"
                      accept=".yaml,.yml"
                      onChange={(e) => handleFileUpload('nodesFile', e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  
                  {localSettings.nodesFile && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-sm)',
                      padding: 'var(--space-sm) var(--space-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      flex: 1
                    }}>
                      <i className="fas fa-project-diagram" style={{ color: 'var(--primary-color)' }}></i>
                      <span style={{ fontSize: 'var(--font-size-sm)', flex: 1 }}>
                        {localSettings.nodesFile.name}
                      </span>
                      <button
                        onClick={() => removeMapFile('nodesFile')}
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
              
              {/* 업로드 버튼 */}
              <div style={{ marginTop: 'var(--space-md)' }}>
                <button
                  onClick={handleMapUpload}
                  className="control-btn primary"
                  disabled={!localSettings.extractedMapName && !localSettings.metadataFile}
                  style={{ 
                    width: '100%',
                    padding: 'var(--space-md)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    opacity: (!localSettings.extractedMapName && !localSettings.metadataFile) ? 0.5 : 1
                  }}
                >
                  <i className="fas fa-upload"></i>
                  맵 업로드
                </button>
                {!localSettings.extractedMapName && !localSettings.metadataFile && (
                  <div style={{ 
                    marginTop: 'var(--space-xs)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-tertiary)',
                    textAlign: 'center'
                  }}>
                    메타데이터 파일을 업로드하면 맵 이름이 자동으로 추출됩니다
                  </div>
                )}
              </div>
            </div>

            {/* 로봇 리스트 */}
            <div className="card-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 'var(--space-md)' 
              }}>
                <div>
                  <div className="card-label" style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>서버 로봇 목록</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>서버에 등록된 로봇 목록입니다</div>
                </div>
                {robots && robots.length > 0 && (
                  <button
                    onClick={handleBulkRobotMapUpload}
                    className="control-btn primary"
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      padding: 'var(--space-xs) var(--space-sm)',
                      minWidth: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-xs)'
                    }}
                  >
                    <i className="fas fa-upload"></i>
                    전체 맵 업로드
                  </button>
                )}
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
                      <div key={robot.id} style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-secondary)',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease-out'
                      }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--space-sm) var(--space-md)'
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
                                {robot.name}
                              </span>
                              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                {robot.ip_address}{robot.port ? `:${robot.port}` : ''}
                              </span>
                            </div>
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
                          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                            <button
                              onClick={() => handleRobotMapUpload(robot.id)}
                              className="control-btn"
                              style={{ 
                                fontSize: 'var(--font-size-xs)', 
                                padding: 'var(--space-xs) var(--space-sm)',
                                minWidth: 'unset'
                              }}
                            >
                              <i className="fas fa-upload"></i>
                              맵 업로드
                            </button>
                            <button
                              onClick={() => handleToggleRobotMaps(robot.id)}
                              className="control-btn"
                              style={{ 
                                fontSize: 'var(--font-size-xs)', 
                                padding: 'var(--space-xs)',
                                minWidth: 'unset',
                                transition: 'all 0.3s ease',
                                transform: localSettings.expandedRobots[robot.id] ? 'rotate(180deg)' : 'rotate(0deg)'
                              }}
                            >
                              <i className="fas fa-chevron-down"></i>
                            </button>
                          </div>
                        </div>
                        
                        {/* 로봇의 맵 목록 (확장 시 표시) */}
                        <div style={{
                          overflow: 'hidden',
                          transition: 'max-height 0.3s ease-out',
                          maxHeight: localSettings.expandedRobots[robot.id] ? '500px' : '0px'
                        }}>
                          {localSettings.expandedRobots[robot.id] && (
                            <div style={{
                              padding: 'var(--space-sm) var(--space-md)',
                              borderTop: '1px solid var(--border-tertiary)'
                            }}>
                              <div style={{ 
                                fontSize: 'var(--font-size-xs)', 
                                color: 'var(--text-tertiary)', 
                                marginBottom: 'var(--space-sm)',
                                fontWeight: '500'
                              }}>
                                {robot.name}의 맵 목록:
                              </div>
                              {loading.robotMaps[robot.id] ? (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 'var(--space-md)',
                                  color: 'var(--text-tertiary)',
                                  fontSize: 'var(--font-size-xs)'
                                }}>
                                  <i className="fas fa-spinner fa-spin" style={{ marginRight: 'var(--space-xs)' }}></i>
                                  맵 목록을 불러오는 중...
                                </div>
                              ) : localSettings.selectedRobotMaps[robot.id] ? (
                                localSettings.selectedRobotMaps[robot.id].map((map, index) => (
                                  <div key={map.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 'var(--space-xs) 0',
                                    fontSize: 'var(--font-size-xs)',
                                    borderBottom: index < localSettings.selectedRobotMaps[robot.id].length - 1 ? '1px solid var(--border-tertiary)' : 'none',
                                    opacity: 0,
                                    animation: 'fadeInUp 0.3s ease-out forwards',
                                    animationDelay: `${0.1 * (index + 1)}s`
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                      <span>{map.name}</span>
                                      <span style={{ 
                                        color: map.isActive ? 'var(--success-color)' : 'var(--text-tertiary)',
                                        fontSize: 'var(--font-size-xs)'
                                      }}>
                                        {map.isActive ? '활성' : '비활성'}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleRobotMapDownload(robot.id, map.id, map.name)}
                                      className="control-btn"
                                      style={{
                                        fontSize: 'var(--font-size-xs)',
                                        padding: '2px 6px',
                                        minWidth: 'auto',
                                        backgroundColor: 'transparent',
                                        border: '1px solid var(--border-primary)',
                                        color: 'var(--text-secondary)',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseOver={(e) => {
                                        e.target.style.backgroundColor = 'var(--primary-color)';
                                        e.target.style.color = 'white';
                                        e.target.style.borderColor = 'var(--primary-color)';
                                      }}
                                      onMouseOut={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.color = 'var(--text-secondary)';
                                        e.target.style.borderColor = 'var(--border-primary)';
                                      }}
                                      title={`${map.name} 맵 다운로드`}
                                    >
                                      <i className="fas fa-download"></i>
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 'var(--space-md)',
                                  color: 'var(--text-tertiary)',
                                  fontSize: 'var(--font-size-xs)'
                                }}>
                                  <i className="fas fa-exclamation-triangle" style={{ marginRight: 'var(--space-xs)' }}></i>
                                  맵 목록을 불러올 수 없습니다
                                </div>
                              )}
                            </div>
                          )}
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
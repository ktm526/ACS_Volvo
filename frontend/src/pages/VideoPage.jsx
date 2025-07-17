import React, { useState, useEffect } from 'react';

const VideoPage = () => {
  const [robots, setRobots] = useState([]);
  const [selectedRobot, setSelectedRobot] = useState('');
  const [selectedView, setSelectedView] = useState('all'); // 'all', 'front', 'back', 'left', 'right'
  const [loading, setLoading] = useState(true);

  // API URL 설정 (설정 페이지와 동일)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // 카메라 방향 정의 
  const cameras = [
    { id: 'front', label: '전방', icon: 'fas fa-arrow-up' },
    { id: 'back', label: '후방', icon: 'fas fa-arrow-down' },
    { id: 'left', label: '좌측', icon: 'fas fa-arrow-left' },
    { id: 'right', label: '우측', icon: 'fas fa-arrow-right' }
  ];

  // 뷰 옵션 정의
  const viewOptions = [
    { id: 'all', label: '전체', icon: 'fas fa-th-large' },
    { id: 'front', label: '앞', icon: 'fas fa-arrow-up' },
    { id: 'back', label: '뒤', icon: 'fas fa-arrow-down' },
    { id: 'left', label: '좌', icon: 'fas fa-arrow-left' },
    { id: 'right', label: '우', icon: 'fas fa-arrow-right' }
  ];

  // 로봇 목록 로드 (설정 페이지와 동일한 방식)
  const loadRobots = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/robots`);
      const data = await response.json();
      
      if (response.ok) {
        const robotsArray = data.data || [];
        setRobots(robotsArray);
        
        if (robotsArray.length > 0) {
          setSelectedRobot(robotsArray[0].id);
        }
      } else {
        console.error('로봇 목록 로드 실패:', data.error);
        // 더미 데이터 사용
        const dummyRobots = [
          { id: 'Robot-001', name: 'Robot 001', status: 'moving' },
          { id: 'Robot-002', name: 'Robot 002', status: 'idle' },
          { id: 'Robot-003', name: 'Robot 003', status: 'charging' },
          { id: 'Robot-004', name: 'Robot 004', status: 'working' },
          { id: 'Robot-005', name: 'Robot 005', status: 'error' }
        ];
        setRobots(dummyRobots);
        setSelectedRobot(dummyRobots[0].id);
      }
    } catch (error) {
      console.error('로봇 목록 가져오기 실패:', error);
      // 더미 데이터 사용
      const dummyRobots = [
        { id: 'Robot-001', name: 'Robot 001', status: 'moving' },
        { id: 'Robot-002', name: 'Robot 002', status: 'idle' },
        { id: 'Robot-003', name: 'Robot 003', status: 'charging' },
        { id: 'Robot-004', name: 'Robot 004', status: 'working' },
        { id: 'Robot-005', name: 'Robot 005', status: 'error' }
      ];
      setRobots(dummyRobots);
      setSelectedRobot(dummyRobots[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRobots();
  }, []);

  // 상태 색상 가져오기
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'moving': return '#3B82F6';
      case 'idle': return '#22C55E';
      case 'charging': return '#F59E0B';
      case 'working': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
          <div>로봇 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

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
      {/* 필터 및 컨트롤 섹션 */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fas fa-video"></i>
            영상 모니터링
          </div>
        </div>
        <div className="card-content">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-lg)'
          }}>
            {/* 로봇 선택 */}
            <div className="card-row" style={{ borderBottom: 'none' }}>
              <div className="card-value" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', borderBottom: 'none' }}>
                <select
                  value={selectedRobot}
                  onChange={(e) => setSelectedRobot(e.target.value)}
                  className="control-btn"
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    fontSize: 'var(--font-size-sm)',
                    minWidth: '120px',
                    border: 'none'
                  }}
                >
                  {Array.isArray(robots) && robots.map(robot => (
                    <option key={robot.id} value={robot.id}>
                      {robot.name || robot.id}
                    </option>
                  ))}
                </select>
                
                {/* 선택된 로봇 상태 표시 */}
                {selectedRobot && Array.isArray(robots) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'}}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(robots.find(r => r.id === selectedRobot)?.status)
                    }} />
                    
                  </div>
                )}
              </div>
            </div>

            {/* 뷰 선택 */}
            <div className="card-row">
              <div className="card-value">
                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                  {viewOptions.map(view => (
                    <button
                      key={view.id}
                      onClick={() => setSelectedView(view.id)}
                      className={`control-btn ${selectedView === view.id ? 'primary' : ''}`}
                      style={{
                        padding: 'var(--space-sm)',
                        fontSize: 'var(--font-size-sm)',
                        minWidth: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      title={view.label}
                    >
                      <i className={view.icon}></i>
                      <span style={{ fontSize: '10px' }}>{view.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 영상 표시 영역 */}
      <div className="card">
        <div className="card-header">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%'
          }}>
            {/* 좌측 제목 */}
            <div className="card-title" style={{ flex: '0 0 auto' }}>
              <i className="fas fa-camera"></i>
              {Array.isArray(robots) ? (robots.find(r => r.id === selectedRobot)?.name || selectedRobot) : selectedRobot} - 
              {selectedView === 'all' ? ' 전방향 카메라' : ` ${viewOptions.find(v => v.id === selectedView)?.label} 카메라`}
            </div>
            
            {/* 우측 카메라 상태 정보 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-lg)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              flex: '0 0 auto'
            }}>
              <div>활성 카메라: {selectedView === 'all' ? '4개 (전체)' : `1개 (${viewOptions.find(v => v.id === selectedView)?.label})`}</div>
              <div>녹화 상태: 비활성</div>
            </div>
          </div>
        </div>
        <div className="card-content">
          {/* 단일 영상 뷰어 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '540px',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--font-size-lg)',
            flexDirection: 'column',
            gap: 'var(--space-md)'
          }}>
            <i className="fas fa-video" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
            <div style={{ fontSize: 'var(--font-size-lg)' }}>
              {selectedView === 'all' ? '전방향' : viewOptions.find(v => v.id === selectedView)?.label} 카메라
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.7 }}>
              카메라 연결 대기중
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage; 
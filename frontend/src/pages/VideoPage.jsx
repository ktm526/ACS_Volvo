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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-xl)',
        padding: 'var(--space-lg)',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        {/* 로봇 선택 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <label style={{ 
            fontSize: 'var(--font-md)', 
            fontWeight: '600',
            minWidth: '60px'
          }}>
            로봇:
          </label>
          <select
            value={selectedRobot}
            onChange={(e) => setSelectedRobot(e.target.value)}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              fontSize: 'var(--font-sm)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              minWidth: '120px'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(robots.find(r => r.id === selectedRobot)?.status)
              }} />
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                {robots.find(r => r.id === selectedRobot)?.status || 'unknown'}
              </span>
            </div>
          )}
        </div>

        {/* 뷰 선택 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <label style={{ 
            fontSize: 'var(--font-md)', 
            fontWeight: '600',
            minWidth: '80px'
          }}>
            카메라 뷰:
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            {viewOptions.map(view => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id)}
                style={{
                  padding: 'var(--space-sm)',
                  fontSize: 'var(--font-sm)',
                  backgroundColor: selectedView === view.id ? 'var(--primary-color)' : 'var(--bg-primary)',
                  color: selectedView === view.id ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
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

      {/* 영상 표시 영역 */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: 'var(--space-lg)',
        minHeight: '600px'
      }}>
        {selectedView === 'all' ? (
          // 전체 뷰 - 2x2 그리드
          <div>
            <h3 style={{
              margin: '0 0 var(--space-lg) 0',
              fontSize: 'var(--font-lg)',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {Array.isArray(robots) ? (robots.find(r => r.id === selectedRobot)?.name || selectedRobot) : selectedRobot} - 전방향 카메라
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: 'var(--space-md)',
              height: '540px'
            }}>
              {cameras.map(camera => (
                <div key={camera.id} style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* 카메라 라벨 */}
                  <div style={{
                    position: 'absolute',
                    top: 'var(--space-sm)',
                    left: 'var(--space-sm)',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: 'var(--space-xs) var(--space-sm)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: '600',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)'
                  }}>
                    <i className={camera.icon}></i>
                    {camera.label}
                  </div>
                  
                  {/* 영상 없음 텍스트 */}
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--font-md)'
                  }}>
                    <i className="fas fa-video-slash" style={{ 
                      fontSize: '2rem', 
                      marginBottom: 'var(--space-sm)',
                      opacity: 0.5
                    }}></i>
                    <div>영상이 없습니다</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // 단일 뷰
          <div>
            <h3 style={{
              margin: '0 0 var(--space-lg) 0',
              fontSize: 'var(--font-lg)',
              fontWeight: '600',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)'
            }}>
              <i className={cameras.find(c => c.id === selectedView)?.icon}></i>
              {Array.isArray(robots) ? (robots.find(r => r.id === selectedRobot)?.name || selectedRobot) : selectedRobot} - {cameras.find(c => c.id === selectedView)?.label} 카메라
            </h3>
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              height: '540px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* 영상 없음 텍스트 */}
              <div style={{
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-lg)'
              }}>
                <i className="fas fa-video-slash" style={{ 
                  fontSize: '3rem', 
                  marginBottom: 'var(--space-md)',
                  opacity: 0.5
                }}></i>
                <div>영상이 없습니다</div>
                <div style={{ 
                  fontSize: 'var(--font-sm)', 
                  marginTop: 'var(--space-sm)',
                  opacity: 0.7 
                }}>
                  {cameras.find(c => c.id === selectedView)?.label} 카메라
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 추가 정보 표시 */}
      <div style={{
        marginTop: 'var(--space-lg)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--space-md)'
      }}>
        {/* 연결 상태 */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: 'var(--space-md)'
        }}>
          <h4 style={{ margin: '0 0 var(--space-sm) 0', fontSize: 'var(--font-md)', fontWeight: '600' }}>
            <i className="fas fa-wifi" style={{ marginRight: 'var(--space-xs)', color: '#EF4444' }}></i>
            연결 상태
          </h4>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            <div>영상 품질: 연결 안됨</div>
            <div>프레임율: 0 FPS</div>
            <div>지연 시간: -</div>
          </div>
        </div>

        {/* 로봇 정보 */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: 'var(--space-md)'
        }}>
          <h4 style={{ margin: '0 0 var(--space-sm) 0', fontSize: 'var(--font-md)', fontWeight: '600' }}>
            <i className="fas fa-robot" style={{ marginRight: 'var(--space-xs)', color: 'var(--primary-color)' }}></i>
            로봇 정보
          </h4>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            <div>ID: {selectedRobot}</div>
            <div>상태: {Array.isArray(robots) ? (robots.find(r => r.id === selectedRobot)?.status || 'unknown') : 'unknown'}</div>
            <div>배터리: 85%</div>
          </div>
        </div>

        {/* 카메라 정보 */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: 'var(--space-md)'
        }}>
          <h4 style={{ margin: '0 0 var(--space-sm) 0', fontSize: 'var(--font-md)', fontWeight: '600' }}>
            <i className="fas fa-video" style={{ marginRight: 'var(--space-xs)', color: '#F59E0B' }}></i>
            카메라 정보
          </h4>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            <div>활성 카메라: {selectedView === 'all' ? '4개 (전체)' : `1개 (${viewOptions.find(v => v.id === selectedView)?.label})`}</div>
            <div>녹화 상태: 비활성</div>
            <div>야간 모드: 자동</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage; 
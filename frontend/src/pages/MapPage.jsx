import React from 'react';
import { STATIONS, PATHS } from '../constants';
import { useRobots } from '../hooks/useRobots';

const MapPage = () => {
  const { robots } = useRobots();

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
      {/* 스테이션 정보 */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fas fa-charging-station"></i>
            스테이션 현황
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-md)'
        }}>
          {STATIONS.map(station => (
            <div key={station.id} className="card">
              <div className="card-header">
                <div className="card-title" style={{
                  color: station.type === 'charging' ? 'var(--status-success)' : 
                         station.type === 'loading' ? 'var(--status-warning)' : 'var(--status-info)'
                }}>
                  <i className={`fas fa-${station.type === 'charging' ? 'bolt' : station.type === 'loading' ? 'boxes' : 'pause'}`}></i>
                  {station.name}
                </div>
              </div>
              <div className="card-content">
                <div className="card-row">
                  <span className="card-label">타입</span>
                  <span className="card-value">
                    {station.type === 'charging' ? '충전소' : 
                     station.type === 'loading' ? '작업장' : '대기소'}
                  </span>
                </div>
                <div className="card-row">
                  <span className="card-label">위치</span>
                  <span className="card-value">({station.x}, {station.y})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 경로 정보 */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fas fa-route"></i>
            경로 정보
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-md)'
        }}>
          {PATHS.map(path => (
            <div key={path.id} className="card">
              <div className="card-header">
                <div className="card-title" style={{ color: path.color }}>
                  <i className="fas fa-map-marked-alt"></i>
                  경로 {path.id}
                </div>
                <div className="card-badge">
                  {path.type === 'current' ? '현재 경로' :
                   path.type === 'planned' ? '예약 경로' : '기본 경로'}
                </div>
              </div>
              <div className="card-content">
                <div className="card-row">
                  <span className="card-label">좌표점</span>
                  <span className="card-value">{path.points.length}개</span>
                </div>
                <div style={{ 
                  fontSize: 'var(--font-size-xs)', 
                  color: 'var(--text-tertiary)',
                  marginTop: 'var(--space-sm)',
                  wordBreak: 'break-all'
                }}>
                  {path.points.map((point, index) => (
                    <span key={index}>
                      ({point[0]}, {point[1]}){index < path.points.length - 1 ? ' → ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 로봇 위치 정보 */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fas fa-robot"></i>
            로봇 위치 현황
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-md)'
        }}>
          {robots.map(robot => (
            <div key={robot.id} className="card">
              <div className="card-header">
                <div className="card-title" style={{
                  color: robot.status === 'moving' ? 'var(--status-info)' :
                         robot.status === 'idle' ? 'var(--status-success)' :
                         robot.status === 'error' ? 'var(--status-error)' : 'var(--status-warning)'
                }}>
                  <i className="fas fa-robot"></i>
                  {robot.name}
                </div>
              </div>
              <div className="card-content">
                <div className="card-row">
                  <span className="card-label">상태</span>
                  <span className="card-value">
                    {robot.status === 'moving' ? '이동 중' :
                     robot.status === 'idle' ? '대기' :
                     robot.status === 'error' ? '오류' : '충전 중'}
                  </span>
                </div>
                <div className="card-row">
                  <span className="card-label">위치</span>
                  <span className="card-value">({robot.location_x}, {robot.location_y})</span>
                </div>
                <div className="card-row">
                  <span className="card-label">배터리</span>
                  <span className="card-value">
                    <div className="battery-indicator">
                      <div className="battery-bar">
                        <div 
                          className={`battery-fill ${robot.battery > 70 ? 'high' : robot.battery > 30 ? 'medium' : 'low'}`}
                          style={{ width: `${robot.battery}%` }}
                        ></div>
                      </div>
                      {robot.battery}%
                    </div>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapPage; 
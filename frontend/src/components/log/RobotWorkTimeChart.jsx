import React from 'react';

const RobotWorkTimeChart = ({ robotWorkTime, formatDuration }) => {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fas fa-robot"></i>
          로봇별 작업시간
        </div>
      </div>
      <div className="card-content">
        {Object.keys(robotWorkTime).length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            작업시간 데이터가 없습니다.
          </div>
        ) : (
          Object.entries(robotWorkTime)
            .sort(([,a], [,b]) => b - a)
            .map(([robotId, workTime]) => (
              <div key={robotId} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 'var(--space-sm) 0',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>{robotId}</span>
                <span style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  color: 'var(--primary-color)',
                  fontWeight: '600'
                }}>
                  {formatDuration(workTime)}
                </span>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default RobotWorkTimeChart; 
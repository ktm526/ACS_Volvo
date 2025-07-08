import React from 'react';

const RobotTaskCountChart = ({ robotTaskCount }) => {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fas fa-tasks"></i>
          로봇별 작업 건수
        </div>
      </div>
      <div className="card-content">
        {Object.keys(robotTaskCount).length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            작업 건수 데이터가 없습니다.
          </div>
        ) : (
          Object.entries(robotTaskCount)
            .sort(([,a], [,b]) => b - a)
            .map(([robotId, count]) => (
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
                  color: 'var(--accent-color)',
                  fontWeight: '600'
                }}>
                  {count}건
                </span>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default RobotTaskCountChart; 
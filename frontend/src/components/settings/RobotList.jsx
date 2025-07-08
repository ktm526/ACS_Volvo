import React from 'react';
import RobotItem from './RobotItem.jsx';

const RobotList = ({ robots, loading, onDelete, onRefresh }) => {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'var(--space-xl)',
        color: 'var(--text-secondary)'
      }}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: 'var(--space-sm)' }}></i>
        로봇 목록을 불러오는 중...
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-md)'
      }}>
        <h3 style={{
          margin: 0,
          color: 'var(--text-primary)',
          fontSize: 'var(--font-size-base)',
          fontWeight: 600
        }}>
          등록된 로봇 ({robots.length}개)
        </h3>
      </div>

      {robots.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-xl)',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)'
        }}>
          <i className="fas fa-robot" style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}></i>
          <p style={{ margin: 0 }}>등록된 로봇이 없습니다.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: 'var(--space-sm)'
        }}>
          {robots.map(robot => (
            <RobotItem
              key={robot.id}
              robot={robot}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RobotList; 
import React from 'react';

const RobotItem = ({ robot, onDelete }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'background-color 0.2s'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-lg)',
          alignItems: 'center'
        }}>
          {/* 로봇 이름 */}
          <div>
            <div style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-xs)'
            }}>
              <i className="fas fa-robot" style={{ marginRight: 'var(--space-xs)' }}></i>
              {robot.name}
            </div>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-tertiary)'
            }}>
              ID: {robot.id}
            </div>
          </div>

          {/* IP 주소 */}
          <div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)'
            }}>
              IP 주소
            </div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-primary)',
              fontWeight: 500
            }}>
              {robot.ip_address || 'N/A'}
            </div>
          </div>

          {/* 마지막 업데이트 */}
          <div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)'
            }}>
              마지막 업데이트
            </div>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-tertiary)'
            }}>
              {formatDate(robot.last_updated)}
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div style={{
        marginLeft: 'var(--space-md)',
        display: 'flex',
        gap: 'var(--space-sm)'
      }}>
        <button
          onClick={() => onDelete(robot.id)}
          className="control-btn"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-primary)',
            fontSize: 'var(--font-size-sm)',
            padding: 'var(--space-xs) var(--space-sm)',
            minWidth: 'auto',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#ef4444';
            e.target.style.color = 'white';
            e.target.style.borderColor = '#ef4444';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = 'var(--text-secondary)';
            e.target.style.borderColor = 'var(--border-primary)';
          }}
        >
          <i className="fas fa-trash"></i>
          삭제
        </button>
      </div>
    </div>
  );
};

export default RobotItem; 
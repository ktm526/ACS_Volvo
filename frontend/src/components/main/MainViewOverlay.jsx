import React from 'react';

const MainViewOverlay = ({ stats }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 'var(--space-lg)',
      right: 'var(--space-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)'
    }}>
      {/* 범례 */}
      <div style={{
        padding: 'var(--space-md)',
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(10px)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-primary)'
      }}>
        <h4 style={{
          margin: 0,
          marginBottom: 'var(--space-sm)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: '600',
          color: 'var(--text-primary)'
        }}>
          범례
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          {[
            { color: 'var(--status-success)', label: '작업 중', icon: 'fas fa-play' },
            { color: 'var(--status-warning)', label: '충전 중', icon: 'fas fa-bolt' },
            { color: 'var(--status-info)', label: '대기 중', icon: 'fas fa-pause' },
            { color: 'var(--status-error)', label: '오류', icon: 'fas fa-times' }
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              fontSize: 'var(--font-size-xs)'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className={item.icon} style={{ 
                  fontSize: '6px', 
                  color: 'white' 
                }}></i>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 시스템 메트릭스 */}
      <div style={{
        padding: 'var(--space-md)',
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(10px)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-primary)'
      }}>
        <h4 style={{
          margin: 0,
          marginBottom: 'var(--space-sm)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: '600',
          color: 'var(--text-primary)'
        }}>
          시스템 지표
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'var(--font-size-xs)'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>평균 배터리</span>
            <span style={{ 
              color: 'var(--text-primary)', 
              fontWeight: '600' 
            }}>
              {stats.averageBattery}%
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'var(--font-size-xs)'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>활성화율</span>
            <span style={{ 
              color: 'var(--text-primary)', 
              fontWeight: '600' 
            }}>
              {stats.total > 0 ? Math.round((stats.moving / stats.total) * 100) : 0}%
            </span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'var(--font-size-xs)'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>오류율</span>
            <span style={{ 
              color: stats.error > 0 ? 'var(--status-error)' : 'var(--status-success)', 
              fontWeight: '600' 
            }}>
              {stats.total > 0 ? Math.round((stats.error / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainViewOverlay; 
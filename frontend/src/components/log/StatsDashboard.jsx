import React from 'react';

const StatsDashboard = ({ stats, formatDuration }) => {
  const statCards = [
    {
      id: 'total',
      title: '총 로그',
      value: stats.totalLogs,
      icon: 'fas fa-list',
      color: 'var(--status-info)'
    },
    {
      id: 'success',
      title: '성공',
      value: stats.successCount,
      icon: 'fas fa-check-circle',
      color: 'var(--status-success)'
    },
    {
      id: 'error',
      title: '오류',
      value: stats.errorCount,
      icon: 'fas fa-times-circle',
      color: 'var(--status-error)'
    },
    {
      id: 'workTime',
      title: '총 작업시간',
      value: formatDuration(stats.totalWorkTime),
      icon: 'fas fa-clock',
      color: 'var(--primary-color)'
    }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(2, 1fr)', 
      gap: 'var(--space-md)' 
    }}>
      {statCards.map(card => (
        <div key={card.id} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ 
              padding: 'var(--space-md)', 
              backgroundColor: `${card.color}20`, 
              borderRadius: 'var(--radius-lg)',
              color: card.color
            }}>
              <i className={card.icon} style={{ fontSize: 'var(--font-size-xl)' }}></i>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>
                {card.value}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                {card.title}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsDashboard; 
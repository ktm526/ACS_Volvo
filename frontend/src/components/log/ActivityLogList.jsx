import React from 'react';

const ActivityLogList = ({ 
  filteredLogs, 
  expandedLogs, 
  onToggleExpansion,
  getLevelColor,
  getLevelIcon,
  formatDuration
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fas fa-list-alt"></i>
          활동 로그 ({filteredLogs.length})
        </div>
      </div>
      <div className="card-content">
        <div style={{
          maxHeight: '600px',
          overflowY: 'auto',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)'
        }}>
          {filteredLogs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--font-size-lg)',
              padding: 'var(--space-2xl)'
            }}>
              필터 조건에 맞는 로그가 없습니다.
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const isExpanded = expandedLogs.has(log.id);
              return (
                <div key={log.id}>
                  {/* 메인 로그 행 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--space-md) var(--space-lg)',
                      borderBottom: index < filteredLogs.length - 1 ? '1px solid var(--border-primary)' : 'none',
                      backgroundColor: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                      cursor: log.details ? 'pointer' : 'default',
                      transition: 'background-color 0.2s ease',
                      minHeight: '60px'
                    }}
                    onClick={() => log.details && onToggleExpansion(log.id)}
                    onMouseEnter={(e) => {
                      if (log.details) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)';
                    }}
                  >
                    {/* 시간 */}
                    <div style={{
                      width: '80px',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-tertiary)',
                      fontFamily: '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
                      flexShrink: 0
                    }}>
                      {log.timestamp.toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>

                    {/* 레벨 */}
                    <div style={{
                      width: '70px',
                      flexShrink: 0,
                      marginRight: 'var(--space-md)'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: 'var(--space-xs) var(--space-sm)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        backgroundColor: getLevelColor(log.level),
                        color: 'white',
                        minWidth: '50px',
                        textAlign: 'center'
                      }}>
                        {log.level === 'success' ? '성공' :
                         log.level === 'error' ? '오류' :
                         log.level === 'warning' ? '경고' : '정보'}
                      </span>
                    </div>

                    {/* 로봇 */}
                    <div style={{
                      width: '100px',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--primary-color)',
                      fontWeight: '600',
                      flexShrink: 0,
                      marginRight: 'var(--space-md)'
                    }}>
                      {log.robotId}
                    </div>

                    {/* 카테고리 */}
                    <div style={{
                      width: '80px',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      fontWeight: '500',
                      flexShrink: 0,
                      marginRight: 'var(--space-md)'
                    }}>
                      {log.category === 'mission' ? '임무' :
                       log.category === 'robot' ? '로봇' :
                       log.category === 'system' ? '시스템' : '네비게이션'}
                    </div>

                    {/* 메시지 */}
                    <div style={{
                      flex: 1,
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-primary)',
                      lineHeight: '1.4',
                      paddingRight: 'var(--space-md)'
                    }}>
                      {log.message}
                    </div>

                    {/* 소요시간 */}
                    <div style={{
                      width: '80px',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)',
                      textAlign: 'right',
                      flexShrink: 0,
                      marginRight: 'var(--space-md)'
                    }}>
                      {log.duration ? formatDuration(log.duration) : '-'}
                    </div>

                    {/* 확장 표시 */}
                    {log.details && (
                      <div style={{
                        width: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 0
                      }}>
                        <i 
                          className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-tertiary)',
                            transition: 'transform 0.2s ease'
                          }}
                        ></i>
                      </div>
                    )}
                  </div>

                  {/* 확장 상세 정보 */}
                  {log.details && isExpanded && (
                    <div style={{
                      padding: 'var(--space-md) var(--space-lg)',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderBottom: index < filteredLogs.length - 1 ? '1px solid var(--border-primary)' : 'none',
                      borderLeft: `4px solid ${getLevelColor(log.level)}`
                    }}>
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--space-xs)',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        상세 정보
                      </div>
                      <div style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-primary)',
                        lineHeight: '1.5',
                        marginLeft: 'var(--space-lg)'
                      }}>
                        {log.details}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogList; 
import React from 'react';
import { getStatusColor } from '../../constants';
import { getRobotStatusIcon } from '../../utils/mainPageUtils';

const RobotDetailModal = ({ robot, isOpen, onClose }) => {
  if (!isOpen || !robot) return null;

  const statusColor = getStatusColor(robot.status, 'robot');
  const position = {
    x: robot.location_x !== undefined ? robot.location_x : 0,
    y: robot.location_y !== undefined ? robot.location_y : 0
  };
  const battery = robot.battery || 0;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)'
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border-primary)'
        }}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-primary)',
          paddingBottom: 'var(--space-md)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${statusColor}, ${statusColor}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bg-primary)',
              fontSize: '20px',
              fontWeight: '600',
              boxShadow: `0 0 20px ${statusColor}50`
            }}>
              <i className={getRobotStatusIcon(robot.status)}></i>
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: 'var(--font-size-xl)',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {robot.name}
              </h2>
              <p style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-tertiary)'
              }}>
                ID: {robot.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
              e.target.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 기본 정보 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)'
        }}>
          {/* 상태 */}
          <div style={{
            padding: 'var(--space-md)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-primary)'
          }}>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)'
            }}>
              상태
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <div style={{
                padding: '4px 8px',
                background: `linear-gradient(135deg, ${statusColor}20, ${statusColor}10)`,
                borderRadius: '6px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: statusColor,
                textTransform: 'uppercase',
                border: `1px solid ${statusColor}40`
              }}>
                {robot.status}
              </div>
            </div>
          </div>

          {/* 배터리 */}
          <div style={{
            padding: 'var(--space-md)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-primary)'
          }}>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)'
            }}>
              배터리
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <div style={{
                flex: 1,
                height: '6px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${battery}%`,
                  backgroundColor: battery > 30 ? 'var(--status-success)' : 
                                   battery > 15 ? 'var(--status-warning)' : 'var(--status-error)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                {battery}%
              </span>
            </div>
          </div>
        </div>

        {/* 위치 정보 */}
        <div style={{
          padding: 'var(--space-md)',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-primary)',
          marginBottom: 'var(--space-lg)'
        }}>
          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-md)'
          }}>
            위치 정보
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-md)'
          }}>
            <div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-xs)'
              }}>
                X 좌표
              </div>
              <div style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: '600',
                color: 'var(--text-primary)',
                fontFamily: '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace'
              }}>
                {position.x.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-xs)'
              }}>
                Y 좌표
              </div>
              <div style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: '600',
                color: 'var(--text-primary)',
                fontFamily: '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace'
              }}>
                {position.y.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div style={{
          display: 'grid',
          gap: 'var(--space-md)'
        }}>
          {/* 스테이션 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-sm) 0',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              fontWeight: '600'
            }}>
              스테이션
            </span>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}>
              {robot.station || 'N/A'}
            </span>
          </div>

          {/* 현재 작업 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-sm) 0',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              fontWeight: '600'
            }}>
              현재 작업
            </span>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}>
              {robot.currentTask || '없음'}
            </span>
          </div>

          {/* IP 주소 */}
          {robot.ip_address && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-sm) 0',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
                fontWeight: '600'
              }}>
                IP 주소
              </span>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontFamily: '"Pretendard Variable", "Pretendard", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace'
              }}>
                {robot.ip_address}
              </span>
            </div>
          )}

          {/* 마지막 업데이트 */}
          {robot.last_updated && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-sm) 0'
            }}>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
                fontWeight: '600'
              }}>
                마지막 업데이트
              </span>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-primary)',
                fontWeight: '600'
              }}>
                {formatDate(robot.last_updated)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RobotDetailModal; 
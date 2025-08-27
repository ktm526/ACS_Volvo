import React from 'react';
import { STATION_TYPES } from '../../constants';

// 대기 스텝 폼 컴포넌트
const WaitStepForm = ({ onAddStep }) => {
  const [waitConditionType, setWaitConditionType] = React.useState('time'); // 'time' 또는 'input'
  const [waitTime, setWaitTime] = React.useState('');
  const [inputEventType, setInputEventType] = React.useState('button'); // 'button', 'sensor', 'signal'
  const [inputDescription, setInputDescription] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (waitConditionType === 'time') {
      const timeInSeconds = parseInt(waitTime);
      if (timeInSeconds > 0) {
        onAddStep({
          conditionType: 'time',
          waitTime: timeInSeconds
        });
        setWaitTime('');
      }
    } else if (waitConditionType === 'input') {
      onAddStep({
        conditionType: 'input',
        inputEventType: inputEventType,
        inputDescription: inputDescription.trim() || null
      });
      setInputDescription('');
    }
  };

  const isFormValid = () => {
    if (waitConditionType === 'time') {
      return waitTime && parseInt(waitTime) > 0;
    } else {
      return true; // 외부 입력은 이벤트 타입만 있으면 유효
    }
  };

  return (
    <div>
      <p style={{
        margin: '0 0 var(--space-md) 0',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)'
      }}>
        대기 해제 조건을 설정하세요
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* 대기 조건 타입 선택 */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--space-sm)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            대기 조건
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={() => setWaitConditionType('time')}
              style={{
                flex: 1,
                padding: 'var(--space-sm)',
                backgroundColor: waitConditionType === 'time' ? '#F59E0B' : 'var(--bg-tertiary)',
                border: `1px solid ${waitConditionType === 'time' ? '#F59E0B' : 'var(--border-primary)'}`,
                borderRadius: 'var(--radius-md)',
                color: waitConditionType === 'time' ? 'white' : 'var(--text-primary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
              <i className="fas fa-clock"></i> 시간 제한
            </button>
            <button
              type="button"
              onClick={() => setWaitConditionType('input')}
              style={{
                flex: 1,
                padding: 'var(--space-sm)',
                backgroundColor: waitConditionType === 'input' ? '#F59E0B' : 'var(--bg-tertiary)',
                border: `1px solid ${waitConditionType === 'input' ? '#F59E0B' : 'var(--border-primary)'}`,
                borderRadius: 'var(--radius-md)',
                color: waitConditionType === 'input' ? 'white' : 'var(--text-primary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
              <i className="fas fa-hand-pointer"></i> 외부 입력
            </button>
          </div>
        </div>

        {/* 시간 제한 조건 */}
        {waitConditionType === 'time' && (
          <div>
            <label style={{
              display: 'block',
              marginBottom: 'var(--space-sm)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              대기 시간 (초)
            </label>
            <input
              type="number"
              min="1"
              value={waitTime}
              onChange={(e) => setWaitTime(e.target.value)}
              placeholder="예: 30"
              style={{
                width: '100%',
                padding: 'var(--space-md)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)'
              }}
              required
            />
          </div>
        )}

        {/* 외부 입력 조건 */}
        {waitConditionType === 'input' && (
          <>
            <div>
              <label style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                입력 이벤트 타입
              </label>
              <select
                value={inputEventType}
                onChange={(e) => setInputEventType(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                <option value="button">버튼 입력</option>
                <option value="sensor">센서 입력</option>
                <option value="signal">신호 입력</option>
                <option value="manual">수동 승인</option>
              </select>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                입력 조건 설명 <span style={{ color: 'var(--text-tertiary)', fontWeight: '400' }}>(선택사항)</span>
              </label>
              <textarea
                value={inputDescription}
                onChange={(e) => setInputDescription(e.target.value)}
                placeholder="예: 작업자 확인 버튼 입력, 물체 감지 센서 트리거, 시작 신호 수신 등"
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  resize: 'vertical'
                }}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={!isFormValid()}
          style={{
            padding: 'var(--space-md)',
            backgroundColor: isFormValid() ? '#F59E0B' : 'var(--bg-primary)',
            border: `1px solid ${isFormValid() ? '#F59E0B' : 'var(--border-primary)'}`,
            borderRadius: 'var(--radius-md)',
            color: isFormValid() ? 'white' : 'var(--text-tertiary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            cursor: isFormValid() ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          <i className="fas fa-plus"></i>
          대기 스텝 추가
        </button>
      </form>
    </div>
  );
};

// 작업 스텝 폼 컴포넌트
const WorkStepForm = ({ onAddStep }) => {
  const [workDescription, setWorkDescription] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (workDescription.trim()) {
      onAddStep(workDescription.trim());
      setWorkDescription('');
    }
  };

  return (
    <div>
      <p style={{
        margin: '0 0 var(--space-md) 0',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)'
      }}>
        수행할 작업 내용을 입력하세요
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--space-sm)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            작업 내용
          </label>
          <textarea
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            placeholder="예: 박스 픽업, 물품 검사, 센서 점검 등"
            style={{
              width: '100%',
              minHeight: '80px',
              padding: 'var(--space-md)',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-sm)',
              resize: 'vertical'
            }}
            required
          />
        </div>
        <button
          type="submit"
          disabled={!workDescription.trim()}
          style={{
            padding: 'var(--space-md)',
            backgroundColor: workDescription.trim() ? '#10B981' : 'var(--bg-primary)',
            border: `1px solid ${workDescription.trim() ? '#10B981' : 'var(--border-primary)'}`,
            borderRadius: 'var(--radius-md)',
            color: workDescription.trim() ? 'white' : 'var(--text-tertiary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            cursor: workDescription.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          <i className="fas fa-plus"></i>
          작업 스텝 추가
        </button>
      </form>
    </div>
  );
};

const StepInputSection = ({ 
  currentStepType, 
  stations = [], 
  addWaypoint, 
  addWaitStep, 
  addWorkStep 
}) => {
  // 스테이션 타입별 아이콘
  const getStationIcon = (type) => {
    switch (type) {
      case STATION_TYPES.CHARGING: return 'fas fa-bolt';
      case STATION_TYPES.LOADING: return 'fas fa-boxes';
      case STATION_TYPES.WAITING: return 'fas fa-pause';
      default: return 'fas fa-map-marker-alt';
    }
  };

  // 스테이션 타입별 색상
  const getStationColor = (type) => {
    switch (type) {
      case STATION_TYPES.CHARGING: return 'var(--status-success)';
      case STATION_TYPES.LOADING: return 'var(--status-warning)';
      case STATION_TYPES.WAITING: return 'var(--status-info)';
      default: return 'var(--text-secondary)';
    }
  };

  // 스텝 타입별 아이콘
  const getStepTypeIcon = (stepType) => {
    switch (stepType) {
      case 'move': return 'fas fa-route';
      case 'wait': return 'fas fa-clock';
      case 'work': return 'fas fa-tools';
      default: return 'fas fa-circle';
    }
  };

  // 스텝 타입별 색상
  const getStepTypeColor = (stepType) => {
    switch (stepType) {
      case 'move': return '#3B82F6';
      case 'wait': return '#F59E0B';
      case 'work': return '#10B981';
      default: return 'var(--text-secondary)';
    }
  };

  // 스텝 타입별 한국어 이름
  const getStepTypeName = (stepType) => {
    switch (stepType) {
      case 'move': return '이동';
      case 'wait': return '대기';
      case 'work': return '작업';
      default: return stepType;
    }
  };

  return (
    <div style={{
      width: '350px',
      padding: 'var(--space-lg)',
      borderRight: '1px solid var(--border-primary)',
      overflow: 'auto'
    }}>
      <h3 style={{
        margin: '0 0 var(--space-lg) 0',
        fontSize: 'var(--font-size-lg)',
        fontWeight: '700',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)'
      }}>
        <i className={getStepTypeIcon(currentStepType)} style={{ color: getStepTypeColor(currentStepType) }}></i>
        {getStepTypeName(currentStepType)} 스텝 추가
      </h3>
      
      {/* 이동 스텝 - 지도 노드 목록 */}
      {currentStepType === 'move' && (
        <>
          {stations.length === 0 ? (
            <div style={{
              padding: 'var(--space-xl)',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--font-size-sm)'
            }}>
              <i className="fas fa-map" style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}></i>
              <p>지도 데이터를 불러올 수 없습니다.<br />지도를 선택해주세요.</p>
            </div>
          ) : (
            <>
              <p style={{
                margin: '0 0 var(--space-md) 0',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)'
              }}>
                목적지 노드를 선택하세요 ({stations.length}개 노드)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {stations.map((station) => (
                  <div
                    key={station.id}
                    onClick={() => addWaypoint(station)}
                    style={{
                      padding: 'var(--space-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--bg-card)';
                      e.target.style.borderColor = getStationColor(station.type);
                      e.target.style.boxShadow = `0 0 20px ${getStationColor(station.type)}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'var(--bg-tertiary)';
                      e.target.style.borderColor = 'var(--border-primary)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: getStationColor(station.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      <i className={getStationIcon(station.type)}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '2px'
                      }}>
                        {station.name}
                      </div>
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)'
                      }}>
                        ({station.x.toFixed(2)}, {station.y.toFixed(2)}) • 노드 #{station.node_index} • {station.type === 'charging' ? '충전' : station.type === 'loading' ? '작업' : '대기'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)'
                    }}>
                      <i className="fas fa-plus"></i>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* 대기 스텝 - 시간 입력 */}
      {currentStepType === 'wait' && (
        <WaitStepForm onAddStep={addWaitStep} />
      )}

      {/* 작업 스텝 - 텍스트 입력 */}
      {currentStepType === 'work' && (
        <WorkStepForm onAddStep={addWorkStep} />
      )}
    </div>
  );
};

export default StepInputSection;


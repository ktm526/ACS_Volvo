import React from 'react';

const TaskFormSection = ({ 
  formData, 
  setFormData, 
  currentStepType, 
  setCurrentStepType,
  robots = [],
  error
}) => {
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

  // 우선순위 색상
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef476f';
      case 'medium': return '#ffd166';
      case 'low': return '#06d6a0';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{
      width: '350px',
      padding: 'var(--space-lg)',
      borderRight: '1px solid var(--border-primary)',
      backgroundColor: 'var(--bg-secondary)',
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {/* 태스크 이름 */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--space-sm)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            태스크 이름 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="태스크 이름을 입력하세요"
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

        {/* 스텝 타입 선택 */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--space-sm)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            추가할 스텝 타입
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {['move', 'wait', 'work'].map((stepType) => (
              <button
                key={stepType}
                type="button"
                onClick={() => setCurrentStepType(stepType)}
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: currentStepType === stepType ? getStepTypeColor(stepType) : 'var(--bg-tertiary)',
                  border: `1px solid ${currentStepType === stepType ? getStepTypeColor(stepType) : 'var(--border-primary)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: currentStepType === stepType ? 'white' : 'var(--text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                <i className={getStepTypeIcon(stepType)} style={{ width: '16px' }}></i>
                {getStepTypeName(stepType)}
              </button>
            ))}
          </div>
        </div>

        {/* 우선순위 */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--space-sm)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            우선순위
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            {['high', 'medium', 'low'].map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => setFormData({ ...formData, priority })}
                style={{
                  flex: 1,
                  padding: 'var(--space-sm)',
                  backgroundColor: formData.priority === priority ? getPriorityColor(priority) : 'var(--bg-tertiary)',
                  border: `1px solid ${formData.priority === priority ? getPriorityColor(priority) : 'var(--border-primary)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: formData.priority === priority ? 'white' : 'var(--text-primary)',
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
                {priority === 'high' ? '높음' : priority === 'medium' ? '보통' : '낮음'}
              </button>
            ))}
          </div>
        </div>

        {/* AMR 선택 */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--space-sm)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            AMR 할당
          </label>
          <select
            value={formData.robotId || ''}
            onChange={(e) => setFormData({ ...formData, robotId: e.target.value || null })}
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
            <option value="">자동 할당</option>
            {robots.map((robot) => (
              <option key={robot.id} value={robot.id}>
                {robot.name} ({robot.status})
              </option>
            ))}
          </select>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            padding: 'var(--space-md)',
            backgroundColor: 'rgba(239, 71, 111, 0.1)',
            border: '1px solid rgba(239, 71, 111, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#ef476f',
            fontSize: 'var(--font-size-sm)'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskFormSection;


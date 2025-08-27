import React, { useState } from 'react';
import { savePreset, getPresets, loadPreset, deletePreset } from '../../utils/presetUtils';

const StepListSection = ({ 
  waypoints, 
  moveWaypoint, 
  removeWaypoint, 
  animatingItems, 
  highlightedItem, 
  tempPositions,
  setWaypoints
}) => {
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [presets, setPresets] = useState(getPresets());

  // 프리셋 저장
  const handleSavePreset = () => {
    if (waypoints.length === 0) {
      alert('저장할 스텝이 없습니다.');
      return;
    }
    
    const presetName = prompt('프리셋 이름을 입력하세요:', `프리셋 ${new Date().toLocaleString()}`);
    if (presetName && presetName.trim()) {
      const trimmedName = presetName.trim();
      
      // 중복 이름 체크
      const existingPresets = getPresets();
      const isDuplicate = existingPresets.some(p => p.name === trimmedName);
      
      if (isDuplicate) {
        if (!confirm(`'${trimmedName}' 이름의 프리셋이 이미 존재합니다. 덮어쓰시겠습니까?`)) {
          return;
        }
        // 기존 프리셋 삭제
        const existingPreset = existingPresets.find(p => p.name === trimmedName);
        if (existingPreset) {
          deletePreset(existingPreset.id);
        }
      }
      
      const result = savePreset(trimmedName, waypoints);
      if (result.success) {
        alert(`'${trimmedName}' 프리셋이 저장되었습니다.`);
        // 프리셋 목록 새로고침
        const updatedPresets = getPresets();
        setPresets(updatedPresets);
      } else {
        alert(`프리셋 저장 실패: ${result.error}`);
      }
    }
  };

  // 프리셋 내보내기
  const handleExportPresets = () => {
    const presetsToExport = getPresets();
    if (presetsToExport.length === 0) {
      alert('내보낼 프리셋이 없습니다.');
      return;
    }
    
    const dataStr = JSON.stringify(presetsToExport, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `task_presets_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('프리셋이 내보내기 되었습니다.');
  };

  // 프리셋 가져오기
  const handleImportPresets = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedPresets = JSON.parse(e.target.result);
            if (!Array.isArray(importedPresets)) {
              throw new Error('잘못된 파일 형식입니다.');
            }
            
            let importCount = 0;
            importedPresets.forEach(preset => {
              if (preset.name && preset.steps && Array.isArray(preset.steps)) {
                const result = savePreset(`${preset.name} (가져옴)`, preset.steps);
                if (result.success) importCount++;
              }
            });
            
            const updatedPresets = getPresets();
            setPresets(updatedPresets);
            alert(`${importCount}개의 프리셋을 가져왔습니다.`);
          } catch (error) {
            alert(`파일 가져오기 실패: ${error.message}`);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // 프리셋 로드
  const handleLoadPreset = (preset) => {
    // 기존 스텝이 있으면 확인
    if (waypoints.length > 0) {
      if (!confirm(`기존 스텝들을 모두 삭제하고 '${preset.name}' 프리셋을 불러오시겠습니까?`)) {
        return;
      }
    }
    
    const result = loadPreset(preset.id);
    if (result.success) {
      setWaypoints(result.steps);
      alert(`'${preset.name}' 프리셋을 불러왔습니다.`);
      setShowPresetDropdown(false);
    } else {
      alert(`프리셋 불러오기 실패: ${result.error}`);
    }
  };

  // 프리셋 삭제
  const handleDeletePreset = (preset) => {
    if (confirm(`'${preset.name}' 프리셋을 삭제하시겠습니까?`)) {
      const result = deletePreset(preset.id);
      if (result.success) {
        const updatedPresets = getPresets();
        setPresets(updatedPresets);
        alert('프리셋이 삭제되었습니다.');
      } else {
        alert(`프리셋 삭제 실패: ${result.error}`);
      }
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
      flex: 1,
      padding: 'var(--space-lg)',
      overflow: 'auto'
    }}>
      <div style={{
        margin: '0 0 var(--space-lg) 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: 'var(--font-size-lg)',
          fontWeight: '700',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <i className="fas fa-list-ol"></i>
          태스크 스텝 ({waypoints.length}개)
        </h3>
        
        {/* 프리셋 드롭다운 */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowPresetDropdown(!showPresetDropdown)}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
              e.target.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <i className="fas fa-save"></i>
            프리셋
            <i className={`fas fa-chevron-${showPresetDropdown ? 'up' : 'down'}`}></i>
          </button>
          
          {showPresetDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 'var(--space-xs)',
              minWidth: '280px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              {/* 액션 버튼들 */}
              <div style={{
                padding: 'var(--space-md)',
                borderBottom: '1px solid var(--border-secondary)',
                display: 'flex',
                gap: 'var(--space-sm)'
              }}>
                <button
                  type="button"
                  onClick={handleSavePreset}
                  disabled={waypoints.length === 0}
                  style={{
                    flex: 1,
                    padding: 'var(--space-sm)',
                    backgroundColor: waypoints.length > 0 ? 'var(--primary-color)' : 'var(--bg-tertiary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: waypoints.length > 0 ? 'white' : 'var(--text-tertiary)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: '600',
                    cursor: waypoints.length > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  <i className="fas fa-plus"></i> 저장
                </button>
                <button
                  type="button"
                  onClick={handleExportPresets}
                  style={{
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--font-size-xs)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  <i className="fas fa-download"></i>
                </button>
                <button
                  type="button"
                  onClick={handleImportPresets}
                  style={{
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--font-size-xs)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  <i className="fas fa-upload"></i>
                </button>
              </div>
              
              {/* 프리셋 목록 */}
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {presets.length === 0 ? (
                  <div style={{
                    padding: 'var(--space-lg)',
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    저장된 프리셋이 없습니다
                  </div>
                ) : (
                  presets.map((preset) => (
                    <div
                      key={preset.id}
                      style={{
                        padding: 'var(--space-md)',
                        borderBottom: '1px solid var(--border-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div 
                        style={{ flex: 1 }}
                        onClick={() => handleLoadPreset(preset)}
                      >
                        <div style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: '2px'
                        }}>
                          {preset.name}
                        </div>
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-tertiary)'
                        }}>
                          {preset.stepsCount}개 스텝 • {new Date(preset.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreset(preset);
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-tertiary)',
                          fontSize: 'var(--font-size-xs)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(239, 71, 111, 0.1)';
                          e.target.style.color = '#ef476f';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--text-tertiary)';
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {waypoints.length === 0 ? (
        <div style={{
          padding: 'var(--space-xl)',
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontSize: 'var(--font-size-sm)'
        }}>
          <i className="fas fa-list-ol" style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}></i>
          <p>스텝 타입을 선택하고<br />태스크 스텝을 추가해주세요</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {waypoints.map((waypoint, index) => {
            const isAnimating = animatingItems.has(waypoint.id);
            const isHighlighted = highlightedItem === waypoint.id;
            const tempPosition = tempPositions[waypoint.id] || 0;
            
            // 블럭 높이와 간격을 고려한 이동 거리 계산
            const blockHeight = 80; // 대략적인 블럭 높이 + 간격
            const translateY = tempPosition * blockHeight;
            
            return (
              <div
                key={waypoint.id}
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: isHighlighted ? 'var(--bg-card)' : 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  transform: `translateY(${translateY}px) ${isHighlighted ? 'scale(1.02)' : 'scale(1)'}`,
                  boxShadow: isHighlighted ? 
                    '0 8px 25px rgba(0, 212, 255, 0.3), 0 0 20px rgba(0, 212, 255, 0.2)' : 
                    'none',
                  borderColor: isHighlighted ? 'var(--primary-color)' : 'var(--border-primary)',
                  zIndex: isAnimating ? (isHighlighted ? 20 : 15) : 1,
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isHighlighted ? '#00d4ff' : 'var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '700',
                  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  transform: isHighlighted ? 'scale(1.15) rotate(5deg)' : 'scale(1) rotate(0deg)',
                  boxShadow: isHighlighted ? '0 0 20px rgba(0, 212, 255, 0.6)' : 'none'
                }}>
                  {index + 1}
                </div>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: getStepTypeColor(waypoint.stepType),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 'var(--font-size-xs)'
                }}>
                  <i className={getStepTypeIcon(waypoint.stepType)}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '2px'
                  }}>
                    {getStepTypeName(waypoint.stepType)} 
                    {waypoint.stepType === 'move' && ` → ${waypoint.stationName}`}
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)'
                  }}>
                    {waypoint.stepType === 'move' && `(${waypoint.x.toFixed(2)}, ${waypoint.y.toFixed(2)})`}
                    {waypoint.stepType === 'wait' && (() => {
                      // 이전 형식 호환성 처리
                      if (waypoint.waitTime) {
                        return `${waypoint.waitTime}초 대기`;
                      }
                      // 새로운 조건 형식
                      if (waypoint.waitCondition) {
                        const condition = waypoint.waitCondition;
                        if (condition.conditionType === 'time') {
                          return `${condition.waitTime}초 대기`;
                        } else if (condition.conditionType === 'input') {
                          const eventTypeNames = {
                            button: '버튼',
                            sensor: '센서',
                            signal: '신호',
                            manual: '수동'
                          };
                          return `${eventTypeNames[condition.inputEventType] || condition.inputEventType} 입력 대기`;
                        }
                      }
                      return '대기';
                    })()}
                    {waypoint.stepType === 'work' && waypoint.workDescription}
                  </div>
                  {/* 대기 스텝 추가 세부 정보 */}
                  {waypoint.stepType === 'wait' && waypoint.waitCondition && waypoint.waitCondition.conditionType === 'input' && waypoint.waitCondition.inputDescription && (
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)',
                      marginTop: '2px',
                      fontStyle: 'italic'
                    }}>
                      {waypoint.waitCondition.inputDescription}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                  <button
                    type="button"
                    onClick={() => moveWaypoint(index, 'up')}
                    disabled={index === 0 || animatingItems.size > 0}
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: (index === 0 || animatingItems.size > 0) ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-sm)',
                      color: (index === 0 || animatingItems.size > 0) ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                      fontSize: 'var(--font-size-xs)',
                      cursor: (index === 0 || animatingItems.size > 0) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    <i className="fas fa-chevron-up"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWaypoint(index, 'down')}
                    disabled={index === waypoints.length - 1 || animatingItems.size > 0}
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: (index === waypoints.length - 1 || animatingItems.size > 0) ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-sm)',
                      color: (index === waypoints.length - 1 || animatingItems.size > 0) ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                      fontSize: 'var(--font-size-xs)',
                      cursor: (index === waypoints.length - 1 || animatingItems.size > 0) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    <i className="fas fa-chevron-down"></i>
                  </button>
                  <button
                    type="button"        
                    onClick={() => removeWaypoint(waypoint.id)}
                    disabled={animatingItems.size > 0}
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: 'rgba(239, 71, 111, 0.1)',
                      border: '1px solid rgba(239, 71, 111, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#ef476f',
                      fontSize: 'var(--font-size-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(239, 71, 111, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(239, 71, 111, 0.1)';
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StepListSection;

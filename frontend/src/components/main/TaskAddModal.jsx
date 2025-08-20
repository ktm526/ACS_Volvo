import React, { useState, useEffect } from 'react';
import { STATION_TYPES } from '../../constants';
import { useMissions } from '../../hooks/useMissions';
import { savePreset, getPresets, loadPreset, deletePreset } from '../../utils/presetUtils';

// 대기 스텝 폼 컴포넌트
const WaitStepForm = ({ onAddStep }) => {
  const [waitTime, setWaitTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const timeInSeconds = parseInt(waitTime);
    if (timeInSeconds > 0) {
      onAddStep(timeInSeconds);
      setWaitTime('');
    }
  };

  return (
    <div>
      <p style={{
        margin: '0 0 var(--space-md) 0',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)'
      }}>
        대기 시간을 초 단위로 입력하세요
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
        <button
          type="submit"
          disabled={!waitTime || parseInt(waitTime) <= 0}
          style={{
            padding: 'var(--space-md)',
            backgroundColor: waitTime && parseInt(waitTime) > 0 ? '#F59E0B' : 'var(--bg-primary)',
            border: `1px solid ${waitTime && parseInt(waitTime) > 0 ? '#F59E0B' : 'var(--border-primary)'}`,
            borderRadius: 'var(--radius-md)',
            color: waitTime && parseInt(waitTime) > 0 ? 'white' : 'var(--text-tertiary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            cursor: waitTime && parseInt(waitTime) > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)'
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
  const [workDescription, setWorkDescription] = useState('');

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
            gap: 'var(--space-sm)'
          }}
        >
          <i className="fas fa-plus"></i>
          작업 스텝 추가
        </button>
      </form>
    </div>
  );
};

const TaskAddModal = ({ isOpen, onClose, onTaskCreated, robots = [], mapData = null }) => {
  const { createMission } = useMissions();
  
  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    type: 'navigation',
    priority: 'medium',
    robotId: null // null이면 비지정
  });
  
  const [waypoints, setWaypoints] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentStepType, setCurrentStepType] = useState('move'); // 현재 추가할 스텝 타입
  const [animatingItems, setAnimatingItems] = useState(new Set()); // 애니메이션 중인 아이템들
  const [tempPositions, setTempPositions] = useState({}); // 임시 위치 상태 (애니메이션용)
  const [highlightedItem, setHighlightedItem] = useState(null); // 하이라이트할 아이템 (버튼을 누른 아이템)
  
  // 프리셋 관련 state
  const [presets, setPresets] = useState([]);
  const [showPresetPanel, setShowPresetPanel] = useState(false);
  const [hoveredPreset, setHoveredPreset] = useState(null);

  // 프리셋 목록 로드
  useEffect(() => {
    const loadPresets = () => {
      const savedPresets = getPresets();
      setPresets(savedPresets);
    };
    
    if (isOpen) {
      loadPresets();
    }
  }, [isOpen]);

  // 노드 타입을 스테이션 타입으로 변환하는 함수
  const getNodeType = (nodeType) => {
    // 노드 타입에 따라 적절한 스테이션 타입 반환
    switch (nodeType) {
      case 1: return STATION_TYPES.CHARGING;
      case 2: return STATION_TYPES.LOADING;
      case 0: 
      default: return STATION_TYPES.WAITING;
    }
  };

  // 지도 노드들을 스테이션으로 변환
  const stations = mapData?.nodes ? mapData.nodes.map(node => ({
    id: node.id,
    name: node.name || `Node ${node.id}`,
    x: node.position_x,
    y: node.position_y,
    type: getNodeType(node.type) // 노드 타입을 스테이션 타입으로 변환
  })) : [];

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        type: 'navigation',
        priority: 'medium',
        robotId: null
      });
      setWaypoints([]);
      setError('');
      setCurrentStepType('move');
    }
  }, [isOpen]);

  // 웨이포인트 추가 (이동 타입)
  const addWaypoint = (station) => {
    const newWaypoint = {
      id: Date.now(),
      stepType: 'move',
      stationId: station.id,
      stationName: station.name,
      x: station.x,
      y: station.y,
      type: station.type,
      order: waypoints.length + 1
    };
    setWaypoints([...waypoints, newWaypoint]);
  };

  // 대기 스텝 추가
  const addWaitStep = (waitTime) => {
    const newWaypoint = {
      id: Date.now(),
      stepType: 'wait',
      waitTime: waitTime,
      order: waypoints.length + 1
    };
    setWaypoints([...waypoints, newWaypoint]);
  };

  // 작업 스텝 추가
  const addWorkStep = (workDescription) => {
    const newWaypoint = {
      id: Date.now(),
      stepType: 'work',
      workDescription: workDescription,
      order: waypoints.length + 1
    };
    setWaypoints([...waypoints, newWaypoint]);
  };

  // 웨이포인트 제거
  const removeWaypoint = (waypointId) => {
    const updatedWaypoints = waypoints
      .filter(wp => wp.id !== waypointId)
      .map((wp, index) => ({ ...wp, order: index + 1 }));
    setWaypoints(updatedWaypoints);
  };

  // 웨이포인트 순서 변경 (역방향 애니메이션 방식)
  const moveWaypoint = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= waypoints.length) return;
    
    const currentItem = waypoints[index];
    const targetItem = waypoints[newIndex];
    
    // 1단계: 먼저 실제 데이터 순서를 바꿈 (즉시)
    const newWaypoints = [...waypoints];
    [newWaypoints[index], newWaypoints[newIndex]] = [newWaypoints[newIndex], newWaypoints[index]];
    
    // 순서 업데이트
    newWaypoints.forEach((wp, idx) => {
      wp.order = idx + 1;
    });
    
    setWaypoints(newWaypoints);
    
    // 2단계: 역방향 애니메이션 설정 
    // 올리기: currentItem이 아래에서 위로, targetItem이 위에서 아래로 이동하는 것처럼 보이게
    // 내리기: currentItem이 위에서 아래로, targetItem이 아래에서 위로 이동하는 것처럼 보이게
    const currentItemOffset = direction === 'up' ? 1 : -1;  
    const targetItemOffset = direction === 'up' ? -1 : 1;
    
    setTempPositions({
      [currentItem.id]: currentItemOffset,
      [targetItem.id]: targetItemOffset
    });
    setAnimatingItems(new Set([currentItem.id, targetItem.id]));
    // 버튼을 누른 원래 아이템을 하이라이트 (데이터 변경과 관계없이)
    setHighlightedItem(currentItem.id);
    
    // 3단계: 다음 프레임에서 원래 위치로 애니메이션
    requestAnimationFrame(() => {
      setTempPositions({});
      
      // 애니메이션 완료 후 상태 초기화
      setTimeout(() => {
        setAnimatingItems(new Set());
        setHighlightedItem(null);
      }, 400);
    });
  };

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

  // 우선순위 색상
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef476f';
      case 'medium': return '#ffd166';
      case 'low': return '#06d6a0';
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

  // 태스크 생성
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('태스크 이름을 입력해주세요.');
      return;
    }
    
    if (waypoints.length === 0) {
      setError('최소 하나의 스텝을 추가해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const missionData = {
        name: formData.name.trim(),
        robot_id: formData.robotId,
        mission_type: formData.type,
        status: 'pending',
        priority: formData.priority,
        waypoints: waypoints,
        description: ''
      };

      await createMission(missionData);
      onTaskCreated?.();
      onClose();
    } catch (err) {
      console.error('태스크 생성 실패:', err);
      setError('태스크 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        width: '90vw',
        maxWidth: '1200px',
        height: '90vh',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 헤더 */}
        <div style={{
          padding: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 'var(--font-size-2xl)',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              새 태스크 생성
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)'
            }}>
              지도 노드를 선택하여 AMR 이동 경로를 설정하세요
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-lg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
              e.target.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 메인 컨텐츠 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden'
          }}>
            {/* 왼쪽 - 폼 */}
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
                          gap: 'var(--space-sm)'
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
                          transition: 'all 0.3s ease'
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

                {/* 프리셋 섹션 */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    <label style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      저장된 프리셋
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      <button
                        type="button"
                        onClick={() => {
                          // 프리셋 내보내기
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
                        }}
                        style={{
                          padding: 'var(--space-xs) var(--space-sm)',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--font-size-xs)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'var(--bg-primary)';
                          e.target.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <i className="fas fa-download"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // 프리셋 가져오기
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
                        }}
                        style={{
                          padding: 'var(--space-xs) var(--space-sm)',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--font-size-xs)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'var(--bg-primary)';
                          e.target.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <i className="fas fa-upload"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPresetPanel(!showPresetPanel)}
                        style={{
                          padding: 'var(--space-xs) var(--space-sm)',
                          backgroundColor: 'transparent',
                          border: `1px solid ${showPresetPanel ? 'var(--primary-color)' : 'var(--border-primary)'}`,
                          borderRadius: 'var(--radius-sm)',
                          color: showPresetPanel ? 'var(--primary-color)' : 'var(--text-secondary)',
                          fontSize: 'var(--font-size-xs)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <i className={`fas fa-chevron-${showPresetPanel ? 'up' : 'down'}`}></i>
                      </button>
                    </div>
                  </div>
                  
                  {showPresetPanel && (
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-sm)'
                    }}>
                      {presets.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: 'var(--space-lg)',
                          color: 'var(--text-tertiary)',
                          fontSize: 'var(--font-size-sm)'
                        }}>
                          저장된 프리셋이 없습니다
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                                                     {presets.map((preset) => (
                             <div
                               key={preset.id}
                               style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 padding: 'var(--space-sm)',
                                 backgroundColor: 'var(--bg-card)',
                                 border: '1px solid var(--border-secondary)',
                                 borderRadius: 'var(--radius-sm)',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s ease',
                                 position: 'relative'
                               }}
                               onMouseEnter={(e) => {
                                 e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                                 e.currentTarget.style.borderColor = 'var(--border-primary)';
                                 setHoveredPreset(preset);
                               }}
                               onMouseLeave={(e) => {
                                 e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                                 e.currentTarget.style.borderColor = 'var(--border-secondary)';
                                 setHoveredPreset(null);
                               }}
                             >
                              <div style={{ flex: 1 }} onClick={() => {
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
                                } else {
                                  alert(`프리셋 불러오기 실패: ${result.error}`);
                                }
                              }}>
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
                                  transition: 'all 0.2s ease'
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
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                   
                   {/* 프리셋 미리보기 툴팁 */}
                   {hoveredPreset && (
                     <div style={{
                       position: 'absolute',
                       top: '100%',
                       left: 0,
                       right: 0,
                       marginTop: 'var(--space-xs)',
                       padding: 'var(--space-md)',
                       backgroundColor: 'var(--bg-primary)',
                       border: '1px solid var(--border-accent)',
                       borderRadius: 'var(--radius-md)',
                       boxShadow: 'var(--shadow-lg)',
                       zIndex: 1000,
                       maxHeight: '300px',
                       overflowY: 'auto'
                     }}>
                       <div style={{
                         fontSize: 'var(--font-size-sm)',
                         fontWeight: '600',
                         color: 'var(--text-primary)',
                         marginBottom: 'var(--space-sm)',
                         display: 'flex',
                         alignItems: 'center',
                         gap: 'var(--space-xs)'
                       }}>
                         <i className="fas fa-eye"></i>
                         {hoveredPreset.name} 미리보기
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                         {hoveredPreset.steps.map((step, index) => (
                           <div key={index} style={{
                             display: 'flex',
                             alignItems: 'center',
                             gap: 'var(--space-sm)',
                             padding: 'var(--space-sm)',
                             backgroundColor: 'var(--bg-tertiary)',
                             borderRadius: 'var(--radius-sm)',
                             border: '1px solid var(--border-secondary)'
                           }}>
                             <div style={{
                               width: '24px',
                               height: '24px',
                               borderRadius: '50%',
                               backgroundColor: 'var(--primary-color)',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               color: 'white',
                               fontSize: 'var(--font-size-xs)',
                               fontWeight: '600',
                               flexShrink: 0
                             }}>
                               {step.order}
                             </div>
                             <div style={{
                               width: '24px',
                               height: '24px',
                               borderRadius: '50%',
                               backgroundColor: step.stepType === 'move' ? '#10B981' : 
                                              step.stepType === 'wait' ? '#F59E0B' : '#8B5CF6',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               color: 'white',
                               fontSize: 'var(--font-size-xs)',
                               flexShrink: 0
                             }}>
                               <i className={
                                 step.stepType === 'move' ? 'fas fa-location-arrow' :
                                 step.stepType === 'wait' ? 'fas fa-clock' : 'fas fa-tools'
                               }></i>
                             </div>
                             <div style={{ flex: 1, minWidth: 0 }}>
                               <div style={{
                                 fontSize: 'var(--font-size-sm)',
                                 fontWeight: '600',
                                 color: 'var(--text-primary)',
                                 marginBottom: '2px'
                               }}>
                                 {step.stepType === 'move' && `이동: ${step.nodeName || `(${step.x.toFixed(1)}, ${step.y.toFixed(1)})`}`}
                                 {step.stepType === 'wait' && `대기: ${step.waitTime}초`}
                                 {step.stepType === 'work' && `작업: ${step.workDescription}`}
                               </div>
                               {step.stepType === 'move' && (
                                 <div style={{
                                   fontSize: 'var(--font-size-xs)',
                                   color: 'var(--text-tertiary)'
                                 }}>
                                   좌표: ({step.x.toFixed(2)}, {step.y.toFixed(2)})
                                 </div>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
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

            {/* 가운데 - 스텝 입력 영역 */}
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
                              gap: 'var(--space-md)'
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
                                ({station.x.toFixed(2)}, {station.y.toFixed(2)}) • {station.type === 'charging' ? '충전' : station.type === 'loading' ? '작업' : '대기'}
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

            {/* 오른쪽 - 스텝 목록 */}
            <div style={{
              flex: 1,
              padding: 'var(--space-lg)',
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
                <i className="fas fa-list-ol"></i>
                태스크 스텝 ({waypoints.length}개)
              </h3>
              
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
                          {waypoint.stepType === 'wait' && `${waypoint.waitTime}초 대기`}
                          {waypoint.stepType === 'work' && waypoint.workDescription}
                        </div>
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
                            justifyContent: 'center'
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
                            justifyContent: 'center'
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
                            transition: 'all 0.3s ease'
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
          </div>

          {/* 푸터 */}
          <div style={{
            padding: 'var(--space-lg)',
            borderTop: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-md)'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '100px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--bg-primary)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'var(--bg-tertiary)';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                // 프리셋 저장 로직
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
              }}
              disabled={waypoints.length === 0}
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                backgroundColor: waypoints.length === 0 ? 'var(--bg-primary)' : '#6366f1',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                color: waypoints.length === 0 ? 'var(--text-tertiary)' : 'white',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: waypoints.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '120px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)'
              }}
              onMouseEnter={(e) => {
                if (waypoints.length > 0) {
                  e.target.style.backgroundColor = '#5855eb';
                }
              }}
              onMouseLeave={(e) => {
                if (waypoints.length > 0) {
                  e.target.style.backgroundColor = '#6366f1';
                }
              }}
            >
              <i className="fas fa-save"></i>
              프리셋 저장
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                padding: 'var(--space-md) var(--space-xl)',
                backgroundColor: isSubmitting ? 'var(--bg-tertiary)' : 'var(--primary-color)',
                border: `1px solid ${isSubmitting ? 'var(--border-primary)' : 'var(--primary-color)'}`,
                borderRadius: 'var(--radius-md)',
                color: isSubmitting ? 'var(--text-secondary)' : 'white',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)',
                minWidth: '140px',
                boxShadow: isSubmitting ? 'none' : '0 0 20px rgba(0, 212, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = '#00b8e6';
                  e.target.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = 'var(--primary-color)';
                  e.target.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  생성 중...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i>
                  태스크 생성
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAddModal; 
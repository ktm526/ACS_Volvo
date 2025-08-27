import React, { useState, useEffect } from 'react';
import { STATION_TYPES } from '../../constants';
import { useMissions } from '../../hooks/useMissions';
import { savePreset, getPresets, deletePreset } from '../../utils/presetUtils';
import TaskFormSection from './TaskFormSection';
import StepInputSection from './StepInputSection';
import StepListSection from './StepListSection';
import PresetPanel from './PresetPanel';

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
    node_index: node.node_index, // AMR이 인식할 수 있는 노드 인덱스 추가
    name: node.name || `Node ${node.node_index}`,
    x: node.position_x,
    y: node.position_y,
    type: getNodeType(node.type)
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
      stationId: station.node_index, // AMR이 인식할 수 있는 node_index 사용
      stationName: station.name,
      x: station.x,
      y: station.y,
      type: station.type,
      order: waypoints.length + 1
    };
    setWaypoints([...waypoints, newWaypoint]);
  };

  // 대기 스텝 추가
  const addWaitStep = (waitCondition) => {
    const newWaypoint = {
      id: Date.now(),
      stepType: 'wait',
      waitCondition: waitCondition, // 대기 조건 객체 전체 저장
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
    const currentItemOffset = direction === 'up' ? 1 : -1;  
    const targetItemOffset = direction === 'up' ? -1 : 1;
    
    setTempPositions({
      [currentItem.id]: currentItemOffset,
      [targetItem.id]: targetItemOffset
    });
    setAnimatingItems(new Set([currentItem.id, targetItem.id]));
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
              transition: 'all 0.3s ease',
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
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* 왼쪽 - 폼 */}
            <div style={{ position: 'relative' }}>
              <TaskFormSection 
                formData={formData}
                setFormData={setFormData}
                currentStepType={currentStepType}
                setCurrentStepType={setCurrentStepType}
                robots={robots}
                error={error}
              />
              
              {/* 프리셋 패널 */}
              <div style={{
                position: 'absolute',
                bottom: 'var(--space-lg)',
                left: 'var(--space-lg)',
                right: 'var(--space-lg)',
                zIndex: 1000
              }}>
                <PresetPanel 
                  presets={presets}
                  setPresets={setPresets}
                  showPresetPanel={showPresetPanel}
                  setShowPresetPanel={setShowPresetPanel}
                  hoveredPreset={hoveredPreset}
                  setHoveredPreset={setHoveredPreset}
                  waypoints={waypoints}
                  setWaypoints={setWaypoints}
                />
              </div>
            </div>

            {/* 가운데 - 스텝 입력 영역 */}
            <StepInputSection 
              currentStepType={currentStepType}
              stations={stations}
              addWaypoint={addWaypoint}
              addWaitStep={addWaitStep}
              addWorkStep={addWorkStep}
            />

            {/* 오른쪽 - 스텝 목록 */}
            <StepListSection 
              waypoints={waypoints}
              moveWaypoint={moveWaypoint}
              removeWaypoint={removeWaypoint}
              animatingItems={animatingItems}
              highlightedItem={highlightedItem}
              tempPositions={tempPositions}
            />
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
                minWidth: '100px',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
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
              onClick={handleSavePreset}
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
                gap: 'var(--space-xs)',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
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
                boxShadow: isSubmitting ? 'none' : '0 0 20px rgba(0, 212, 255, 0.3)',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
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


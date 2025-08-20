// 태스크 프리셋 관리 유틸리티
const PRESET_STORAGE_KEY = 'task_presets';

// 프리셋 저장
export const savePreset = (name, steps) => {
  try {
    const existingPresets = getPresets();
    const newPreset = {
      id: Date.now().toString(),
      name: name,
      steps: steps.map(step => ({
        id: step.id,
        x: step.x,
        y: step.y,
        order: step.order,
        stepType: step.stepType,
        nodeName: step.nodeName,
        waitTime: step.waitTime,
        workDescription: step.workDescription
      })),
      createdAt: new Date().toISOString(),
      stepsCount: steps.length
    };
    
    const updatedPresets = [...existingPresets, newPreset];
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updatedPresets));
    return { success: true, preset: newPreset };
  } catch (error) {
    console.error('프리셋 저장 실패:', error);
    return { success: false, error: error.message };
  }
};

// 프리셋 목록 가져오기
export const getPresets = () => {
  try {
    const stored = localStorage.getItem(PRESET_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('프리셋 로드 실패:', error);
    return [];
  }
};

// 프리셋 불러오기
export const loadPreset = (presetId) => {
  try {
    const presets = getPresets();
    const preset = presets.find(p => p.id === presetId);
    if (!preset) {
      return { success: false, error: '프리셋을 찾을 수 없습니다.' };
    }
    
    // 새로운 ID로 스텝들을 복사
    const steps = preset.steps.map(step => ({
      ...step,
      id: Date.now() + Math.random() // 고유 ID 생성
    }));
    
    return { success: true, steps, preset };
  } catch (error) {
    console.error('프리셋 로드 실패:', error);
    return { success: false, error: error.message };
  }
};

// 프리셋 삭제
export const deletePreset = (presetId) => {
  try {
    const presets = getPresets();
    const updatedPresets = presets.filter(p => p.id !== presetId);
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updatedPresets));
    return { success: true };
  } catch (error) {
    console.error('프리셋 삭제 실패:', error);
    return { success: false, error: error.message };
  }
};

// 프리셋 이름 변경
export const renamePreset = (presetId, newName) => {
  try {
    const presets = getPresets();
    const presetIndex = presets.findIndex(p => p.id === presetId);
    if (presetIndex === -1) {
      return { success: false, error: '프리셋을 찾을 수 없습니다.' };
    }
    
    presets[presetIndex].name = newName;
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
    return { success: true, preset: presets[presetIndex] };
  } catch (error) {
    console.error('프리셋 이름 변경 실패:', error);
    return { success: false, error: error.message };
  }
}; 
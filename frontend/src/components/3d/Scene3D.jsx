import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import { useAppContext } from '../../contexts/AppContext';
import { getStatusColor } from '../../constants';
import * as THREE from 'three';
import MapRenderer3D from './MapRenderer3D';

// 카메라 애니메이션 컴포넌트
function CameraController({ viewMode, zoomLevel, trackedRobot, duration = 1.0, initialCameraState = null }) {
  const { camera, controls } = useThree();
  const animationRef = useRef(null);
  const lastConfig = useRef({ viewMode: null, zoomLevel: null, trackedRobot: null });
  const initialStateApplied = useRef(false);

  useEffect(() => {
    if (!controls) return;

    // 초기 카메라 상태가 있고 아직 적용되지 않았다면 건너뛰기
    if (initialCameraState && !initialStateApplied.current) {
      // 초기 상태가 적용될 때까지 기다리기
      const timer = setTimeout(() => {
        initialStateApplied.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }

    // 설정이 변경되었는지 확인
    const configChanged = 
      lastConfig.current.viewMode !== viewMode ||
      lastConfig.current.zoomLevel !== zoomLevel ||
      lastConfig.current.trackedRobot !== trackedRobot?.id;

    if (!configChanged) return;

    // 이전 애니메이션 취소
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // 현재 구면 좌표 계산
    const currentDistance = camera.position.distanceTo(controls.target);
    const currentPolar = Math.acos(Math.max(-1, Math.min(1, 
      (camera.position.y - controls.target.y) / currentDistance
    )));
    const currentAzimuth = Math.atan2(
      camera.position.x - controls.target.x,
      camera.position.z - controls.target.z
    );

    // 목표 설정 계산
    let targetDistance, targetPolar, targetAzimuth, targetTarget;

    // 줌 레벨에 따른 거리 계산 (8~50 범위) - 맵 데이터에 맞게 조정
    targetDistance = 8 + (3 - zoomLevel) * 17; // zoomLevel 3일 때 8, 0.5일 때 50.5

    // 뷰 모드에 따른 극각 계산
    if (viewMode === 'overview') {
      targetPolar = Math.PI * 0.005; // 거의 완전 수직 (약 0.9도)
    } else {
      targetPolar = Math.PI * 0.2; // 약 54도 기울임
    }

    // 로봇 추적 여부에 따른 타겟과 방위각 설정
    if (trackedRobot) {
      targetTarget = new THREE.Vector3(
        trackedRobot.location_x || 0, 
        0, 
        trackedRobot.location_y || 0
      );
      // 추적 모드에서는 현재 방위각 유지 (부드러운 추적)
      targetAzimuth = currentAzimuth;
    } else {
      targetTarget = new THREE.Vector3(0, 0, 0);
      // 일반 모드에서는 정면 (0도) - 격자가 정방향이 되도록
      targetAzimuth = 0; // 0도 (정면)
    }

    console.log('Camera smooth transition:', { 
      viewMode, 
      zoomLevel,
      targetDistance,
      targetPolar: (targetPolar * 180 / Math.PI).toFixed(1) + '°',
      trackedRobot: trackedRobot?.id
    });

    // 애니메이션 시작값
    const startDistance = currentDistance;
    const startPolar = currentPolar;
    const startAzimuth = currentAzimuth;
    const startTarget = controls.target.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // 부드러운 easing (더 자연스러운 곡선)
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // 값들 보간
      const currentDist = THREE.MathUtils.lerp(startDistance, targetDistance, easeProgress);
      const currentPol = THREE.MathUtils.lerp(startPolar, targetPolar, easeProgress);
      const currentAzi = THREE.MathUtils.lerp(startAzimuth, targetAzimuth, easeProgress);
      
      // 타겟 보간
      const currentTarget = new THREE.Vector3().lerpVectors(startTarget, targetTarget, easeProgress);

      // 구면 좌표를 직교 좌표로 변환
      const x = currentTarget.x + currentDist * Math.sin(currentPol) * Math.sin(currentAzi);
      const y = currentTarget.y + currentDist * Math.cos(currentPol);
      const z = currentTarget.z + currentDist * Math.sin(currentPol) * Math.cos(currentAzi);

      // 카메라와 컨트롤 업데이트
      camera.position.set(x, y, z);
      controls.target.copy(currentTarget);
      controls.update();

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        console.log('Camera transition completed');
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    // 현재 설정 저장
    lastConfig.current = {
      viewMode,
      zoomLevel,
      trackedRobot: trackedRobot?.id
    };

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [viewMode, zoomLevel, trackedRobot, camera, controls, duration]);

  return null;
}

// 카메라 상태 추적 및 저장 컴포넌트
function CameraStateTracker({ initialCameraState, onCameraStateChange }) {
  const { camera, controls } = useThree();
  const lastSaveTime = useRef(Date.now());
  const saveThreshold = 500; // 500ms 후에 저장

  // 초기 카메라 상태 복원
  useEffect(() => {
    if (initialCameraState && initialCameraState.position && initialCameraState.target && controls) {
      const { position, target } = initialCameraState;
      
      // 카메라 위치 복원
      camera.position.set(position.x, position.y, position.z);
      
      // 컨트롤 타겟 복원
      controls.target.set(target.x, target.y, target.z);
      
      // 컨트롤 업데이트
      controls.update();
      
      console.log('Camera state restored:', { position, target });
    }
  }, [initialCameraState, camera, controls]);

  // 카메라 상태 변경 감지
  useFrame(() => {
    if (!controls || !onCameraStateChange) return;

    const now = Date.now();
    if (now - lastSaveTime.current > saveThreshold) {
      const currentState = {
        position: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        },
        target: {
          x: controls.target.x,
          y: controls.target.y,
          z: controls.target.z
        },
        rotation: {
          x: camera.rotation.x,
          y: camera.rotation.y,
          z: camera.rotation.z
        }
      };

      onCameraStateChange(currentState);
      lastSaveTime.current = now;
    }
  });

  return null;
}

// 테마에 따른 색상 팔레트 함수
const getColors = (theme) => {
  const isDark = theme === 'dark';
  
  return {
    // 로봇 상태 색상 (사이드바와 통일)
    moving: '#3B82F6',     // 이동중 (파란색)
    idle: '#22C55E',       // 대기 (녹색)
    charging: '#F59E0B',   // 충전중 (주황색)
    error: '#EF4444',      // 오류 (빨간색)
    working: '#F59E0B',    // 작업중 (주황색)
    disconnected: '#6B7280', // 연결 끊김 (회색)
    
    // 환경 색상 (테마별 차별화)
    background: isDark ? '#0A0A0F' : '#F8F9FA', // 배경
    grid: isDark ? '#404060' : '#BDC3C7',       // 그리드
    glow: isDark ? '#00FFFF' : '#3498DB',       // 글로우 효과
    text: isDark ? '#FFFFFF' : '#2C3E50',       // 텍스트
    path: isDark ? '#40A0FF' : '#3498DB',       // 경로
    robot: isDark ? '#CCCCCC' : '#7F8C8D',      // 로봇 색상
    
    // 툴팁 추가 색상
    textSecondary: isDark ? '#CCCCCC' : '#6C757D',      // 보조 텍스트
    border: isDark ? '#333333' : '#E0E0E0',             // 테두리
    backgroundSecondary: isDark ? '#333333' : '#F5F5F5' // 보조 배경
  };
};

// 로봇 컴포넌트
function Robot({ robot, colors, isSelected = false, onHover, onHoverEnd, theme }) {
  const meshRef = useRef();
  const pulseRef = useRef();
  const pulseRef2 = useRef();
  const { camera, gl } = useThree();
  const [isHovered, setIsHovered] = useState(false);
  
  // RobotCard와 동일한 상태 색상 매핑 사용
  const statusColor = getStatusColor(robot.status, 'robot');

  // 로봇 방향 계산 (angle 필드 우선, 없으면 경로 정보 이용)
  const calculateDirection = () => {
    // 먼저 angle 필드 확인
    if (robot.angle !== undefined && robot.angle !== null) {
      // 좌표계 보정: ROS 좌표계에서 Three.js 좌표계로 변환
      return robot.angle + Math.PI / 2;
    }
    
    // angle이 없으면 경로 정보를 이용
    if (robot.path && robot.path.length >= 2 && robot.currentPathIndex !== undefined) {
      const currentIndex = robot.currentPathIndex;
      const nextIndex = Math.min(currentIndex + 1, robot.path.length - 1);
      
      if (currentIndex < robot.path.length - 1) {
        const currentPoint = robot.path[currentIndex];
        const nextPoint = robot.path[nextIndex];
        
        if (currentPoint && nextPoint && Array.isArray(currentPoint) && Array.isArray(nextPoint)) {
          const dx = nextPoint[0] - currentPoint[0];
          const dy = nextPoint[1] - currentPoint[1];
          // 경로 기반 방향도 좌표계 보정
          return Math.atan2(dy, dx) + Math.PI / 2;
        }
      }
    }
    
    // 기본 방향 (북쪽, 좌표계 보정 적용)
    return Math.PI / 2;
  };

  const robotDirection = calculateDirection();

  // 디버깅: 로봇 데이터 확인 (위치가 0,0이 아닌 경우만)
  if (robot.location_x !== 0 || robot.location_y !== 0) {
    console.log('✅ Robot 컴포넌트 - 로봇 위치 데이터 확인:', {
      id: robot.id,
      name: robot.name,
      location_x: robot.location_x,
      location_y: robot.location_y,
      angle: robot.angle,
      원본_각도_도수: robot.angle ? (robot.angle * 180 / Math.PI).toFixed(1) + '°' : 'N/A',
      보정된_방향_도수: (robotDirection * 180 / Math.PI).toFixed(1) + '°'
    });
  } else {
    console.log('❌ Robot 컴포넌트 - 로봇 위치가 0,0입니다:', {
      id: robot.id,
      name: robot.name,
      전체_데이터: robot
    });
  }

  // 레이더 스캔 효과
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (pulseRef.current) {
      const wave1Progress = (time * 1.5) % 3;
      const scale1 = 0.1 + wave1Progress * 0.6;
      const opacity1 = Math.max(0, 0.8 - wave1Progress * 0.25);
      
      pulseRef.current.scale.setScalar(scale1);
      pulseRef.current.material.opacity = opacity1;
    }
    
    if (pulseRef2.current) {
      const wave2Progress = ((time * 1.5) + 1.5) % 3;
      const scale2 = 0.1 + wave2Progress * 0.5;
      const opacity2 = Math.max(0, 0.6 - wave2Progress * 0.2);
      
      pulseRef2.current.scale.setScalar(scale2);
      pulseRef2.current.material.opacity = opacity2;
    }
    
    // 선택된 로봇은 더 빠른 스캔
    if (isSelected) {
      if (pulseRef.current) {
        const fastWave = (time * 2.5) % 3;
        const fastScale = 0.1 + fastWave * 0.8;
        const fastOpacity = Math.max(0, 0.9 - fastWave * 0.3);
        
        pulseRef.current.scale.setScalar(fastScale);
        pulseRef.current.material.opacity = fastOpacity;
      }
    }
    
    // 로봇 화살표 애니메이션
    if (meshRef.current) {
      if (robot.status === 'moving') {
        meshRef.current.material.emissiveIntensity = 0.6 + Math.sin(time * 4) * 0.2;
        meshRef.current.rotation.z = robotDirection + Math.sin(time * 2) * 0.05;
      } else {
        meshRef.current.material.emissiveIntensity = 0.4;
        meshRef.current.rotation.z = robotDirection;
      }
    }
  });

  useEffect(() => {
    if (isHovered) {
      onHover && onHover(robot);
    } else {
      onHoverEnd && onHoverEnd(robot.id);
    }
  }, [isHovered, robot, onHover, onHoverEnd]);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, [robot.id]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
  }, [robot.id]);
  
  // 안전한 위치 값 사용
  const robotX = robot.location_x !== undefined ? robot.location_x : 0;
  const robotY = robot.location_y !== undefined ? robot.location_y : 0;
  
  console.log('Robot 컴포넌트 - 최종 위치:', { robotX, robotY });

  return (
    <group position={[robotX, 0.1, -robotY]}>
      {/* 펄스 링들 */}
      <group rotation={[-Math.PI / 2, 0, robotDirection]}>
        <mesh 
          ref={pulseRef}
          position={[0, 0, 0]} 
          rotation={[0, 0, 0]}
        >
          <ringGeometry args={[0.1, 0.2, 32]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={isSelected ? 0.8 : 0.3}
            transparent
            opacity={isSelected ? 0.9 : 0.5}
          />
        </mesh>
        
        <mesh 
          ref={pulseRef2}
          position={[0, 0, 0]} 
          rotation={[0, 0, 0]}
        >
          <ringGeometry args={[0.05, 0.08, 32]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={isSelected ? 0.6 : 0.2}
            transparent
            opacity={isSelected ? 0.7 : 0.4}
          />
        </mesh>
      </group>
      
      {/* 로봇 본체 (원뿔 화살표) */}
      <mesh 
        ref={meshRef}
        position={[0, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, robotDirection]}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <coneGeometry args={[0.12, 0.4, 8]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.4}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      
      {/* 선택 표시 */}
      {isSelected && (
        <group rotation={[-Math.PI / 2, 0, robotDirection]}>
          <mesh position={[0, -0.2, 0]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.25, 0.3, 32]} />
            <meshStandardMaterial
              color={statusColor}
              emissive={statusColor}
              emissiveIntensity={1.0}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      )}

      {/* 로봇 툴팁 (3D 공간에 고정) */}
      {isHovered && (
        <Html 
          position={[robotX, 1.2, -robotY]}
          center
          style={{
            transform: 'translate(-50%, -100%)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <RobotTooltip robot={robot} statusColor={statusColor} theme={theme} />
        </Html>
      )}
    </group>
  );
}

// 로봇 툴팁 컴포넌트 (스테이션과 동일한 스타일)
function RobotTooltip({ robot, statusColor, theme = 'dark' }) {

  const getThemeColors = (theme) => {
    if (theme === 'light') {
      return {
        background: '#ffffff',
        textPrimary: '#2c3e50',
        textSecondary: '#34495e',
        textTertiary: '#7f8c8d',
        border: '#e0e0e0',
        batteryBg: '#f5f5f5',
        batteryBorder: '#d0d0d0'
      };
    } else {
      return {
        background: '#1a1a1a',
        textPrimary: '#ffffff',
        textSecondary: '#e5e5e5',
        textTertiary: '#cccccc',
        border: '#333333',
        batteryBg: '#333333',
        batteryBorder: '#555555'
      };
    }
  };

  const themeColors = getThemeColors(theme);

  const safeBattery = robot.battery || 0;
  const safeName = robot.name || robot.id || 'Unknown';
  const safeId = robot.id || 'Unknown';
  const safeMission = robot.currentMission || '상태 정보 없음';
  const safeLocationX = robot.location_x !== undefined ? robot.location_x : 0;
  const safeLocationY = robot.location_y !== undefined ? robot.location_y : 0;
  const safeSpeed = robot.speed || 0;

  // 디버깅: 툴팁에서 위치 데이터 확인 (호버 시에만)
  if (safeLocationX !== 0 || safeLocationY !== 0) {
    console.log('✅ RobotTooltip - 위치 데이터 정상:', {
      원본_location_x: robot.location_x,
      원본_location_y: robot.location_y,
      최종_표시_위치: { x: safeLocationX, y: safeLocationY }
    });
  } else {
    console.log('❌ RobotTooltip - 위치 데이터가 0,0:', {
      원본_location_x: robot.location_x,
      원본_location_y: robot.location_y,
      타입_원본_x: typeof robot.location_x,
      타입_원본_y: typeof robot.location_y,
      전체_로봇_데이터: robot
    });
  }

  return (
    <div style={{
      background: themeColors.background,
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '16px 20px',
      color: themeColors.textPrimary,
      fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      fontSize: '13px',
      fontWeight: '500',
      textAlign: 'left',
      minWidth: '240px',
      maxWidth: '320px',
      boxShadow: theme === 'dark' 
        ? `0 0 20px ${statusColor}40, 0 4px 16px rgba(0, 0, 0, 0.5)`
        : `0 0 20px ${statusColor}30, 0 4px 16px rgba(0, 0, 0, 0.15)`,
      position: 'relative'
    }}>
      {/* 헤더 */}
      <div style={{ 
        marginBottom: '12px', 
        paddingBottom: '8px',
        borderBottom: `1px solid ${themeColors.border}`,
        fontSize: '15px', 
        fontWeight: '700', 
        color: statusColor,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: statusColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#ffffff',
          fontWeight: '600'
        }}>
          {robot.status === 'moving' ? '▶' :
           robot.status === 'charging' ? '⚡' :
           robot.status === 'error' ? '✕' :
           robot.status === 'disconnected' ? '⚠' : '⏸'}
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: themeColors.textPrimary }}>
            {safeName}
          </div>
          <div style={{ fontSize: '12px', color: themeColors.textTertiary }}>
            {safeId}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '12px',
            backgroundColor: themeColors.batteryBg,
            borderRadius: '3px',
            position: 'relative',
            border: `1px solid ${themeColors.batteryBorder}`
          }}>
            <div style={{
              width: `${safeBattery}%`,
              height: '100%',
              backgroundColor: safeBattery > 50 ? '#4ade80' :
                             safeBattery > 20 ? '#fbbf24' : '#ef4444',
              borderRadius: '2px'
            }}></div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600', color: themeColors.textPrimary }}>
            {safeBattery}%
          </span>
        </div>
      </div>

      {/* 미션 정보 */}
      <div style={{
        fontSize: '13px',
        marginBottom: '10px',
        color: themeColors.textSecondary,
        fontWeight: '500'
      }}>
        {safeMission}
      </div>

      {/* 상세 정보 */}
      <div style={{ 
        fontSize: '12px', 
        color: themeColors.textTertiary, 
        lineHeight: '1.5',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '6px 12px'
      }}>
        <span style={{ fontWeight: '600', color: themeColors.textPrimary }}>위치:</span>
        <span style={{ fontFamily: 'monospace' }}>
          ({safeLocationX.toFixed(1)}, {safeLocationY.toFixed(1)})
        </span>
        
        <span style={{ fontWeight: '600', color: themeColors.textPrimary }}>방향:</span>
        <span style={{ fontFamily: 'monospace' }}>
          {((robot.angle || 0) * 180 / Math.PI).toFixed(1)}°
        </span>
        
        {robot.destination && (
          <>
            <span style={{ fontWeight: '600', color: themeColors.textPrimary }}>목적지:</span>
            <span>{robot.destination}</span>
          </>
        )}
        
        {safeSpeed > 0 && (
          <>
            <span style={{ fontWeight: '600', color: themeColors.textPrimary }}>속도:</span>
            <span style={{ fontFamily: 'monospace' }}>{safeSpeed.toFixed(1)} m/s</span>
          </>
        )}
      </div>
      
      {/* 말풍선 꼬리 */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '0',
        height: '0',
        borderLeft: '16px solid transparent',
        borderRight: '16px solid transparent',
        borderTop: `16px solid ${themeColors.background}`,
        filter: `drop-shadow(0 2px 4px ${theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'})`
      }}></div>
    </div>
  );
}

// 경로 트레일 컴포넌트
function PathTrail({ path, color }) {
  if (!path || !Array.isArray(path) || path.length < 2) {
    return null;
  }
  
  const validPath = path.filter(point => {
    if (!Array.isArray(point) || point.length < 2) return false;
    const [x, y] = point;
    return typeof x === 'number' && typeof y === 'number' && 
           !isNaN(x) && !isNaN(y) && 
           isFinite(x) && isFinite(y);
  });
  
  if (validPath.length < 2) {
    return null;
  }
  
  try {
    const points = validPath.map(([x, y]) => new THREE.Vector3(x, 0.2, y));
    
    const validPoints = points.filter(point => 
      !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
      isFinite(point.x) && isFinite(point.y) && isFinite(point.z)
    );

    if (validPoints.length < 2) {
      return null;
    }
    
    return (
      <Line
        points={validPoints}
        color={color || '#FFFFFF'}
        lineWidth={2}
        dashed={true}
        dashScale={0.5}
        dashSize={0.5}
        gapSize={0.3}
        transparent={true}
        opacity={0.8}
      />
    );
  } catch (error) {
    console.error('PathTrail: Error creating line', error);
    return null;
  }
}

// 단순한 그리드
function Grid({ colors }) {
  return (
    <group>
      {/* 메인 바닥 */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[800, 800]} />
        <meshBasicMaterial color={colors.background} />
      </mesh>
      
      {/* 그리드 라인 */}
      <gridHelper args={[800, 400, colors.grid, colors.grid]} opacity={0.6} />
      <gridHelper args={[800, 1600, colors.grid, colors.grid]} opacity={0.3} />
    </group>
  );
}



// 메인 Scene3D 컴포넌트
const Scene3D = ({ 
  robots = [], 
  missions = [], 
  viewMode = 'overview', 
  showPaths = true,
  showGrid = true,
  zoomLevel = 1,
  trackedRobot = null,
  mapData = null,
  showMapData = false,
  initialCameraState = null,
  onCameraStateChange = null,
  onMoveRequest = null
}) => {
  const { state } = useAppContext();
  
  // 테마에 따른 색상 팔레트 가져오기
  const colors = getColors(state.ui.theme);
  
  // 서버에서 받은 실제 로봇 데이터 사용
  const activeRobots = robots || [];

  // 추적 중인 로봇 찾기
  const trackedRobotData = activeRobots.find(robot => robot.id === trackedRobot);
  
  useEffect(() => {
    console.log('Scene3D props updated:', { 
      viewMode, 
      zoomLevel, 
      trackedRobot: trackedRobotData?.id,
      showMapData,
      mapData: mapData ? { id: mapData.map?.id, name: mapData.map?.name } : null,
      robotsCount: activeRobots.length
    });
  }, [viewMode, zoomLevel, trackedRobotData, showMapData, mapData, activeRobots.length]);

  const handleRobotHover = useCallback((robot) => {
    // 이제 툴팁이 3D 공간에서 직접 관리되므로 별도 상태 불필요
  }, []);

  const handleRobotHoverEnd = useCallback((robotId) => {
    // 이제 툴팁이 3D 공간에서 직접 관리되므로 별도 상태 불필요
  }, []);

  const handleMoveRequest = useCallback(async (robotId, nodeId) => {
    if (onMoveRequest) {
      await onMoveRequest(robotId, nodeId);
    }
  }, [onMoveRequest]);

  return (
    <>
      <Canvas
        camera={{ 
          position: [0, 35, 30], 
          fov: 60,
          near: 0.1,
          far: 200
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: `radial-gradient(circle at center, ${colors.background} 0%, ${colors.background === '#F8F9FA' ? '#E9ECEF' : '#000000'} 100%)`
        }}
      >
        {/* 조명 설정 */}
        <ambientLight intensity={0.4} color={colors.glow} />
        <pointLight position={[0, 30, 0]} intensity={0.6} color={colors.glow} />
        <pointLight position={[20, 20, 20]} intensity={0.3} color={colors.moving} />
        <pointLight position={[-20, 20, -20]} intensity={0.3} color={colors.idle} />

        {/* 배경 그리드 */}
        {showGrid && <Grid colors={colors} />}

        {/* 맵 데이터 렌더링 */}
        {showMapData && mapData && (
          <MapRenderer3D 
            mapData={mapData}
            showTexture={true}
            showNodes={true}
            showConnections={true}
            selectedNode={null}
            onNodeHover={null}
            onNodeHoverEnd={null}
            robots={activeRobots}
            onMoveRequest={handleMoveRequest}
          />
        )}

        {/* 로봇들 */}
        {activeRobots.map(robot => (
          <Robot 
            key={robot.id} 
            robot={robot}
            colors={colors}
            isSelected={trackedRobot === robot.id}
            onHover={handleRobotHover}
            onHoverEnd={handleRobotHoverEnd}
            theme={state.ui?.theme || 'dark'}
          />
        ))}

        {/* 로봇 경로 트레일 */}
        {showPaths && activeRobots.map(robot => (
          robot.path && robot.path.length > 0 && (
            <PathTrail 
              key={`trail-${robot.id}`}
              path={robot.path}
              color={getStatusColor(robot.status, 'robot')}
            />
          )
        ))}

        {/* 카메라 컨트롤 및 애니메이션 컨트롤러 */}
        <CameraController 
          viewMode={viewMode}
          zoomLevel={zoomLevel}
          trackedRobot={trackedRobotData}
          duration={1.0}
          initialCameraState={initialCameraState}
        />
        
        <OrbitControls 
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={0}
          enableRotate={true}
          enableZoom={true}
          enablePan={!trackedRobotData}
          rotateSpeed={0.6}
          zoomSpeed={1.0}
          panSpeed={0.8}
          screenSpacePanning={false}
          makeDefault={true}
        />
        
        {/* 카메라 상태 추적 및 저장 */}
        <CameraStateTracker 
          initialCameraState={initialCameraState}
          onCameraStateChange={onCameraStateChange}
        />
      </Canvas>
    </>
  );
};

export default Scene3D; 
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import { createPortal } from 'react-dom';
import { STATIONS, PATHS } from '../../constants';
import * as THREE from 'three';
import MapRenderer3D from './MapRenderer3D';

// 카메라 애니메이션 컴포넌트
function CameraController({ viewMode, zoomLevel, trackedRobot, duration = 1.0 }) {
  const { camera, controls } = useThree();
  const animationRef = useRef(null);
  const lastConfig = useRef({ viewMode: null, zoomLevel: null, trackedRobot: null });

  useEffect(() => {
    if (!controls) return;

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

// 사이드바와 통일된 색상 팔레트
const METRO_COLORS = {
  // 주요 노선 색상
  line1: '#FF0040',      // 빨간선 (네온 레드)
  line2: '#00FF88',      // 초록선 (네온 그린)
  line3: '#0080FF',      // 파란선 (네온 블루)
  line4: '#FF8000',      // 주황선 (네온 오렌지)
  line5: '#8000FF',      // 보라선 (네온 퍼플)
  
  // 로봇 상태 색상 (사이드바와 통일)
  moving: '#3B82F6',     // 이동중 (파란색)
  idle: '#22C55E',       // 대기 (녹색)
  charging: '#F59E0B',   // 충전중 (주황색)
  error: '#EF4444',      // 오류 (빨간색)
  working: '#F59E0B',    // 작업중 (주황색)
  
  // 스테이션 타입 색상
  station: '#40FF80',    // 일반 스테이션
  charging_station: '#FF8040', // 충전소
  depot: '#8040FF',      // 창고
  
  // 환경 색상
  background: '#0A0A0F', // 배경
  grid: '#404060',       // 그리드 (더 밝게)
  glow: '#00FFFF',       // 글로우 효과
  text: '#FFFFFF',       // 텍스트
  path: '#40A0FF',       // 연결 경로 (밝은 파란색)
  robot: '#CCCCCC'       // 로봇 통일 색상 (밝은 회색)
};

// 확장된 스테이션 데이터 (지하철 노선도 스타일)
const METRO_STATIONS = [
  // 메인 라인 1 (수평선)
  { id: 'A01', name: '물류센터', x: -20, y: 0, type: 'depot', line: 'line1' },
  { id: 'A02', name: '검수장 A', x: -15, y: 0, type: 'station', line: 'line1' },
  { id: 'A03', name: '작업장 1', x: -10, y: 0, type: 'station', line: 'line1' },
  { id: 'A04', name: '중앙허브', x: 0, y: 0, type: 'station', line: 'line1' },
  { id: 'A05', name: '작업장 2', x: 10, y: 0, type: 'station', line: 'line1' },
  { id: 'A06', name: '포장센터', x: 15, y: 0, type: 'station', line: 'line1' },
  { id: 'A07', name: '출고장', x: 20, y: 0, type: 'depot', line: 'line1' },
  
  // 메인 라인 2 (수직선)
  { id: 'B01', name: '충전소 A', x: 0, y: -15, type: 'charging_station', line: 'line2' },
  { id: 'B02', name: '검수장 B', x: 0, y: -10, type: 'station', line: 'line2' },
  { id: 'B03', name: '작업장 3', x: 0, y: 10, type: 'station', line: 'line2' },
  { id: 'B04', name: '충전소 B', x: 0, y: 15, type: 'charging_station', line: 'line2' },
  
  // 지선 1 (대각선)
  { id: 'C01', name: '임시창고', x: -10, y: -10, type: 'depot', line: 'line3' },
  { id: 'C02', name: '품질관리', x: -5, y: -5, type: 'station', line: 'line3' },
  { id: 'C03', name: '특수작업장', x: 5, y: 5, type: 'station', line: 'line3' },
  { id: 'C04', name: '긴급창고', x: 10, y: 10, type: 'depot', line: 'line3' },
  
  // 지선 2 (반대 대각선)
  { id: 'D01', name: '폐기물처리', x: -10, y: 10, type: 'station', line: 'line4' },
  { id: 'D02', name: '재활용센터', x: -5, y: 5, type: 'station', line: 'line4' },
  { id: 'D03', name: '정비소', x: 5, y: -5, type: 'station', line: 'line4' },
  { id: 'D04', name: '예비창고', x: 10, y: -10, type: 'depot', line: 'line4' }
];

// 노선 경로 데이터
const METRO_LINES = [
  {
    id: 'line1',
    name: '메인라인 1호선',
    color: METRO_COLORS.line1,
    points: [
      [-20, 0], [-15, 0], [-10, 0], [0, 0], [10, 0], [15, 0], [20, 0]
    ]
  },
  {
    id: 'line2',
    name: '메인라인 2호선',
    color: METRO_COLORS.line2,
    points: [
      [0, -15], [0, -10], [0, 0], [0, 10], [0, 15]
    ]
  },
  {
    id: 'line3',
    name: '지선 3호선',
    color: METRO_COLORS.line3,
    points: [
      [-10, -10], [-5, -5], [0, 0], [5, 5], [10, 10]
    ]
  },
  {
    id: 'line4',
    name: '지선 4호선',
    color: METRO_COLORS.line4,
    points: [
      [-10, 10], [-5, 5], [0, 0], [5, -5], [10, -10]
    ]
  }
];

// 연결 경로 데이터 (스테이션 간 추가 연결)
const CONNECTION_PATHS = [
  // 1호선과 2호선 연결부 강화
  { points: [[-15, 0], [0, -10]], color: METRO_COLORS.path },
  { points: [[-10, 0], [0, -10]], color: METRO_COLORS.path },
  { points: [[10, 0], [0, 10]], color: METRO_COLORS.path },
  { points: [[15, 0], [0, 10]], color: METRO_COLORS.path },
  
  // 대각선 연결
  { points: [[-15, 0], [-10, -10]], color: METRO_COLORS.path },
  { points: [[-10, 0], [-5, -5]], color: METRO_COLORS.path },
  { points: [[10, 0], [5, 5]], color: METRO_COLORS.path },
  { points: [[15, 0], [10, 10]], color: METRO_COLORS.path },
  
  // 반대 대각선 연결
  { points: [[-15, 0], [-10, 10]], color: METRO_COLORS.path },
  { points: [[-10, 0], [-5, 5]], color: METRO_COLORS.path },
  { points: [[10, 0], [5, -5]], color: METRO_COLORS.path },
  { points: [[15, 0], [10, -10]], color: METRO_COLORS.path },
  
  // 수직선과 대각선 연결
  { points: [[0, -10], [-5, -5]], color: METRO_COLORS.path },
  { points: [[0, -10], [5, -5]], color: METRO_COLORS.path },
  { points: [[0, 10], [-5, 5]], color: METRO_COLORS.path },
  { points: [[0, 10], [5, 5]], color: METRO_COLORS.path },
  
  // 창고와 충전소 연결
  { points: [[-20, 0], [0, -15]], color: METRO_COLORS.path },
  { points: [[20, 0], [0, 15]], color: METRO_COLORS.path },
  { points: [[-10, -10], [10, -10]], color: METRO_COLORS.path },
  { points: [[-10, 10], [10, 10]], color: METRO_COLORS.path }
];

// 노선 렌더링 컴포넌트
function MetroLine({ line, isActive = false }) {
  if (!line || !line.points || !Array.isArray(line.points)) {
    console.warn('MetroLine: Invalid line data', line);
    return null;
  }

  // 유효한 점들만 필터링
  const validPoints = line.points.filter(point => {
    if (!Array.isArray(point) || point.length < 2) return false;
    const [x, y] = point;
    return typeof x === 'number' && typeof y === 'number' && 
           !isNaN(x) && !isNaN(y) && 
           isFinite(x) && isFinite(y);
  });
  
  // 최소 2개의 점이 있어야 라인을 그릴 수 있음
  if (validPoints.length < 2) {
    console.warn('MetroLine: Not enough valid points', { line: line.id, validPoints: validPoints.length });
    return null;
  }
  
  try {
    const points = validPoints.map(([x, y]) => new THREE.Vector3(x, 0.1, y));
    
    // 포인트 배열 유효성 재검사
    const validVectors = points.filter(point => 
      !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
      isFinite(point.x) && isFinite(point.y) && isFinite(point.z)
    );

    if (validVectors.length < 2) {
      console.warn('MetroLine: Not enough valid Vector3 points', { line: line.id, validVectors: validVectors.length });
      return null;
    }
    
    return (
      <group>
        <Line
          points={validVectors}
          color={line.color || '#FFFFFF'}
          lineWidth={2}
          segments={true}
          transparent={true}
          opacity={0.8}
        />
      </group>
    );
  } catch (error) {
    console.error('MetroLine: Error creating line', error);
    return null;
  }
}

// 스테이션 컴포넌트 (원형 테 제거)
function MetroStation({ station, isSelected = false }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const stationColor = station.type === 'charging_station' ? METRO_COLORS.charging_station :
                      station.type === 'depot' ? METRO_COLORS.depot :
                      METRO_COLORS.station;
  
  return (
    <group position={[station.x, 0, station.y]}>
      {/* 중앙 점만 남김 */}
      <mesh 
        position={[0, 0.03, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial
          color={stationColor}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* 스테이션 정보 - 호버시에만 표시 */}
      {isHovered && (
        <Html position={[0, 1.5, 0]} center>
          <div style={{
            background: `linear-gradient(45deg, ${stationColor}80, ${stationColor}40)`,
            border: `2px solid ${stationColor}`,
            color: METRO_COLORS.text,
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 'bold',
            textAlign: 'center',
            minWidth: '80px',
            backdropFilter: 'blur(10px)',
            boxShadow: `0 0 20px ${stationColor}40`
          }}>
            <div>{station.name}</div>
            <div style={{ fontSize: '8px', opacity: 0.8 }}>{station.id}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// 로봇 컴포넌트
function MetroRobot({ robot, isSelected = false, onHover, onHoverEnd }) {
  const meshRef = useRef();
  const pulseRef = useRef();
  const pulseRef2 = useRef();
  const { camera, gl } = useThree();
  const [isHovered, setIsHovered] = useState(false);
  
  // 사이드바와 동일한 상태 색상 매핑
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'moving': return METRO_COLORS.moving;
      case 'charging': return METRO_COLORS.charging;
      case 'error': return METRO_COLORS.error;
      case 'working': return METRO_COLORS.working;
      case 'idle':
      default: return METRO_COLORS.idle;
    }
  };
  
  const statusColor = getStatusColor(robot.status);

  // 레이더 스캔 효과 (강화됨)
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (pulseRef.current) {
      // 첫 번째 레이더 웨이브 (중심에서 바깥으로 퍼져나감)
      const wave1Progress = (time * 1.5) % 3; // 3초마다 반복
      const scale1 = 0.1 + wave1Progress * 0.6; // 더 크게 확장
      const opacity1 = Math.max(0, 0.8 - wave1Progress * 0.25); // 더 진한 시작점
      
      pulseRef.current.scale.setScalar(scale1);
      pulseRef.current.material.opacity = opacity1;
    }
    
    if (pulseRef2.current) {
      // 두 번째 레이더 웨이브 (첫 번째와 1초 차이)
      const wave2Progress = ((time * 1.5) + 1.5) % 3; // 1.5초 지연
      const scale2 = 0.1 + wave2Progress * 0.5;
      const opacity2 = Math.max(0, 0.6 - wave2Progress * 0.2); // 더 진한 시작점
      
      pulseRef2.current.scale.setScalar(scale2);
      pulseRef2.current.material.opacity = opacity2;
    }
    
    // 선택된 로봇은 더 빠른 스캔
    if (isSelected) {
      if (pulseRef.current) {
        const fastWave = (time * 2.5) % 3;
        const fastScale = 0.1 + fastWave * 0.8; // 선택시 더 크게
        const fastOpacity = Math.max(0, 0.9 - fastWave * 0.3); // 선택시 더 진하게
        
        pulseRef.current.scale.setScalar(fastScale);
        pulseRef.current.material.opacity = fastOpacity;
      }
    }
  });

  useEffect(() => {
    const updateTooltipPosition = () => {
      if (isHovered && meshRef.current) {
        const vector = new THREE.Vector3();
        meshRef.current.getWorldPosition(vector);
        
        // 로봇 위치를 화면 좌표로 변환
        vector.project(camera);
        
        // Canvas의 실제 위치와 크기 가져오기
        const canvas = gl.domElement;
        const rect = canvas.getBoundingClientRect();
        
        // 정확한 화면 좌표 계산
        const x = rect.left + (vector.x * 0.5 + 0.5) * rect.width;
        const y = rect.top + (vector.y * -0.5 + 0.5) * rect.height;
        
        console.log(`Robot ${robot.id} hover position:`, { x, y });
        onHover && onHover(robot, { x, y });
      }
    };

    if (isHovered) {
      console.log(`Robot ${robot.id} hover started`);
      updateTooltipPosition();
      const interval = setInterval(updateTooltipPosition, 16);
      return () => {
        console.log(`Robot ${robot.id} hover ended`);
        clearInterval(interval);
      };
    }
  }, [isHovered, camera, gl.domElement, robot, onHover]);

  useEffect(() => {
    if (!isHovered) {
      console.log(`Robot ${robot.id} hover ended - calling onHoverEnd`);
      onHoverEnd && onHoverEnd(robot.id);
    }
  }, [isHovered, robot.id, onHoverEnd]);

  const handlePointerEnter = useCallback(() => {
    console.log(`Pointer enter on robot ${robot.id}`);
    setIsHovered(true);
  }, [robot.id]);

  const handlePointerLeave = useCallback(() => {
    console.log(`Pointer leave on robot ${robot.id}`);
    setIsHovered(false);
  }, [robot.id]);
  
  return (
    <group position={[robot.location_x, 0.1, robot.location_y]}>
      {/* 첫 번째 레이더 웨이브 링 (로봇 높이 중간) - 글로우 효과 */}
      <mesh 
        ref={pulseRef}
        position={[0, 0.05, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.1, 0.2, 32]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* 두 번째 레이더 웨이브 링 (로봇 높이 중간) - 글로우 효과 */}
      <mesh 
        ref={pulseRef2}
        position={[0, 0.06, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.05, 0.08, 32]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* 로봇 본체 (구 형태, 1/10 크기) */}
      <mesh 
        ref={meshRef}
        position={[0, 0.1, 0]}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.4}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      
      {/* 선택 표시 - 강화된 글로우 */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.3, 32]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={0.8}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}
    </group>
  );
}

// 경로 트레일 컴포넌트
function PathTrail({ path, color }) {
  if (!path || !Array.isArray(path) || path.length < 2) {
    console.warn('PathTrail: Invalid path data', { path, pathLength: path?.length });
    return null;
  }
  
  // 유효한 점들만 필터링
  const validPath = path.filter(point => {
    if (!Array.isArray(point) || point.length < 2) return false;
    const [x, y] = point;
    return typeof x === 'number' && typeof y === 'number' && 
           !isNaN(x) && !isNaN(y) && 
           isFinite(x) && isFinite(y);
  });
  
  if (validPath.length < 2) {
    console.warn('PathTrail: Not enough valid points', { validPoints: validPath.length });
    return null;
  }
  
  try {
    const points = validPath.map(([x, y]) => new THREE.Vector3(x, 0.2, y));
    
    // 포인트 배열 유효성 재검사
    const validPoints = points.filter(point => 
      !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
      isFinite(point.x) && isFinite(point.y) && isFinite(point.z)
    );

    if (validPoints.length < 2) {
      console.warn('PathTrail: Not enough valid Vector3 points', { validPoints: validPoints.length });
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

// 연결 경로 렌더링 컴포넌트
function ConnectionPath({ path }) {
  if (!path || !path.points || !Array.isArray(path.points)) {
    console.warn('ConnectionPath: Invalid path data', path);
    return null;
  }

  // 유효한 점들만 필터링
  const validPoints = path.points.filter(point => {
    if (!Array.isArray(point) || point.length < 2) return false;
    const [x, y] = point;
    return typeof x === 'number' && typeof y === 'number' && 
           !isNaN(x) && !isNaN(y) && 
           isFinite(x) && isFinite(y);
  });
  
  // 최소 2개의 점이 있어야 라인을 그릴 수 있음
  if (validPoints.length < 2) {
    console.warn('ConnectionPath: Not enough valid points', { validPoints: validPoints.length });
    return null;
  }
  
  try {
    const points = validPoints.map(([x, y]) => new THREE.Vector3(x, 0.05, y));
    
    // 포인트 배열 유효성 재검사
    const validVectors = points.filter(point => 
      !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
      isFinite(point.x) && isFinite(point.y) && isFinite(point.z)
    );

    if (validVectors.length < 2) {
      console.warn('ConnectionPath: Not enough valid Vector3 points', { validVectors: validVectors.length });
      return null;
    }
    
    return (
      <Line
        points={validVectors}
        color={path.color || '#FFFFFF'}
        lineWidth={2}
        segments={true}
        transparent={true}
        opacity={0.8}
      />
    );
  } catch (error) {
    console.error('ConnectionPath: Error creating line', error);
    return null;
  }
}

// 단순한 그리드
function MetroGrid() {
  return (
    <group>
      {/* 메인 바닥 - 맵 크기에 맞게 확대 */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[800, 800]} />
        <meshBasicMaterial color={METRO_COLORS.background} />
      </mesh>
      
      {/* 더 촘촘한 그리드 라인 (10배 더 세밀) */}
      <gridHelper args={[800, 400, METRO_COLORS.grid, METRO_COLORS.grid]} opacity={0.6} />
      
      {/* 보조 미세 그리드 (더 촘촘한 격자) */}
      <gridHelper args={[800, 1600, '#2a2a3a', '#2a2a3a']} opacity={0.3} />
    </group>
  );
}

// 개선된 고정 크기 툴팁 컴포넌트
function FixedTooltip({ robot, position, visible }) {
  if (!visible || !position || !robot) return null;

  // 사이드바와 동일한 상태 색상 매핑
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'moving': return METRO_COLORS.moving;
      case 'charging': return METRO_COLORS.charging;
      case 'error': return METRO_COLORS.error;
      case 'working': return METRO_COLORS.working;
      case 'idle':
      default: return METRO_COLORS.idle;
    }
  };

  const statusColor = getStatusColor(robot.status);

  const safeBattery = robot.battery || 0;
  const safeName = robot.name || robot.id || 'Unknown';
  const safeId = robot.id || 'Unknown';
  const safeMission = robot.currentMission || '상태 정보 없음';
  const safeLocationX = robot.location_x || 0;
  const safeLocationY = robot.location_y || 0;
  const safeSpeed = robot.speed || 0;

  // 툴팁 내용에 따른 대략적인 높이 계산
  const baseHeight = 120;
  const missionHeight = 30;
  const locationHeight = 20;
  const destinationHeight = robot.destination ? 20 : 0;
  const speedHeight = safeSpeed > 0 ? 20 : 0;
  const estimatedHeight = baseHeight + missionHeight + locationHeight + destinationHeight + speedHeight;

  // 툴팁을 로봇 위쪽에 완전히 표시하기 위해 높이만큼 위로 이동
  const adjustedPosition = {
    x: position.x,
    y: position.y - estimatedHeight - 30
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      left: adjustedPosition.x,
      top: adjustedPosition.y,
      transform: 'translateX(-50%)',
      zIndex: 10000,
      pointerEvents: 'none',
      userSelect: 'none'
    }}>
      {/* 메인 툴팁 박스 */}
      <div style={{
        background: '#1a1a1a',
        border: `2px solid ${statusColor}`,
        borderRadius: '16px',
        color: '#ffffff',
        padding: '20px 24px 24px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        textAlign: 'left',
        width: '320px',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 0 20px ${statusColor}40, 0 4px 12px rgba(0,0,0,0.3)`,
        position: 'relative'
      }}>
        {/* 아래쪽 중앙 테두리 제거용 박스 */}
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '34px',
          height: '4px',
          background: '#1a1a1a'
        }}></div>

        {/* 로봇 헤더 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid #333333`
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
            color: '#ffffff'
          }}>
            {robot.status === 'moving' ? '▶' :
             robot.status === 'charging' ? '⚡' :
             robot.status === 'error' ? '✕' : '⏸'}
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
              {safeName}
            </div>
            <div style={{ fontSize: '13px', color: '#cccccc' }}>
              {safeId}
            </div>
          </div>
          {/* 배터리 표시 */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '12px',
              backgroundColor: '#333333',
              borderRadius: '3px',
              position: 'relative',
              border: '1px solid #555555'
            }}>
              <div style={{
                width: `${safeBattery}%`,
                height: '100%',
                backgroundColor: safeBattery > 50 ? '#4ade80' :
                               safeBattery > 20 ? '#fbbf24' : '#ef4444',
                borderRadius: '2px'
              }}></div>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
              {safeBattery}%
            </span>
          </div>
        </div>

        {/* 현재 상태 */}
        <div style={{
          fontSize: '14px',
          marginBottom: '10px',
          color: '#e5e5e5'
        }}>
          {safeMission}
        </div>

        {/* 상세 정보 */}
        <div style={{ fontSize: '13px', color: '#cccccc' }}>
          <div style={{ marginBottom: '6px' }}>
            위치: ({safeLocationX}, {safeLocationY})
          </div>
          
          {robot.destination && (
            <div style={{ marginBottom: '6px' }}>
              목적지: {robot.destination}
            </div>
          )}
          
          {safeSpeed > 0 && (
            <div>
              속도: {safeSpeed} m/s
            </div>
          )}
        </div>
      </div>

      {/* 연결된 말풍선 꼬리 */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%) translateY(-4px)',
        width: '0',
        height: '0',
        borderLeft: '16px solid transparent',
        borderRight: '16px solid transparent',
        borderTop: `20px solid ${statusColor}`,
        filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))`
      }}></div>
      
      {/* 내부 배경 삼각형 */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%) translateY(-2px)',
        width: '0',
        height: '0',
        borderLeft: '13px solid transparent',
        borderRight: '13px solid transparent',
        borderTop: '17px solid #1a1a1a'
      }}></div>
    </div>,
    document.body
  );
}

// 메인 Scene3D 컴포넌트
const Scene3D = ({ 
  robots = [], 
  missions = [], 
  viewMode = 'overview', 
  selectedRobot = null,
  showPaths = true,
  showStations = true,
  showGrid = true,
  showLabels = false,
  zoomLevel = 1,
  trackedRobot = null,
  mapData = null,
  showMapData = false
}) => {
  const [activeLines, setActiveLines] = useState(['line1', 'line2']);
  const [tooltipData, setTooltipData] = useState({ robot: null, position: null, visible: false });
  
  // 서버에서 받은 실제 로봇 데이터 사용
  const activeRobots = robots || [];

  // 추적 중인 로봇 찾기
  const trackedRobotData = activeRobots.find(robot => robot.id === trackedRobot);
  
  // 카메라 설정 변경 감지를 위한 로그
  useEffect(() => {
    console.log('Scene3D props updated:', { 
      viewMode, 
      zoomLevel, 
      trackedRobot: trackedRobotData?.id,
      showMapData,
      mapData: mapData ? { id: mapData.map?.id, name: mapData.map?.name } : null
    });
  }, [viewMode, zoomLevel, trackedRobotData, showMapData, mapData]);

  const handleRobotHover = useCallback((robot, position) => {
    console.log(`Main component - Robot ${robot.id} hover with position:`, position);
    setTooltipData({ robot, position, visible: true });
  }, []);

  const handleRobotHoverEnd = useCallback((robotId) => {
    console.log(`Main component - Robot ${robotId} hover end`);
    // 현재 표시중인 툴팁이 해당 로봇의 것인 경우에만 숨김
    setTooltipData(prev => {
      if (prev.robot && prev.robot.id === robotId) {
        return { robot: null, position: null, visible: false };
      }
      return prev;
    });
  }, []);

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
          background: `radial-gradient(circle at center, ${METRO_COLORS.background} 0%, #000000 100%)`
        }}
      >
        {/* 조명 설정 */}
        <ambientLight intensity={0.4} color={METRO_COLORS.glow} />
        <pointLight position={[0, 30, 0]} intensity={0.6} color={METRO_COLORS.glow} />
        <pointLight position={[20, 20, 20]} intensity={0.3} color={METRO_COLORS.line1} />
        <pointLight position={[-20, 20, -20]} intensity={0.3} color={METRO_COLORS.line2} />

        {/* 배경 그리드 */}
        {showGrid && <MetroGrid />}

        {/* 맵 데이터가 있을 때는 실제 맵 렌더링, 없을 때는 기본 지하철 노선도 */}
        {showMapData && mapData ? (
          <MapRenderer3D 
            mapData={mapData}
            showTexture={true}
            showNodes={true}
            showConnections={true}
            selectedNode={null}
            onNodeHover={null}
            onNodeHoverEnd={null}
          />
        ) : (
          <>
            {/* 지하철 노선들 */}
            {showPaths && METRO_LINES.map(line => (
              <MetroLine 
                key={line.id} 
                line={line} 
                isActive={activeLines.includes(line.id)}
              />
            ))}

            {/* 연결 경로 */}
            {showPaths && CONNECTION_PATHS.map((path, index) => (
              <ConnectionPath 
                key={`connection-${index}`}
                path={path}
              />
            ))}

            {/* 스테이션들 */}
            {showStations && METRO_STATIONS.map(station => (
              <MetroStation 
                key={station.id} 
                station={station}
                isSelected={false}
              />
            ))}
          </>
        )}

        {/* 로봇들 */}
        {activeRobots.map(robot => (
          <MetroRobot 
            key={robot.id} 
            robot={robot}
            isSelected={selectedRobot === robot.id}
            onHover={handleRobotHover}
            onHoverEnd={handleRobotHoverEnd}
          />
        ))}

        {/* 로봇 경로 트레일 */}
        {showPaths && activeRobots.map(robot => (
          robot.path && robot.path.length > 0 && (
            <PathTrail 
              key={`trail-${robot.id}`}
              path={robot.path}
              color={robot.status === 'moving' ? METRO_COLORS.active : METRO_COLORS.idle}
            />
          )
        ))}

        {/* 카메라 컨트롤 및 애니메이션 컨트롤러 */}
        <CameraController 
          viewMode={viewMode}
          zoomLevel={zoomLevel}
          trackedRobot={trackedRobotData}
          duration={1.0}
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
      </Canvas>

      {/* 개선된 툴팁 */}
      <FixedTooltip 
        robot={tooltipData.robot}
        position={tooltipData.position}
        visible={tooltipData.visible}
      />
    </>
  );
};

export default Scene3D; 
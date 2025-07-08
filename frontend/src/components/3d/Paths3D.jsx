import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Vector3 } from 'three';
import { Line } from '@react-three/drei';

const Paths3D = ({ paths }) => {
  // paths가 유효한지 확인
  if (!paths || !Array.isArray(paths)) {
    console.warn('Paths3D: Invalid paths data', paths);
    return null;
  }

  return (
    <>
      {paths.map((path, index) => (
        <TeslaPathLine key={path.id || index} path={path} />
      ))}
    </>
  );
};

const TeslaPathLine = ({ path }) => {
  const flowRef = useRef();
  const pulseRef = useRef();

  // path 유효성 검사
  if (!path || !path.points || !Array.isArray(path.points)) {
    console.warn('TeslaPathLine: Invalid path data', path);
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

  if (validPoints.length < 2) {
    console.warn('TeslaPathLine: Not enough valid points', { validPoints: validPoints.length });
    return null;
  }

  // 3D 좌표로 변환 (약간 높이 추가)
  const points = validPoints.map(point => new Vector3(point[0], 0.15, point[1]));
  
  // 부드러운 곡선 생성
  let curve, curvePoints;
  try {
    curve = new CatmullRomCurve3(points);
    curvePoints = curve.getPoints(100);
    
    // 곡선 포인트 유효성 검사
    curvePoints = curvePoints.filter(point => 
      !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
      isFinite(point.x) && isFinite(point.y) && isFinite(point.z)
    );
    
    if (curvePoints.length < 2) {
      console.warn('TeslaPathLine: Not enough valid curve points');
      return null;
    }
  } catch (error) {
    console.error('TeslaPathLine: Error creating curve', error);
    return null;
  }

  const getPathTypeColor = (type) => {
    switch (type) {
      case 'current': return '#00ff88';
      case 'planned': return '#ffa502';
      case 'default': return '#00d4ff';
      default: return path.color || '#00d4ff';
    }
  };

  const getPathIntensity = (type) => {
    switch (type) {
      case 'current': return 1.0;
      case 'planned': return 0.6;
      case 'default': return 0.4;
      default: return 0.5;
    }
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // 에너지 플로우 애니메이션
    if (flowRef.current) {
      flowRef.current.material.opacity = 0.3 + Math.sin(time * 4 + (path.id || 0)) * 0.2;
    }

    // 펄스 효과
    if (pulseRef.current) {
      const scale = 1 + Math.sin(time * 3 + (path.id || 0) * 2) * 0.2;
      pulseRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* 메인 경로 라인 - @react-three/drei의 Line 컴포넌트 사용 */}
      <Line
        points={curvePoints}
        color={getPathTypeColor(path.type)}
        lineWidth={2}
        transparent
        opacity={getPathIntensity(path.type)}
      />

      {/* 에너지 플로우 라인 (더 두꺼운 내부 라인) */}
      <Line
        ref={flowRef}
        points={curvePoints.map(p => new Vector3(p.x, p.y + 0.02, p.z))}
        color={getPathTypeColor(path.type)}
        lineWidth={1}
        transparent
        opacity={0.8}
      />

      {/* 경로 포인트 - 테슬라 스타일 노드 */}
      {validPoints.map((point, index) => (
        <group key={index} position={[point[0], 0, point[1]]}>
          {/* 메인 노드 */}
          <mesh 
            ref={index === 0 ? pulseRef : null}
            position={[0, 0.1, 0]}
          >
            <octahedronGeometry args={[0.15, 0]} />
            <meshBasicMaterial 
              color={getPathTypeColor(path.type)}
              emissive={getPathTypeColor(path.type)}
              emissiveIntensity={0.3}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* 노드 글로우 */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.3, 16]} />
            <meshBasicMaterial 
              color={getPathTypeColor(path.type)} 
              transparent 
              opacity={0.2}
            />
          </mesh>

          {/* 시작점/끝점 특별 표시 */}
          {(index === 0 || index === validPoints.length - 1) && (
            <>
              {/* 특별 링 */}
              <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.4, 0.6, 16]} />
                <meshBasicMaterial 
                  color={index === 0 ? '#00ff88' : '#ff4757'} 
                  transparent 
                  opacity={0.6}
                />
              </mesh>
              
              {/* 방향 표시 화살표 */}
              {index === 0 && validPoints.length > 1 && (
                <mesh 
                  position={[0, 0.3, 0]}
                  rotation={[0, Math.atan2(
                    validPoints[1][1] - point[1], 
                    validPoints[1][0] - point[0]
                  ), 0]}
                >
                  <coneGeometry args={[0.1, 0.4, 4]} />
                  <meshBasicMaterial 
                    color="#00ff88"
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              )}
            </>
          )}

          {/* 포인트 라이트 */}
          <pointLight
            position={[0, 0.5, 0]}
            intensity={0.4}
            color={getPathTypeColor(path.type)}
            distance={2}
            decay={2}
          />
        </group>
      ))}

      {/* 경로 타입 표시기 (첫 번째 포인트 위) */}
      {validPoints.length > 0 && (
        <mesh position={[validPoints[0][0], 1.5, validPoints[0][1]]}>
          <planeGeometry args={[1, 0.3]} />
          <meshBasicMaterial 
            color={getPathTypeColor(path.type)}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* 데이터 플로우 파티클 (현재 경로일 때만) */}
      {path.type === 'current' && curvePoints.length > 10 && (
        <>
          {[0, 0.2, 0.4, 0.6, 0.8].map(offset => {
            const index = Math.floor((curvePoints.length - 1) * offset);
            const point = curvePoints[index];
            return (
              <mesh key={offset} position={[point.x, point.y + 0.1, point.z]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial 
                  color="#00ff88"
                  emissive="#00ff88"
                  emissiveIntensity={0.5}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
};

export default Paths3D; 
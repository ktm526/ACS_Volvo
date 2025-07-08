import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Vector3 } from 'three';

const Paths3D = ({ paths }) => {
  return (
    <>
      {paths.map(path => (
        <TeslaPathLine key={path.id} path={path} />
      ))}
    </>
  );
};

const TeslaPathLine = ({ path }) => {
  const flowRef = useRef();
  const pulseRef = useRef();

  // 3D 좌표로 변환 (약간 높이 추가)
  const points = path.points.map(point => new Vector3(point[0], 0.15, point[1]));
  
  // 부드러운 곡선 생성
  const curve = new CatmullRomCurve3(points);
  const curvePoints = curve.getPoints(100);

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
      flowRef.current.material.opacity = 0.3 + Math.sin(time * 4 + path.id) * 0.2;
    }

    // 펄스 효과
    if (pulseRef.current) {
      const scale = 1 + Math.sin(time * 3 + path.id * 2) * 0.2;
      pulseRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* 메인 경로 라인 - 글로우 효과 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(curvePoints.flatMap(p => [p.x, p.y, p.z]))}
            count={curvePoints.length}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color={getPathTypeColor(path.type)} 
          opacity={getPathIntensity(path.type)}
          transparent
        />
      </line>

      {/* 에너지 플로우 라인 (더 두꺼운 내부 라인) */}
      <line ref={flowRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(curvePoints.flatMap(p => [p.x, p.y + 0.02, p.z]))}
            count={curvePoints.length}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color={getPathTypeColor(path.type)} 
          opacity={0.8}
          transparent
        />
      </line>

      {/* 경로 포인트 - 테슬라 스타일 노드 */}
      {path.points.map((point, index) => (
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
          {(index === 0 || index === path.points.length - 1) && (
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
              {index === 0 && path.points.length > 1 && (
                <mesh 
                  position={[0, 0.3, 0]}
                  rotation={[0, Math.atan2(
                    path.points[1][1] - point[1], 
                    path.points[1][0] - point[0]
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
      {path.points.length > 0 && (
        <mesh position={[path.points[0][0], 1.5, path.points[0][1]]}>
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
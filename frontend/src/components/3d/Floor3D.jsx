import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const Floor3D = () => {
  const gridRef = useRef();
  const scanLineRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // 스캔 라인 애니메이션
    if (scanLineRef.current) {
      scanLineRef.current.position.x = -15 + ((time * 2) % 30);
      scanLineRef.current.material.opacity = 0.3 + Math.sin(time * 4) * 0.2;
    }
  });

  return (
    <group>
      {/* 메인 바닥 - 테슬라 스타일 다크 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial 
          color="#050505"
          metalness={0.9}
          roughness={0.8}
          transparent 
          opacity={0.9}
        />
      </mesh>

      {/* 중앙 플랫폼 */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8, 32]} />
        <meshBasicMaterial 
          color="#00d4ff"
          transparent 
          opacity={0.1}
        />
      </mesh>

      {/* 스캔 라인 */}
      <mesh 
        ref={scanLineRef}
        position={[-15, 0.01, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.2, 40]} />
        <meshBasicMaterial 
          color="#00d4ff"
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* 테슬라 스타일 그리드 */}
      <TeslaGrid />
      
      {/* 에너지 노드들 */}
      <EnergyNodes />
    </group>
  );
};

const TeslaGrid = () => {
  const gridSize = 40;
  const majorStep = 4;
  const minorStep = 1;

  const majorLines = [];
  const minorLines = [];

  // 주요 그리드 라인 (밝은 시안색)
  for (let i = -gridSize/2; i <= gridSize/2; i += majorStep) {
    // 세로 라인
    majorLines.push(
      <line key={`major-v-${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([
              i, 0.02, -gridSize / 2,
              i, 0.02, gridSize / 2
            ])}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00d4ff" opacity={0.6} transparent />
      </line>
    );
    
    // 가로 라인
    majorLines.push(
      <line key={`major-h-${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([
              -gridSize / 2, 0.02, i,
              gridSize / 2, 0.02, i
            ])}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00d4ff" opacity={0.6} transparent />
      </line>
    );
  }

  // 보조 그리드 라인 (어두운 시안색)
  for (let i = -gridSize/2; i <= gridSize/2; i += minorStep) {
    if (i % majorStep !== 0) {
      // 세로 라인
      minorLines.push(
        <line key={`minor-v-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array([
                i, 0.01, -gridSize / 2,
                i, 0.01, gridSize / 2
              ])}
              count={2}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00d4ff" opacity={0.15} transparent />
        </line>
      );
      
      // 가로 라인
      minorLines.push(
        <line key={`minor-h-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array([
                -gridSize / 2, 0.01, i,
                gridSize / 2, 0.01, i
              ])}
              count={2}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00d4ff" opacity={0.15} transparent />
        </line>
      );
    }
  }

  return (
    <>
      {majorLines}
      {minorLines}
    </>
  );
};

const EnergyNodes = () => {
  const nodePositions = [
    [-10, 0, -10], [10, 0, -10], [-10, 0, 10], [10, 0, 10],
    [-5, 0, -15], [5, 0, -15], [-15, 0, -5], [15, 0, -5],
    [0, 0, -12], [0, 0, 12], [-12, 0, 0], [12, 0, 0]
  ];

  return (
    <>
      {nodePositions.map((pos, index) => (
        <group key={index} position={pos}>
          {/* 노드 베이스 */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.3, 0.4, 0.1, 8]} />
            <meshBasicMaterial 
              color="#00d4ff"
              emissive="#00d4ff"
              emissiveIntensity={0.2}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* 에너지 펄스 */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.7, 16]} />
            <meshBasicMaterial 
              color="#00d4ff" 
              transparent 
              opacity={0.3}
            />
          </mesh>
          
          {/* 포인트 라이트 */}
          <pointLight
            position={[0, 0.5, 0]}
            intensity={0.3}
            color="#00d4ff"
            distance={3}
            decay={2}
          />
        </group>
      ))}
    </>
  );
};

export default Floor3D; 
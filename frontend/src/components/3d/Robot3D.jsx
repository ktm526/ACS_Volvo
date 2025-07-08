import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

const Robot3D = ({ 
  robot, 
  hoveredRobot, 
  setHoveredRobot, 
  showLabel = false, 
  brandColors,
  isSelected = false 
}) => {
  const meshRef = useRef();
  const glowRef = useRef();
  const indicatorRef = useRef();
  const trailRef = useRef();
  const shieldRef = useRef();

  const getStatusColor = (status) => {
    switch (status) {
      case 'moving': return brandColors?.primary || '#007AFF';
      case 'idle': return brandColors?.success || '#34C759';
      case 'error': return brandColors?.error || '#FF3B30';
      case 'charging': return brandColors?.warning || '#FF9F0A';
      default: return brandColors?.accent || '#00D4FF';
    }
  };

  const getBatteryColor = (battery) => {
    if (battery > 70) return brandColors?.success || '#34C759';
    if (battery > 30) return brandColors?.warning || '#FF9F0A';
    return brandColors?.error || '#FF3B30';
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const isHovered = hoveredRobot?.id === robot.id;
    
    if (meshRef.current) {
      // 선택된 로봇 특별 효과
      if (isSelected) {
        meshRef.current.position.y = 1.2 + Math.sin(time * 4) * 0.15;
        meshRef.current.scale.setScalar(1.1 + Math.sin(time * 3) * 0.05);
      } else if (isHovered) {
        meshRef.current.position.y = 1 + Math.sin(time * 6) * 0.1;
        meshRef.current.scale.setScalar(1.05 + Math.sin(time * 4) * 0.03);
      } else {
        meshRef.current.position.y = 1;
        meshRef.current.scale.setScalar(1);
      }
      
      // 부드러운 회전 (이동 중일 때)
      if (robot.status === 'moving') {
        meshRef.current.rotation.y = time * 2;
      }
    }

    // 홀로그램 실드 애니메이션
    if (shieldRef.current) {
      shieldRef.current.rotation.y = time * 0.5;
      shieldRef.current.rotation.z = time * 0.3;
      shieldRef.current.material.opacity = isSelected ? 
        0.4 + Math.sin(time * 4) * 0.2 : 
        0.2 + Math.sin(time * 2) * 0.1;
    }

    // 글로우 트레일 애니메이션
    if (trailRef.current) {
      trailRef.current.rotation.z = -time * 1.5;
      trailRef.current.material.opacity = robot.status === 'moving' ? 
        0.5 + Math.sin(time * 3) * 0.2 : 0.2;
    }

    // 상태 인디케이터 스마트 펄스
    if (indicatorRef.current) {
      const pulseSpeed = robot.status === 'moving' ? 5 : robot.status === 'error' ? 8 : 3;
      const intensity = robot.status === 'error' ? 0.9 : 0.6;
      indicatorRef.current.material.emissiveIntensity = 
        intensity + Math.sin(time * pulseSpeed) * 0.4;
    }
  });

  return (
    <group position={[robot.location_x, 0, robot.location_y]}>
      {/* 네비게이션 베이스 - 첨단 플랫폼 */}
      <Cylinder 
        args={[1.2, 1.5, 0.3, 16]} 
        position={[0, 0.15, 0]}
      >
        <meshStandardMaterial 
          color={brandColors?.dark || '#1C1C1E'}
          emissive={getStatusColor(robot.status)}
          emissiveIntensity={0.1}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </Cylinder>

      {/* 메인 로봇 바디 - 미래형 캡슐 */}
      <mesh
        ref={meshRef}
        position={[0, 1, 0]}
        onPointerOver={() => setHoveredRobot(robot)}
        onPointerOut={() => setHoveredRobot(null)}
      >
        <capsuleGeometry args={[0.5, 0.8, 4, 16]} />
        <meshStandardMaterial 
          color={getStatusColor(robot.status)}
          emissive={getStatusColor(robot.status)}
          emissiveIntensity={isSelected ? 0.4 : 0.2}
          metalness={0.8}
          roughness={0.1}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* 중앙 AI 코어 */}
      <Sphere args={[0.2]} position={[0, 1, 0]}>
        <meshBasicMaterial 
          color={brandColors?.glow || '#00FFFF'}
          emissive={brandColors?.glow || '#00FFFF'}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* 홀로그램 보호 실드 */}
      <mesh 
        ref={shieldRef}
        position={[0, 1, 0]}
      >
        <icosahedronGeometry args={[0.8, 1]} />
        <meshBasicMaterial 
          color={brandColors?.accent || '#00D4FF'}
          transparent 
          opacity={0.2}
          wireframe
        />
      </mesh>

      {/* 에너지 트레일 링 */}
      <mesh 
        ref={trailRef}
        position={[0, 0.1, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.3, 1.8, 32]} />
        <meshBasicMaterial 
          color={getStatusColor(robot.status)} 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 네비게이션 그리드 투영 */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial 
          color={getStatusColor(robot.status)} 
          transparent 
          opacity={0.15} 
        />
      </mesh>

      {/* 스마트 배터리 인디케이터 */}
      <group position={[0, 1.8, 0]}>
        {/* 홀로그램 배터리 틀 */}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
          <meshBasicMaterial 
            color={brandColors?.surface || '#2C2C2E'} 
            transparent 
            opacity={0.8} 
          />
        </mesh>
        
        {/* 에너지 레벨 */}
        <mesh position={[0, (-0.6 + (robot.battery / 100) * 0.6) / 2, 0]}>
          <cylinderGeometry args={[0.06, 0.06, (robot.battery / 100) * 0.6, 8]} />
          <meshBasicMaterial 
            color={getBatteryColor(robot.battery)}
            emissive={getBatteryColor(robot.battery)}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* 배터리 캡 */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
          <meshBasicMaterial 
            color={getBatteryColor(robot.battery)}
            emissive={getBatteryColor(robot.battery)}
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* AI 상태 인디케이터 */}
      <mesh 
        ref={indicatorRef}
        position={[0, 2.2, 0]}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial 
          color={getStatusColor(robot.status)}
          emissive={getStatusColor(robot.status)}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 방향 벡터 (이동 중일 때) */}
      {robot.status === 'moving' && (
        <group>
          <mesh position={[0, 1, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.15, 0.8, 6]} />
            <meshBasicMaterial 
              color={getStatusColor(robot.status)}
              emissive={getStatusColor(robot.status)}
              emissiveIntensity={0.6}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* 속도 트레일 */}
          {[0.3, 0.6, 0.9].map((z, i) => (
            <mesh key={i} position={[0, 1, -z]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.1 - i * 0.02, 0.3, 4]} />
              <meshBasicMaterial 
                color={getStatusColor(robot.status)}
                transparent
                opacity={0.4 - i * 0.1}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 네비게이션 ID 홀로그램 */}
      {showLabel && (
        <Html
          position={[0, 2.5, 0]}
          center
          transform={false}
          sprite={true}
          style={{
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${getStatusColor(robot.status)}22, ${getStatusColor(robot.status)}44)`,
              border: `1px solid ${getStatusColor(robot.status)}`,
              borderRadius: '8px',
              padding: '4px 8px',
              color: getStatusColor(robot.status),
              fontSize: '12px',
              fontFamily: 'SF Pro Display, -apple-system, sans-serif',
              fontWeight: '600',
              textAlign: 'center',
              textShadow: `0 0 8px ${getStatusColor(robot.status)}`,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 0 20px ${getStatusColor(robot.status)}33`,
              opacity: hoveredRobot?.id === robot.id || isSelected ? 1 : 0.8,
              transform: `scale(${isSelected ? 1.1 : 1})`,
              transition: 'all 0.3s ease'
            }}
          >
            <div>{robot.id}</div>
            <div style={{ 
              fontSize: '10px', 
              opacity: 0.8, 
              marginTop: '2px',
              color: getBatteryColor(robot.battery)
            }}>
              {robot.battery}% | {robot.status}
            </div>
          </div>
        </Html>
      )}

      {/* 선택 효과 링 */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2, 2.3, 32]} />
          <meshBasicMaterial 
            color={brandColors?.accent || '#00D4FF'}
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default Robot3D; 
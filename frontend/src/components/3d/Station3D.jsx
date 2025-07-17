import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext } from '../../contexts/AppContext';

const Station3D = ({ station, isSelected = false, brandColors }) => {
  const { theme } = useAppContext();
  const meshRef = useRef();
  const glowRef = useRef();
  const beaconRef = useRef();
  const energyRef = useRef();

  const getStationColor = (type) => {
    switch (type) {
      case 'charging': return brandColors?.warning || '#FF9F0A';
      case 'loading': return brandColors?.secondary || '#5AC8FA';
      case 'unloading': return brandColors?.success || '#34C759';
      case 'maintenance': return brandColors?.error || '#FF3B30';
      default: return brandColors?.primary || '#007AFF';
    }
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      // 선택된 스테이션 특별 효과
      if (isSelected) {
        meshRef.current.position.y = 1 + Math.sin(time * 3) * 0.1;
        meshRef.current.scale.setScalar(1.05 + Math.sin(time * 2) * 0.02);
      } else {
        meshRef.current.position.y = 1;
        meshRef.current.scale.setScalar(1);
      }
    }

    // 에너지 비콘 애니메이션
    if (beaconRef.current) {
      beaconRef.current.rotation.y = time * 1.5;
      beaconRef.current.material.emissiveIntensity = 
        0.5 + Math.sin(time * 4) * 0.3;
    }

    // 글로우 링 애니메이션
    if (glowRef.current) {
      glowRef.current.rotation.z = time * 0.8;
      glowRef.current.material.opacity = 
        0.4 + Math.sin(time * 2.5) * 0.2;
    }

    // 에너지 필드 애니메이션
    if (energyRef.current) {
      energyRef.current.rotation.x = time * 0.3;
      energyRef.current.rotation.z = time * 0.5;
      energyRef.current.material.opacity = 
        isSelected ? 0.3 + Math.sin(time * 3) * 0.15 : 0.15;
    }
  });

  return (
    <group position={[station.x, 0, station.y]}>
      {/* 스테이션 베이스 플랫폼 */}
      <Cylinder 
        args={[2, 2.5, 0.5, 8]} 
        position={[0, 0.25, 0]}
      >
        <meshStandardMaterial 
          color={brandColors?.dark || '#1C1C1E'}
          emissive={getStationColor(station.type)}
          emissiveIntensity={0.1}
          metalness={0.9}
          roughness={0.1}
        />
      </Cylinder>

      {/* 메인 스테이션 타워 */}
      <mesh
        ref={meshRef}
        position={[0, 1, 0]}
      >
        <cylinderGeometry args={[0.8, 1.2, 1.5, 8]} />
        <meshStandardMaterial 
          color={getStationColor(station.type)}
          emissive={getStationColor(station.type)}
          emissiveIntensity={isSelected ? 0.4 : 0.2}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* 에너지 코어 */}
      <Sphere args={[0.3]} position={[0, 1, 0]}>
        <meshBasicMaterial 
          color={brandColors?.glow || '#00FFFF'}
          emissive={brandColors?.glow || '#00FFFF'}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* 홀로그래픽 에너지 필드 */}
      <mesh 
        ref={energyRef}
        position={[0, 1, 0]}
      >
        <icosahedronGeometry args={[1.2, 2]} />
        <meshBasicMaterial 
          color={getStationColor(station.type)}
          transparent 
          opacity={0.15}
          wireframe
        />
      </mesh>

      {/* 스테이션 비콘 */}
      <mesh 
        ref={beaconRef}
        position={[0, 2.2, 0]}
      >
        <coneGeometry args={[0.2, 0.6, 6]} />
        <meshBasicMaterial 
          color={getStationColor(station.type)}
          emissive={getStationColor(station.type)}
          emissiveIntensity={0.6}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 에너지 링 */}
      <mesh 
        ref={glowRef}
        position={[0, 0.1, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[2.5, 3.2, 32]} />
        <meshBasicMaterial 
          color={getStationColor(station.type)} 
          transparent 
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 네비게이션 마커 */}
      {[0, 1, 2, 3].map((i) => (
        <mesh 
          key={i}
          position={[
            Math.sin(i * Math.PI / 2) * 2,
            0.6,
            Math.cos(i * Math.PI / 2) * 2
          ]}
        >
          <boxGeometry args={[0.1, 1.2, 0.1]} />
          <meshBasicMaterial 
            color={getStationColor(station.type)}
            emissive={getStationColor(station.type)}
            emissiveIntensity={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}

      {/* 스테이션 정보 홀로그램 */}
      <Html
        position={[0, 3, 0]}
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
            background: theme === 'dark' 
              ? `linear-gradient(135deg, ${getStationColor(station.type)}22, ${getStationColor(station.type)}44)` 
              : `linear-gradient(135deg, ${getStationColor(station.type)}15, ${getStationColor(station.type)}30)`,
            border: `1px solid ${getStationColor(station.type)}`,
            borderRadius: '8px',
            padding: '6px 10px',
            color: getStationColor(station.type),
            fontSize: '11px',
            fontFamily: 'SF Pro Display, -apple-system, sans-serif',
            fontWeight: '600',
            textAlign: 'center',
            textShadow: theme === 'dark' 
              ? `0 0 8px ${getStationColor(station.type)}` 
              : `0 0 4px ${getStationColor(station.type)}`,
            backdropFilter: 'blur(10px)',
            boxShadow: theme === 'dark' 
              ? `0 0 20px ${getStationColor(station.type)}33` 
              : `0 0 15px ${getStationColor(station.type)}20`,
            opacity: isSelected ? 1 : 0.8,
            transform: `scale(${isSelected ? 1.1 : 1})`,
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ 
            fontWeight: '700', 
            marginBottom: '2px',
            color: theme === 'dark' ? '#ffffff' : '#2c3e50'
          }}>
            {station.name || `Station ${station.id}`}
          </div>
          <div style={{ 
            fontSize: '9px', 
            opacity: 0.8,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: theme === 'dark' ? '#cccccc' : '#6c757d'
          }}>
            {station.type}
          </div>
        </div>
      </Html>

      {/* 선택 효과 */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.5, 4, 32]} />
          <meshBasicMaterial 
            color={brandColors?.accent || '#00D4FF'}
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 환경 조명 */}
      <pointLight
        position={[0, 2, 0]}
        intensity={isSelected ? 2 : 1.2}
        color={getStationColor(station.type)}
        distance={8}
        decay={2}
      />
    </group>
  );
};

export default Station3D; 
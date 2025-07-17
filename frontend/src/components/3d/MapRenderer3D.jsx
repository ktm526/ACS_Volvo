import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Line, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useAppContext } from '../../contexts/AppContext';
import * as THREE from 'three';

// 테슬라 스타일 CSS 애니메이션 추가
const teslaStyleSheet = `
  @keyframes pulse {
    0% { 
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
      border-color: #00FFFF;
    }
    50% { 
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.6);
      border-color: #40FFFF;
    }
    100% { 
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
      border-color: #00FFFF;
    }
  }
  
  @keyframes glow {
    0% { 
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }
    50% { 
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
    }
    100% { 
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }
  }
  
  .tesla-ui {
    font-family: 'Consolas', 'Monaco', 'Lucida Console', monospace;
    letter-spacing: 0.05em;
  }
`;

// 스타일 시트 추가
if (typeof document !== 'undefined' && !document.getElementById('tesla-style')) {
  const style = document.createElement('style');
  style.id = 'tesla-style';
  style.textContent = teslaStyleSheet;
  document.head.appendChild(style);
}

// 맵 이미지 텍스처 렌더링 컴포넌트
function MapTexture({ mapInfo, visible = true }) {
  const meshRef = useRef();
  const [texture, setTexture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { gl } = useThree(); // Three.js 렌더러 인스턴스 접근
  
  useEffect(() => {
    if (!mapInfo || !visible) {
      console.log('MapTexture: mapInfo나 visible이 없음', { mapInfo, visible });
      return;
    }
    
    console.log('MapTexture: 맵 정보 전체:', mapInfo);
    console.log('MapTexture: 맵 ID:', mapInfo.id);
    console.log('MapTexture: 맵 이름:', mapInfo.name);
    
    const processImage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('MapTexture: 이미지 로드 시작', `/api/maps/${mapInfo.id}/download/image`);
        
        // 이미지 파일 로드 (백엔드 서버 URL 사용)
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const imageUrl = `${API_URL}/api/maps/${mapInfo.id}/download/image`;
        console.log('MapTexture: fetch URL:', imageUrl);
        
        const imageResponse = await fetch(imageUrl);
        console.log('MapTexture: fetch 응답:', imageResponse.status, imageResponse.statusText);
        
        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          console.error('MapTexture: fetch 에러 응답:', errorText);
          throw new Error(`이미지 로드 실패: ${imageResponse.status} ${imageResponse.statusText} - ${errorText}`);
        }
        
        const imageBlob = await imageResponse.blob();
        console.log('MapTexture: 이미지 블롭 크기', imageBlob.size);
        
        // 이미지 객체 생성
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          console.log('MapTexture: 이미지 로드 완료', { width: img.width, height: img.height });
          
          // Three.js 텍스처 생성 (고화질 설정)
          const texture = new THREE.Texture(img);
          texture.flipY = false; // Y축 뒤집기 방지
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          
          // 고화질 필터링 설정
          texture.minFilter = THREE.LinearMipmapLinearFilter; // 미프맵 사용으로 화질 향상
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = true; // 미프맵 생성
          
          // 렌더러의 최대 anisotropy 값 사용 (동적 감지)
          texture.anisotropy = gl.capabilities.getMaxAnisotropy();
          
          // 색상 공간 설정
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;
          
          console.log('MapTexture: 고화질 텍스처 생성 완료', { anisotropy: texture.anisotropy });
          setTexture(texture);
          setLoading(false);
        };
        
        img.onerror = (err) => {
          console.error('MapTexture: 이미지 로드 실패', err);
          console.error('MapTexture: 이미지 URL:', img.src);
          setError(`이미지 로드 실패: ${img.src}`);
          setLoading(false);
        };
        
        img.src = URL.createObjectURL(imageBlob);
      } catch (error) {
        console.error('MapTexture: 이미지 처리 중 오류:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    processImage();
  }, [mapInfo, visible, gl]);
  
  if (!visible || !mapInfo) {
    console.log('MapTexture: 렌더링 안함 (visible 또는 mapInfo 없음)');
    return null;
  }
  
  if (loading) {
    console.log('MapTexture: 로딩 중');
    return (
      <Html position={[0, 2, 0]}>
        <div style={{ color: 'white', background: 'rgba(0,0,0,0.8)', padding: '8px', borderRadius: '4px' }}>
          맵 이미지 로딩 중...
        </div>
      </Html>
    );
  }
  
  if (error) {
    console.log('MapTexture: 오류 발생', error);
    return (
      <Html position={[0, 2, 0]}>
        <div style={{ color: 'red', background: 'rgba(0,0,0,0.8)', padding: '8px', borderRadius: '4px' }}>
          맵 이미지 로드 실패: {error}
        </div>
      </Html>
    );
  }
  
  if (!texture) {
    console.log('MapTexture: 텍스처 없음');
    return null;
  }
  
  // 맵 크기 계산 (메타데이터 기반)
  const mapWidth = (mapInfo.width || 1000) * (mapInfo.resolution || 0.05);
  const mapHeight = (mapInfo.height || 1000) * (mapInfo.resolution || 0.05);
  
  // ROS 맵 좌표계: origin은 맵 이미지의 좌하단 모서리를 나타냄
  // 3D 공간에서 이미지 중심을 origin + mapSize/2 위치에 배치
  const mapCenterX = (mapInfo.origin_x || 0) + mapWidth / 2;
  const mapCenterY = (mapInfo.origin_y || 0) + mapHeight / 2;
  
  console.log('MapTexture: 렌더링', { 
    mapWidth, 
    mapHeight, 
    origin: { x: mapInfo.origin_x || 0, y: mapInfo.origin_y || 0 },
    center: { x: mapCenterX, y: mapCenterY }
  });
  
  return (
    <mesh 
      ref={meshRef} 
      position={[mapCenterX, 0.01, -mapCenterY]}
      rotation={[Math.PI/2, 0, 0]} // 90도 회전하여 바닥에 수평으로 놓기 (이미지 방향 수정)
    >
      <planeGeometry args={[mapWidth, mapHeight]} />
      <meshBasicMaterial 
        map={texture} 
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}



// 심플한 맵 노드 렌더링 컴포넌트
function MapNode({ node, mapInfo, theme = 'dark', isSelected = false, onHover, onHoverEnd }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // ROS 맵 좌표계: 노드 좌표는 이미 실제 미터 단위 좌표이므로 그대로 사용
  const transformedPos = {
    x: node.position_x,
    y: node.position_y
  };
  
  console.log('노드 좌표 (미터 단위):', {
    node: node.name,
    position: transformedPos,
    type: node.type
  });
  
  // 테마에 따른 노드 설정 (1/4 크기로 축소)
  const nodeConfig = useMemo(() => {
    const isDark = theme === 'dark';
    return { 
      color: isDark ? '#0080FF' : '#0088cc', // 테마에 따른 Primary 컬러
      size: 0.075,      // 1/4 크기로 축소 (0.3 -> 0.075)
      height: 0.1       // 1/4 높이로 축소 (0.4 -> 0.1)
    };
  }, [theme]);
  
  // 심플한 애니메이션 효과
  useFrame((state) => {
    if (meshRef.current) {
      // 선택/호버 시에만 부드러운 펄스 효과
      if (isSelected || hovered) {
        const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1;
        meshRef.current.scale.setScalar(pulse);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });
  
  return (
    <group>
      {/* 네모 모양 노드 (완전 불투명) */}
      <mesh
        ref={meshRef}
        position={[transformedPos.x, nodeConfig.height / 2, -transformedPos.y]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover?.(node);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHoverEnd?.();
        }}
      >
        <boxGeometry args={[nodeConfig.size * 2, nodeConfig.height, nodeConfig.size * 2]} />
        <meshStandardMaterial
          color={nodeConfig.color}
          transparent={false}
          opacity={1}
          emissive={nodeConfig.color}
          emissiveIntensity={isSelected ? 0.3 : (hovered ? 0.2 : 0.1)}
        />
      </mesh>
      
      {/* 심플한 노드 정보창 */}
      {(hovered || isSelected) && (
        <Html 
          position={[transformedPos.x, nodeConfig.height + 0.3, -transformedPos.y]}
          center
        >
          <div style={{
            background: theme === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${nodeConfig.color}`,
            borderRadius: '8px',
            padding: '12px 16px',
            color: theme === 'dark' ? '#ffffff' : '#2c3e50',
            fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'left',
            minWidth: '150px',
            boxShadow: theme === 'dark' 
              ? '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 8px rgba(0, 128, 255, 0.3)'
              : '0 4px 16px rgba(0, 0, 0, 0.1), 0 0 8px rgba(0, 136, 204, 0.15)',
            pointerEvents: 'none',
            transform: 'translate(-50%, -100%)'
          }}>
            <div style={{ 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: theme === 'dark' ? '#0080ff' : '#0056b3'
            }}>
              {node.name}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: theme === 'dark' ? '#cccccc' : '#6c757d', 
              lineHeight: '1.4' 
            }}>
              <div>Index: {node.node_index}</div>
              <div>Type: {node.type}</div>
              <div>Position: ({node.position_x.toFixed(2)}, {node.position_y.toFixed(2)})</div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// 심플한 맵 노드 연결선 렌더링 컴포넌트
function MapConnection({ connection, nodes, mapInfo, theme = 'dark' }) {
  const lineRef = useRef();
  
  const fromNode = nodes.find(n => n.node_index === connection.from_node_index);
  const toNode = nodes.find(n => n.node_index === connection.to_node_index);
  
  if (!fromNode || !toNode) return null;
  
  // ROS 맵 좌표계: 노드 좌표는 이미 실제 미터 단위 좌표이므로 그대로 사용
  const fromTransformed = {
    x: fromNode.position_x,
    y: fromNode.position_y
  };
  
  const toTransformed = {
    x: toNode.position_x,
    y: toNode.position_y
  };
  
  // 테마에 따른 연결선 색상
  const connectionColor = theme === 'dark' ? '#0080FF' : '#0088cc';
  
  // 심플한 직선 연결 (로봇 높이에 맞춰 조정)
  const points = [
    [fromTransformed.x, 0.05, -fromTransformed.y],
    [toTransformed.x, 0.05, -toTransformed.y]
  ];
  
  // 심플한 빛나는 효과
  useFrame((state) => {
    if (lineRef.current) {
      // 부드러운 빛나는 효과
      const glow = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
      lineRef.current.material.opacity = glow;
    }
  });
  
  return (
    <Line
      ref={lineRef}
      points={points}
      color={connectionColor}
      lineWidth={2}
      transparent
      opacity={0.7}
    />
  );
}

// 메인 맵 렌더러 컴포넌트
const MapRenderer3D = ({ 
  mapData, 
  showTexture = true, 
  showNodes = true, 
  showConnections = true,
  selectedNode = null,
  onNodeHover,
  onNodeHoverEnd
}) => {
  const { state } = useAppContext();
  const theme = state.ui.theme;
  const [hoveredNode, setHoveredNode] = useState(null);
  
  console.log('MapRenderer3D: props received', { 
    mapData: mapData ? { id: mapData.map?.id, name: mapData.map?.name } : null,
    showTexture,
    showNodes,
    showConnections
  });
  
  if (!mapData) {
    console.log('MapRenderer3D: mapData가 없음');
    return null;
  }
  
  const { map, nodes = [], connections = [] } = mapData;
  console.log('MapRenderer3D: 맵 데이터 파싱', { 
    map: map ? { id: map.id, name: map.name } : null,
    nodesCount: nodes.length,
    connectionsCount: connections.length
  });
  
  return (
    <group>
      
      {/* 맵 텍스처 렌더링 */}
      {showTexture && (
        <MapTexture 
          mapInfo={map}
          visible={showTexture}
        />
      )}
      
      {/* 노드 연결선 렌더링 */}
      {showConnections && connections.map((connection, index) => (
        <MapConnection
          key={index}
          connection={connection}
          nodes={nodes}
          mapInfo={map}
          theme={theme}
        />
      ))}
      
      {/* 노드 렌더링 */}
      {showNodes && nodes.map((node) => (
        <MapNode
          key={node.id}
          node={node}
          mapInfo={map}
          theme={theme}
          isSelected={selectedNode?.id === node.id}
          onHover={(node) => {
            setHoveredNode(node);
            onNodeHover?.(node);
          }}
          onHoverEnd={() => {
            setHoveredNode(null);
            onNodeHoverEnd?.();
          }}
        />
      ))}

    </group>
  );
};

export default MapRenderer3D; 
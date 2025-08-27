import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Line, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useAppContext } from '../../contexts/AppContext';
import { COLORS } from '../../constants';
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

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
      //console.log('MapTexture: mapInfo나 visible이 없음', { mapInfo, visible });
      return;
    }
    
    //console.log('MapTexture: 맵 정보 전체:', mapInfo);
    //console.log('MapTexture: 맵 ID:', mapInfo.id);
    //console.log('MapTexture: 맵 이름:', mapInfo.name);
    
    const processImage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        //console.log('MapTexture: 이미지 로드 시작', `/api/maps/${mapInfo.id}/download/image`);
        
        // 이미지 파일 로드 (백엔드 서버 URL 사용)
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const imageUrl = `${API_URL}/api/maps/${mapInfo.id}/download/image`;
        //console.log('MapTexture: fetch URL:', imageUrl);
        
        const imageResponse = await fetch(imageUrl);
        //console.log('MapTexture: fetch 응답:', imageResponse.status, imageResponse.statusText);
        
        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          console.error('MapTexture: fetch 에러 응답:', errorText);
          throw new Error(`이미지 로드 실패: ${imageResponse.status} ${imageResponse.statusText} - ${errorText}`);
        }
        
        const imageBlob = await imageResponse.blob();
        //console.log('MapTexture: 이미지 블롭 크기', imageBlob.size);
        
        // 이미지 객체 생성
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          //console.log('MapTexture: 이미지 로드 완료', { width: img.width, height: img.height });
          
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
          
          //console.log('MapTexture: 고화질 텍스처 생성 완료', { anisotropy: texture.anisotropy });
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
    //console.log('MapTexture: 렌더링 안함 (visible 또는 mapInfo 없음)');
    return null;
  }
  
  if (loading) {
    //console.log('MapTexture: 로딩 중');
    return (
      <Html position={[0, 2, 0]}>
        <div style={{ color: 'white', background: 'rgba(0,0,0,0.8)', padding: '8px', borderRadius: '4px' }}>
          맵 이미지 로딩 중...
        </div>
      </Html>
    );
  }
  
  if (error) {
    //console.log('MapTexture: 오류 발생', error);
    return (
      <Html position={[0, 2, 0]}>
        <div style={{ color: 'red', background: 'rgba(0,0,0,0.8)', padding: '8px', borderRadius: '4px' }}>
          맵 이미지 로드 실패: {error}
        </div>
      </Html>
    );
  }
  
  if (!texture) {
    //console.log('MapTexture: 텍스처 없음');
    return null;
  }
  
  // 맵 크기 계산 (메타데이터 기반)
  const mapWidth = (mapInfo.width || 1000) * (mapInfo.resolution || 0.05);
  const mapHeight = (mapInfo.height || 1000) * (mapInfo.resolution || 0.05);
  
  // ROS 맵 좌표계: origin은 맵 이미지의 좌하단 모서리를 나타냄
  // 3D 공간에서 이미지 중심을 origin + mapSize/2 위치에 배치
  const mapCenterX = (mapInfo.origin_x || 0) + mapWidth / 2;
  const mapCenterY = (mapInfo.origin_y || 0) + mapHeight / 2;
  
  // console.log('MapTexture: 렌더링', { 
  //   mapWidth, 
  //   mapHeight, 
  //   origin: { x: mapInfo.origin_x || 0, y: mapInfo.origin_y || 0 },
  //   center: { x: mapCenterX, y: mapCenterY }
  // });
  
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
function MapNode({ node, mapInfo, theme = 'dark', isSelected = false, onHover, onHoverEnd, onRightClick, robots = [], onMoveRequest }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [contextMenuMode, setContextMenuMode] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // ROS 맵 좌표계: 노드 좌표는 이미 실제 미터 단위 좌표이므로 그대로 사용
  const transformedPos = {
    x: node.position_x,
    y: node.position_y
  };
  
  // console.log('노드 좌표 (미터 단위):', {
  //   node: node.name,
  //   position: transformedPos,
  //   type: node.type
  // });
  
  // 테마에 따른 노드 설정
  const nodeConfig = useMemo(() => {
    const isDark = theme === 'dark';
    return { 
      color: isDark ? COLORS.PRIMARY : '#0088ff', // 라이트 테마에서 더 밝은 파란색
      size: 0.075,      // 기본 크기
      height: 0.1,      // 기본 높이
      hoverSize: 0.15   // 호버 영역 크기 (2배로 확대)
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

  const handleRightClick = (e) => {
    e.stopPropagation();
    setContextMenuMode(true);
    setSelectedRobot(null);
    setHovered(true); // 강제로 hover 상태 유지
  };

  const handleCloseContextMenu = () => {
    setContextMenuMode(false);
    setSelectedRobot(null);
    setIsLoading(false);
    setHovered(false); // hover 상태도 해제
  };

  const handleMoveRequest = async () => {
    if (!selectedRobot || !node || !onMoveRequest) return;
    
    setIsLoading(true);
    try {
      // node.id 대신 node.node_index를 사용 (AMR이 인식할 수 있는 값)
      const targetNodeId = node.node_index || node.id;

      await onMoveRequest(selectedRobot.id, targetNodeId);
      handleCloseContextMenu();
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };

  // 모든 로봇 표시 (필터링 제거)
  const allRobots = robots || [];

  // 로봇 상태별 색상과 아이콘
  const getStatusInfo = (status) => {
    switch (status) {
      case 'moving':
        return { color: '#3B82F6', icon: '▶', text: '이동중', available: false };
      case 'idle':
        return { color: '#22C55E', icon: '⏸', text: '대기중', available: true };
      case 'charging':
        return { color: '#F59E0B', icon: '⚡', text: '충전중', available: true };
      case 'working':
        return { color: '#F59E0B', icon: '⚙', text: '작업중', available: false };
      case 'error':
        return { color: '#EF4444', icon: '✕', text: '오류', available: false };
      case 'disconnected':
        return { color: '#6B7280', icon: '⚠', text: '연결끊김', available: false };
      default:
        return { color: '#6B7280', icon: '●', text: '알수없음', available: false };
    }
  };

  const themeColors = {
    background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    textPrimary: theme === 'dark' ? '#ffffff' : '#2c3e50',
    textSecondary: theme === 'dark' ? '#cccccc' : '#6c757d',
    border: theme === 'dark' ? '#333333' : '#e0e0e0',
    buttonPrimary: '#00d4ff',
    buttonHover: '#00c3ff',
    robotItem: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
    robotItemHover: theme === 'dark' ? '#363636' : '#e9ecef',
    robotItemDisabled: theme === 'dark' ? '#1a1a1a' : '#f0f0f0'
  };

  // 외부 클릭 감지를 위한 useEffect
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (contextMenuMode) {
        // 툴팁 내부 클릭이 아닌 경우에만 닫기
        const target = event.target;
        const isInsideTooltip = target.closest('[data-tooltip-content]');
        if (!isInsideTooltip) {
          handleCloseContextMenu();
        }
      }
    };

    if (contextMenuMode) {
      // 약간의 지연을 두어 우클릭 이벤트와 충돌 방지
      setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('contextmenu', handleOutsideClick);
      }, 100);
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('contextmenu', handleOutsideClick);
    };
  }, [contextMenuMode]);
  
  return (
    <group>
      {/* 투명한 호버 영역 (더 큰 범위) */}
      <mesh
        position={[transformedPos.x, nodeConfig.height / 2, -transformedPos.y]}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!contextMenuMode) {
            setHovered(true);
            onHover?.(node);
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (!contextMenuMode) {
            setHovered(false);
            onHoverEnd?.();
          }
        }}
        onContextMenu={handleRightClick}
      >
        <boxGeometry args={[nodeConfig.hoverSize * 2, nodeConfig.height * 2, nodeConfig.hoverSize * 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* 실제 노드 표시 (네모 모양) */}
      <mesh
        ref={meshRef}
        position={[transformedPos.x, nodeConfig.height / 2, -transformedPos.y]}
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
      
      {/* 툴팁 (일반 모드 또는 컨텍스트 메뉴 모드) */}
      {(hovered || isSelected) && (
        <Html 
          position={[transformedPos.x, nodeConfig.height + 0.8, -transformedPos.y]}
          center
          style={{
            transform: 'translate(-50%, -100%)',
            zIndex: 10000,
            pointerEvents: contextMenuMode ? 'all' : 'none'
          }}
        >
          <div 
            data-tooltip-content
            style={{
              background: themeColors.background,
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '16px 20px',
              color: themeColors.textPrimary,
              fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: '500',
              textAlign: 'left',
              minWidth: contextMenuMode ? '280px' : '240px',
              maxWidth: contextMenuMode ? '350px' : '300px',
              boxShadow: theme === 'dark' 
                ? `0 0 20px ${nodeConfig.color}40, 0 4px 16px rgba(0, 0, 0, 0.5)`
                : `0 0 20px ${nodeConfig.color}30, 0 4px 16px rgba(0, 0, 0, 0.15)`,
              position: 'relative'
            }}
          >
            {contextMenuMode ? (
              /* AMR 선택 메뉴 */
              <>
                {/* 헤더 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: `1px solid ${themeColors.border}`
                }}>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: themeColors.textPrimary
                    }}>
                      AMR 이동
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: themeColors.textSecondary,
                      marginTop: '2px'
                    }}>
                      {node.name} (#{node.node_index})
                    </div>
                  </div>
                  <button
                    onClick={handleCloseContextMenu}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: themeColors.textSecondary,
                      fontSize: '18px',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* AMR 리스트 */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: themeColors.textPrimary,
                    marginBottom: '8px'
                  }}>
                    모든 AMR ({allRobots.length}개)
                  </div>
                  
                  {allRobots.length === 0 ? (
                    <div style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: themeColors.textSecondary,
                      fontSize: '13px',
                      backgroundColor: themeColors.robotItem,
                      borderRadius: '8px'
                    }}>
                      등록된 AMR이 없습니다
                    </div>
                  ) : (
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {allRobots.map(robot => {
                        const statusInfo = getStatusInfo(robot.status);
                        const isAvailable = statusInfo.available;
                        const isSelectedRobot = selectedRobot?.id === robot.id;
                        
                        return (
                          <div
                            key={robot.id}
                            onClick={() => isAvailable && setSelectedRobot(robot)}
                            style={{
                              padding: '8px 12px',
                              margin: '3px 0',
                              borderRadius: '6px',
                              cursor: isAvailable ? 'pointer' : 'not-allowed',
                              backgroundColor: isSelectedRobot 
                                ? themeColors.buttonPrimary 
                                : 'transparent',
                              color: isSelectedRobot 
                                ? '#ffffff' 
                                : isAvailable 
                                  ? themeColors.textPrimary 
                                  : themeColors.textSecondary,
                              border: isSelectedRobot 
                                ? `1px solid ${themeColors.buttonPrimary}` 
                                : '1px solid transparent',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s ease',
                              opacity: isAvailable ? 1 : 0.5
                            }}
                            onMouseEnter={(e) => {
                              if (isAvailable && !isSelectedRobot) {
                                e.target.style.backgroundColor = themeColors.robotItem;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isAvailable && !isSelectedRobot) {
                                e.target.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            {/* 상태 인디케이터 점 */}
                            <div style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: statusInfo.color,
                              border: `2px solid ${statusInfo.color}40`,
                              boxShadow: `0 0 8px ${statusInfo.color}60`,
                              flexShrink: 0
                            }}></div>
                            
                            {/* 로봇 이름 */}
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              flex: 1
                            }}>
                              {robot.name || robot.id}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 버튼들 */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={handleCloseContextMenu}
                    style={{
                      padding: '8px 16px',
                      border: `1px solid ${themeColors.border}`,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: themeColors.textSecondary,
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleMoveRequest}
                    disabled={!selectedRobot || isLoading || allRobots.length === 0 || !getStatusInfo(selectedRobot?.status).available}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: (!selectedRobot || isLoading || allRobots.length === 0 || !getStatusInfo(selectedRobot?.status).available) 
                        ? themeColors.textSecondary 
                        : themeColors.buttonPrimary,
                      color: '#ffffff',
                      fontSize: '14px',
                      cursor: (!selectedRobot || isLoading || allRobots.length === 0 || !getStatusInfo(selectedRobot?.status).available) 
                        ? 'not-allowed' 
                        : 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: (!selectedRobot || isLoading || allRobots.length === 0 || !getStatusInfo(selectedRobot?.status).available) 
                        ? 'none' 
                        : `0 0 10px ${themeColors.buttonPrimary}40`
                    }}
                    onMouseEnter={(e) => {
                      if (!e.target.disabled) {
                        e.target.style.backgroundColor = themeColors.buttonHover;
                        e.target.style.boxShadow = `0 0 15px ${themeColors.buttonPrimary}60`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.target.disabled) {
                        e.target.style.backgroundColor = themeColors.buttonPrimary;
                        e.target.style.boxShadow = `0 0 10px ${themeColors.buttonPrimary}40`;
                      }
                    }}
                  >
                    {isLoading && (
                      <div style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid transparent',
                        borderTop: '2px solid #ffffff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    )}
                    {isLoading ? '이동 중...' : '이동'}
                  </button>
                </div>
              </>
            ) : (
              /* 일반 노드 정보 툴팁 */
              <>
                {/* 헤더 */}
                <div style={{ 
                  marginBottom: '12px', 
                  paddingBottom: '8px',
                  borderBottom: `1px solid ${theme === 'dark' ? '#333333' : '#e0e0e0'}`,
                  fontSize: '15px', 
                  fontWeight: '700', 
                  color: nodeConfig.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: nodeConfig.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    color: '#ffffff',
                    fontWeight: '600'
                  }}>
                    {node.node_index}
                  </div>
                  {node.name}
                </div>
                
                {/* 상세 정보 */}
                <div style={{ 
                  fontSize: '12px', 
                  color: theme === 'dark' ? '#cccccc' : '#6c757d', 
                  lineHeight: '1.5',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '6px 12px'
                }}>
                  <span style={{ fontWeight: '600', color: theme === 'dark' ? '#ffffff' : '#2c3e50' }}>Index:</span>
                  <span>{node.node_index}</span>
                  
                  <span style={{ fontWeight: '600', color: theme === 'dark' ? '#ffffff' : '#2c3e50' }}>Type:</span>
                  <span>{node.type}</span>
                  
                  <span style={{ fontWeight: '600', color: theme === 'dark' ? '#ffffff' : '#2c3e50' }}>Position:</span>
                  <span style={{ fontFamily: 'monospace' }}>
                    ({node.position_x.toFixed(2)}, {node.position_y.toFixed(2)})
                  </span>
                </div>

                {/* 우클릭 안내 */}
                <div style={{
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: `1px solid ${theme === 'dark' ? '#333333' : '#e0e0e0'}`,
                  fontSize: '11px',
                  color: theme === 'dark' ? '#888888' : '#999999',
                  textAlign: 'center'
                }}>
                  우클릭하여 AMR 이동
                </div>
              </>
            )}
            
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

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
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
  const connectionColor = theme === 'dark' ? COLORS.PRIMARY : '#0056b3';
  
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

// 서버 처리된 포인트클라우드 렌더링 컴포넌트
function ServerProcessedPointCloudRenderer({ pcdData, visible = true, theme = 'dark' }) {
  const pointsRef = useRef();
  const [pointCloud, setPointCloud] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pcdData || !visible) {
      setPointCloud(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('서버 처리된 PCD 데이터 렌더링 시작:', {
        originalCount: pcdData.originalCount,
        processedCount: pcdData.processedCount,
        compressionRatio: pcdData.compressionRatio,
        processingMode: pcdData.processingMode
      });

      // 서버에서 처리된 포인트 데이터 사용
      const points = pcdData.points;
      
      if (!points || points.length === 0) {
        throw new Error('포인트 데이터가 없습니다.');
      }

      // Three.js geometry 생성
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];
      
      // 포인트 데이터를 Three.js 형식으로 변환
      points.forEach(point => {
        positions.push(point.x, point.y, point.z);
        
        // 색상 정보가 있다면 사용, 없다면 기본 색상
        if (point.r !== undefined && point.g !== undefined && point.b !== undefined) {
          colors.push(point.r / 255, point.g / 255, point.b / 255);
        } else if (point.rgb !== undefined) {
          // RGB 패킹된 값 처리
          const rgb = point.rgb;
          const r = (rgb >> 16) & 0xFF;
          const g = (rgb >> 8) & 0xFF;
          const b = rgb & 0xFF;
          colors.push(r / 255, g / 255, b / 255);
        } else {
          // 기본 색상 (테마에 따라)
          if (theme === 'dark') {
            colors.push(0, 1, 1); // 시안
          } else {
            colors.push(0, 0.5, 1); // 파란색
          }
        }
      });

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      if (colors.length > 0) {
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      }

      // Points 머티리얼과 객체 생성 (크기 증가 및 색상 개선)
      const material = new THREE.PointsMaterial({
        size: 0.08,  // 0.02 → 0.08 (4배 증가)
        sizeAttenuation: true,
        vertexColors: false  // 항상 단일 색상 사용하도록 강제
      });

      // 테마별 색상 적용 (항상 적용)
      if (theme === 'dark') {
        material.color.setHex(0x00FFFF);  // 다크 테마: 밝은 파란색 (청록색)
      } else {
        material.color.setHex(0x000000);  // 라이트 테마: 완전한 검은색
      }

      const pointsObject = new THREE.Points(geometry, material);
      pointsObject.position.set(0, 0, 0);
      pointsObject.rotation.set(0, 0, 0);

      setPointCloud(pointsObject);
      setLoading(false);

      console.log('서버 처리된 PCD 렌더링 완료:', {
        renderedPoints: points.length,
        hasColors: colors.length > 0
      });

    } catch (err) {
      console.error('서버 PCD 렌더링 오류:', err);
      setError(`포인트클라우드 렌더링 실패: ${err.message}`);
      setLoading(false);
    }
  }, [pcdData, visible, theme]);

  // 테마 변경 시 기존 포인트클라우드 색상 업데이트
  useEffect(() => {
    if (pointCloud && pointCloud.material) {
      if (theme === 'dark') {
        pointCloud.material.color.setHex(0x00FFFF);  // 다크 테마: 밝은 파란색
      } else {
        pointCloud.material.color.setHex(0x000000);  // 라이트 테마: 완전한 검은색
      }
      pointCloud.material.needsUpdate = true;
    }
  }, [theme, pointCloud]);

  if (!visible) return null;

  if (loading) {
    return (
      <Html position={[0, 3, 0]}>
        <div style={{
          color: 'white',
          background: 'rgba(0,0,0,0.8)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontFamily: 'Pretendard, sans-serif',
          fontSize: '14px'
        }}>
          서버 처리된 포인트클라우드 렌더링 중...
        </div>
      </Html>
    );
  }

  if (error) {
    return (
      <Html position={[0, 3, 0]}>
        <div style={{
          color: '#ff6b6b',
          background: 'rgba(0,0,0,0.8)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontFamily: 'Pretendard, sans-serif',
          fontSize: '14px'
        }}>
          {error}
        </div>
      </Html>
    );
  }

  if (!pointCloud) return null;

  return (
    <group ref={pointsRef}>
      <primitive object={pointCloud} />
      
      {/* 서버 처리 정보 표시 */}
      {pcdData && (
        <Html position={[0, 5, 0]}>
          {/* <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.9)',
            padding: '12px 16px',
            borderRadius: '8px',
            color: 'white',
            fontFamily: 'Pretendard, sans-serif',
            fontSize: '12px',
            border: '1px solid #00FFFF40',
            zIndex: 1001,
            minWidth: '220px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#00FFFF' }}>
              🚀 서버 처리된 포인트클라우드
            </div>
            <div style={{ lineHeight: '1.4' }}>
              <div>원본: {pcdData.originalCount?.toLocaleString()} 포인트</div>
              <div>표시: {pcdData.processedCount?.toLocaleString()} 포인트</div>
              <div style={{ color: '#FFFF00' }}>
                압축률: {pcdData.compressionRatio}%
              </div>
              <div style={{ color: '#CCCCCC', marginTop: '4px' }}>
                모드: {pcdData.processingMode}
              </div>
              <div style={{ color: '#00FF88', marginTop: '4px' }}>
                크기: {pcdData.originalSize?.toFixed(2)} MB
              </div>
            </div>
          </div> */}
        </Html>
      )}
    </group>
  );
}

// 기존 클라이언트 처리 포인트클라우드 렌더링 컴포넌트 (백업용)
function PointCloudRenderer({ pcdData, visible = true, theme = 'dark' }) {
  const pointsRef = useRef();
  const [pointCloud, setPointCloud] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [originalPointCount, setOriginalPointCount] = useState(0);
  const [displayedPointCount, setDisplayedPointCount] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);

  // PCD 포맷 체크 함수
  const checkPcdFormat = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const chunk = file.slice(0, 1024); // 첫 1KB만 읽어서 헤더 확인
      
      reader.onload = (e) => {
        const text = e.target.result;
        // DATA ascii 또는 DATA binary 확인
        const isAscii = text.includes('DATA ascii');
        resolve(isAscii);
      };
      
      reader.onerror = () => resolve(false); // 에러시 바이너리로 간주
      reader.readAsText(chunk);
    });
  };

  // 스트리밍 PCD 파싱 함수
  const parseStreaming = async (file, maxPoints = 200000) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const chunkSize = 50 * 1024 * 1024; // 50MB 청크
      let offset = 0;
      let header = null;
      let totalPoints = 0;
      let sampledPositions = [];
      let sampledColors = [];
      let pointsProcessed = 0;
      
      const readChunk = () => {
        const chunk = file.slice(offset, offset + chunkSize);
        reader.readAsText(chunk);
      };
      
      reader.onload = (e) => {
        const text = e.target.result;
        
        if (!header) {
          // 헤더 파싱
          const lines = text.split('\n');
          const pointsLine = lines.find(line => line.startsWith('POINTS'));
          if (pointsLine) {
            totalPoints = parseInt(pointsLine.split(' ')[1]);
            console.log('총 포인트 수:', totalPoints.toLocaleString());
            
            // 샘플링 비율 계산
            const samplingRatio = Math.min(1, maxPoints / totalPoints);
            console.log('샘플링 비율:', (samplingRatio * 100).toFixed(2) + '%');
          }
          
          // DATA 라인 찾기
          const dataIndex = lines.findIndex(line => line.startsWith('DATA'));
          if (dataIndex >= 0) {
            header = lines.slice(0, dataIndex + 1).join('\n');
            // DATA 이후의 포인트 데이터 처리
            const pointLines = lines.slice(dataIndex + 1).filter(line => line.trim());
            processPointLines(pointLines);
          }
        } else {
          // 포인트 데이터만 처리
          const lines = text.split('\n').filter(line => line.trim());
          processPointLines(lines);
        }
        
        offset += chunkSize;
        
        // 진행률 업데이트
        const progress = Math.min((offset / file.size) * 100, 100);
        setProcessingProgress(progress);
        
        if (offset < file.size && sampledPositions.length < maxPoints * 3) {
          // 다음 청크 읽기
          setTimeout(readChunk, 10); // 10ms 지연으로 UI 블로킹 방지
        } else {
          // 완료
          setProcessingProgress(100);
          finishProcessing();
        }
      };
      
      const processPointLines = (lines) => {
        const samplingStep = Math.max(1, Math.ceil(totalPoints / maxPoints));
        
        for (const line of lines) {
          if (pointsProcessed % samplingStep === 0 && sampledPositions.length < maxPoints * 3) {
            const values = line.trim().split(/\s+/).map(Number);
            if (values.length >= 3) {
              sampledPositions.push(values[0], values[1], values[2]);
              
              // RGB가 있는 경우
              if (values.length >= 6) {
                sampledColors.push(values[3] / 255, values[4] / 255, values[5] / 255);
              }
            }
          }
          pointsProcessed++;
        }
      };
      
      const finishProcessing = () => {
        try {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(sampledPositions, 3));
          
          if (sampledColors.length > 0) {
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(sampledColors, 3));
          }
          
          resolve({
            geometry,
            originalCount: totalPoints,
            sampledCount: sampledPositions.length / 3
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      
      // 첫 번째 청크 읽기 시작
      readChunk();
    });
  };

  // 기존 다운샘플링 함수 (백업용)
  const downsamplePoints = (geometry, maxPoints = 100000) => {
    const positions = geometry.attributes.position.array;
    const colors = geometry.attributes.color?.array;
    const originalCount = positions.length / 3;
    
    if (originalCount <= maxPoints) {
      return { geometry, sampledCount: originalCount };
    }
    
    // 균등한 간격으로 포인트 샘플링
    const step = Math.ceil(originalCount / maxPoints);
    const sampledPositions = [];
    const sampledColors = [];
    
    for (let i = 0; i < originalCount; i += step) {
      const idx = i * 3;
      sampledPositions.push(positions[idx], positions[idx + 1], positions[idx + 2]);
      
      if (colors) {
        sampledColors.push(colors[idx], colors[idx + 1], colors[idx + 2]);
      }
    }
    
    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(sampledPositions, 3));
    
    if (colors && sampledColors.length > 0) {
      newGeometry.setAttribute('color', new THREE.Float32BufferAttribute(sampledColors, 3));
    }
    
    return { geometry: newGeometry, sampledCount: sampledPositions.length / 3 };
  };

  useEffect(() => {
    if (!pcdData || !visible) {
      setPointCloud(null);
      setOriginalPointCount(0);
      setDisplayedPointCount(0);
      setMemoryUsage(0);
      setProcessingProgress(0);
      return;
    }

    // 파일 크기 체크 (1GB = 1,073,741,824 bytes)
    if (pcdData instanceof File) {
      const fileSizeMB = pcdData.size / (1024 * 1024);
      console.log(`PCD 파일 크기: ${fileSizeMB.toFixed(2)} MB`);
      
      if (pcdData.size > 500 * 1024 * 1024) { // 500MB 이상
        console.warn('대용량 PCD 파일 감지됨. 다운샘플링을 적용합니다.');
      }
    }

    setLoading(true);
    setError(null);

    const loader = new PCDLoader();
    
    // 메모리 사용량 모니터링
    const updateMemoryUsage = () => {
      if (performance.memory) {
        const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        setMemoryUsage(usedMB);
        
        // 메모리 사용량이 너무 높으면 경고
        if (usedMB > 1024) { // 1GB 이상
          console.warn('높은 메모리 사용량 감지됨:', usedMB.toFixed(2), 'MB');
        }
      }
    };
    
    const processFile = async () => {
      try {
        // pcdData가 File 객체인 경우 - 스트리밍 방식 사용
        if (pcdData instanceof File) {
          // 파일이 텍스트 포맷인지 바이너리 포맷인지 확인
          const isAsciiFormat = await checkPcdFormat(pcdData);
          
          if (isAsciiFormat) {
            // ASCII 포맷 - 스트리밍 파싱 사용
            console.log('ASCII PCD 포맷 감지됨. 스트리밍 방식으로 처리합니다.');
            
            updateMemoryUsage();
            
            // 파일 크기에 따른 압축 강도 설정
            let maxPoints;
            if (pcdData.size > 1024 * 1024 * 1024) { // 1GB 이상 - 극도 압축
              maxPoints = 50000;
              console.log('🔥 극도 압축 모드: 50K 포인트로 제한');
            } else if (pcdData.size > 500 * 1024 * 1024) { // 500MB 이상 - 강력한 압축
              maxPoints = 100000;
              console.log('⚡ 강력한 압축 모드: 100K 포인트로 제한');
            } else if (pcdData.size > 100 * 1024 * 1024) { // 100MB 이상 - 일반 압축
              maxPoints = 200000;
              console.log('📊 일반 압축 모드: 200K 포인트로 제한');
            } else { // 100MB 미만 - 최소 압축
              maxPoints = 500000;
              console.log('✨ 고품질 모드: 500K 포인트 허용');
            }
            
            const result = await parseStreaming(pcdData, maxPoints);
          
          setOriginalPointCount(result.originalCount);
          setDisplayedPointCount(result.sampledCount);
          
          console.log(`스트리밍 처리 완료: ${result.originalCount.toLocaleString()} → ${result.sampledCount.toLocaleString()}`);
          
          // Points 객체 생성 (크기 증가 및 색상 개선)
          const material = new THREE.PointsMaterial({
            size: 0.06, // 0.01 → 0.06 (6배 증가)
            sizeAttenuation: true,
            vertexColors: false  // 항상 단일 색상 사용하도록 강제
          });
          
          // 테마별 색상 적용 (항상 적용)
          if (theme === 'dark') {
            material.color.setHex(0x00FFFF);  // 다크 테마: 밝은 파란색 (청록색)
          } else {
            material.color.setHex(0x000000);  // 라이트 테마: 완전한 검은색
          }
          
          const points = new THREE.Points(result.geometry, material);
          points.position.set(0, 0, 0);
          points.rotation.set(0, 0, 0);
          
          updateMemoryUsage();
          setPointCloud(points);
          setLoading(false);
          
        } else {
          // 바이너리 포맷 - 크기별 처리
          console.log('바이너리 PCD 포맷 감지됨. 압축 처리를 적용합니다.');
          
          // 바이너리는 더 엄격한 제한 (메모리 사용량이 큼)
          if (pcdData.size > 2048 * 1024 * 1024) { // 2GB 이상은 처리 불가
            throw new Error('바이너리 PCD 파일이 너무 큽니다. 2GB 이하만 지원됩니다.');
          }
          
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const arrayBuffer = event.target.result;
              console.log('바이너리 ArrayBuffer 크기:', (arrayBuffer.byteLength / (1024 * 1024)).toFixed(2), 'MB');
              
              updateMemoryUsage();
              
              const originalPoints = loader.parse(arrayBuffer);
              const originalCount = originalPoints.geometry.attributes.position.count;
              setOriginalPointCount(originalCount);
              
              // 바이너리 파일 크기에 따른 압축 강도 설정
              let maxPoints;
              const fileSizeMB = pcdData.size / (1024 * 1024);
              
              if (fileSizeMB > 1024) { // 1GB 이상 - 극도 압축
                maxPoints = 30000;
                console.log('🔥 바이너리 극도 압축: 30K 포인트');
              } else if (fileSizeMB > 500) { // 500MB 이상 - 강력한 압축
                maxPoints = 50000;
                console.log('⚡ 바이너리 강력한 압축: 50K 포인트');
              } else if (fileSizeMB > 100) { // 100MB 이상 - 일반 압축
                maxPoints = 100000;
                console.log('📊 바이너리 일반 압축: 100K 포인트');
              } else { // 100MB 미만
                maxPoints = 200000;
                console.log('✨ 바이너리 고품질: 200K 포인트');
              }
              
              const { geometry: sampledGeometry, sampledCount } = downsamplePoints(originalPoints.geometry, maxPoints);
              
              setDisplayedPointCount(sampledCount);
              
              const material = new THREE.PointsMaterial({
                size: 0.06, // 0.01 → 0.06 (6배 증가)
                sizeAttenuation: true,
                vertexColors: false  // 항상 단일 색상 사용하도록 강제
              });
              
              // 테마별 색상 적용 (항상 적용)
              if (theme === 'dark') {
                material.color.setHex(0x00FFFF);  // 다크 테마: 밝은 파란색 (청록색)
              } else {
                material.color.setHex(0x000000);  // 라이트 테마: 완전한 검은색
              }
              
              const points = new THREE.Points(sampledGeometry, material);
              points.position.set(0, 0, 0);
              points.rotation.set(0, 0, 0);
              
              updateMemoryUsage();
              setPointCloud(points);
              setLoading(false);
              
              // 메모리 해제
              originalPoints.geometry.dispose();
              if (originalPoints.material) {
                originalPoints.material.dispose();
              }
              
            } catch (err) {
              console.error('바이너리 PCD 파싱 오류:', err);
              setError(`PCD 파일 파싱에 실패했습니다: ${err.message}`);
              setLoading(false);
            }
          };
          
          reader.onerror = () => {
            setError('PCD 파일 읽기에 실패했습니다.');
            setLoading(false);
          };
          
          reader.readAsArrayBuffer(pcdData);
        }
      }
      // pcdData가 URL 문자열인 경우
      else if (typeof pcdData === 'string') {
        loader.load(
          pcdData,
          (points) => {
            const originalCount = points.geometry.attributes.position.count;
            setOriginalPointCount(originalCount);
            
            // URL 로드의 경우도 다운샘플링 적용
            if (originalCount > 500000) {
              const maxPoints = originalCount > 2000000 ? 200000 : 500000;
              const { geometry: sampledGeometry, sampledCount } = downsamplePoints(points.geometry, maxPoints);
              
              points.geometry.dispose();
              points.geometry = sampledGeometry;
              setDisplayedPointCount(sampledCount);
            } else {
              setDisplayedPointCount(originalCount);
            }
            
            points.position.set(0, 0, 0);
            points.rotation.set(0, 0, 0);
            
            const material = points.material;
            material.size = 0.08;  // 0.015 → 0.08 (5배 증가)
            material.sizeAttenuation = true;
            material.vertexColors = false;  // 항상 단일 색상 사용하도록 강제
            
            // 테마별 색상 적용 (항상 적용)
            if (theme === 'dark') {
              material.color.setHex(0x00FFFF);  // 다크 테마: 밝은 파란색 (청록색)
            } else {
              material.color.setHex(0x000000);  // 라이트 테마: 완전한 검은색
            }
            
            updateMemoryUsage();
            setPointCloud(points);
            setLoading(false);
          },
          (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(1);
            console.log('PCD 로딩 진행률:', percent + '%');
          },
          (err) => {
            console.error('PCD 로드 오류:', err);
            setError('PCD 파일 로드에 실패했습니다.');
            setLoading(false);
          }
        );
      }
    } catch (err) {
        console.error('PCD 로더 초기화 오류:', err);
        setError('PCD 로더 초기화에 실패했습니다.');
        setLoading(false);
      }
    };
    
    processFile();
  }, [pcdData, visible, theme]);

  // 테마 변경 시 기존 포인트클라우드 색상 업데이트 (클라이언트 렌더러)
  useEffect(() => {
    if (pointCloud && pointCloud.material) {
      if (theme === 'dark') {
        pointCloud.material.color.setHex(0x00FFFF);  // 다크 테마: 밝은 파란색
      } else {
        pointCloud.material.color.setHex(0x000000);  // 라이트 테마: 완전한 검은색
      }
      pointCloud.material.needsUpdate = true;
    }
  }, [theme, pointCloud]);

  // 부드러운 회전 애니메이션 (선택사항)
  useFrame((state) => {
    if (pointsRef.current && pointCloud) {
      // 천천히 회전하는 효과 (선택사항)
      // pointsRef.current.rotation.y += 0.001;
    }
  });

  if (!visible) return null;

  if (loading) {
    return (
      <Html position={[0, 3, 0]}>
        <div style={{ 
          color: 'white', 
          background: 'rgba(0,0,0,0.9)', 
          padding: '16px 20px', 
          borderRadius: '12px',
          fontFamily: 'Pretendard, sans-serif',
          fontSize: '14px',
          minWidth: '300px',
          border: '1px solid #00FFFF40',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid transparent',
              borderTop: '2px solid #00FFFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ fontSize: '16px', fontWeight: '600' }}>
              대용량 PCD 파일 처리 중...
            </div>
          </div>
          
          <div style={{ fontSize: '12px', color: '#CCCCCC', lineHeight: '1.5' }}>
            {pcdData instanceof File && (
              <div>파일 크기: {(pcdData.size / (1024 * 1024)).toFixed(2)} MB</div>
            )}
            {memoryUsage > 0 && (
              <div>메모리 사용량: {memoryUsage.toFixed(2)} MB</div>
            )}
            <div style={{ marginTop: '8px', color: '#FFFF00' }}>
              {pcdData instanceof File && pcdData.size > 1024 * 1024 * 1024 ? 
                '🔥 극도 압축 모드로 처리 중...' :
                pcdData instanceof File && pcdData.size > 500 * 1024 * 1024 ? 
                '⚡ 강력한 압축 모드로 처리 중...' :
                pcdData instanceof File && pcdData.size > 100 * 1024 * 1024 ? 
                '📊 일반 압축 모드로 처리 중...' :
                '✨ 고품질 모드로 처리 중...'
              }
            </div>
            {processingProgress > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '11px' }}>처리 진행률</span>
                  <span style={{ fontSize: '11px', fontWeight: '600' }}>
                    {processingProgress.toFixed(1)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${processingProgress}%`,
                    height: '100%',
                    backgroundColor: '#00FFFF',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </Html>
    );
  }

  if (error) {
    return (
      <Html position={[0, 3, 0]}>
        <div style={{ 
          color: '#ff6b6b', 
          background: 'rgba(0,0,0,0.8)', 
          padding: '12px 16px', 
          borderRadius: '8px',
          fontFamily: 'Pretendard, sans-serif',
          fontSize: '14px'
        }}>
          포인트클라우드 로드 실패: {error}
        </div>
      </Html>
    );
  }

  if (!pointCloud) return null;

  return (
    <group ref={pointsRef}>
      <primitive object={pointCloud} />
      
      {/* 포인트클라우드 정보 표시 (우상단) */}
      {pointCloud && (originalPointCount !== displayedPointCount || memoryUsage > 0) && (
        <Html position={[0, 5, 0]}>
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.8)',
            padding: '12px 16px',
            borderRadius: '8px',
            color: 'white',
            fontFamily: 'Pretendard, sans-serif',
            fontSize: '12px',
            border: '1px solid #00FFFF40',
            zIndex: 1001,
            minWidth: '200px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#00FFFF' }}>
              {pcdData instanceof File && pcdData.size > 1024 * 1024 * 1024 ? 
                '🔥 극도 압축 포인트클라우드' :
                pcdData instanceof File && pcdData.size > 500 * 1024 * 1024 ? 
                '⚡ 강력 압축 포인트클라우드' :
                pcdData instanceof File && pcdData.size > 100 * 1024 * 1024 ? 
                '📊 일반 압축 포인트클라우드' :
                '✨ 고품질 포인트클라우드'
              }
            </div>
            <div style={{ lineHeight: '1.4' }}>
              <div>원본: {originalPointCount.toLocaleString()} 포인트</div>
              <div>표시: {displayedPointCount.toLocaleString()} 포인트</div>
              {originalPointCount !== displayedPointCount && (
                <div style={{ color: '#FFFF00' }}>
                  압축률: {((1 - displayedPointCount / originalPointCount) * 100).toFixed(1)}%
                </div>
              )}
              {memoryUsage > 0 && (
                <div style={{ marginTop: '4px', color: '#CCCCCC' }}>
                  메모리: {memoryUsage.toFixed(1)} MB
                </div>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
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
  onNodeHoverEnd,
  robots = [],
  onMoveRequest,
  pcdData = null,
  showPointCloud = false
}) => {
  const { state } = useAppContext();
  const theme = state.ui.theme;
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // console.log('MapRenderer3D: props received', { 
  //   mapData: mapData ? { id: mapData.map?.id, name: mapData.map?.name } : null,
  //   showTexture,
  //   showNodes,
  //   showConnections,
  //   robotsCount: robots.length
  // });
  
  if (!mapData) {
    //console.log('MapRenderer3D: mapData가 없음');
    return null;
  }
  
  const { map, nodes = [], connections = [] } = mapData;
  // console.log('MapRenderer3D: 맵 데이터 파싱', { 
  //   map: map ? { id: map.id, name: map.name } : null,
  //   nodesCount: nodes.length,
  //   connectionsCount: connections.length
  // });
  
  return (
    <group>
      
      {/* 맵 텍스처 렌더링 */}
      {showTexture && (
        <MapTexture 
          mapInfo={map}
          visible={showTexture}
        />
      )}
      
      {/* 서버 처리된 포인트클라우드 렌더링 */}
      {showPointCloud && pcdData && (
        <ServerProcessedPointCloudRenderer
          pcdData={pcdData}
          visible={showPointCloud}
          theme={theme}
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
          robots={robots}
          onMoveRequest={onMoveRequest}
        />
      ))}

    </group>
  );
};

export default MapRenderer3D; 
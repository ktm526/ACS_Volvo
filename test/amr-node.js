const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const app = express();
const PORT = 5001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 맵 데이터 로드
let mapData = null;
try {
  const mapFilePath = path.join(__dirname, 'map1_node1_node.yaml');
  const fileContents = fs.readFileSync(mapFilePath, 'utf8');
  mapData = yaml.parse(fileContents);
  console.log('맵 데이터가 성공적으로 로드되었습니다.');
} catch (error) {
  console.error('맵 데이터 로드 실패:', error.message);
}

// AMR 로봇 상태 데이터
let robotState = {
  robot_id: "H-001",
  robot_name: "HARM3_01",
  robot_model: "HAMR3",
  
  timestamp: new Date().toISOString(),
  
  hw_version: "v1.0.0",
  sw_version: "v1.0.0",
  
  driving_status: 0,  // 0: 정지, 1: 주행중, 2: 회전중
  driving_mode: 0,    // 0: 수동, 1: 자동
  
  position_x: -3.00,  // home 위치에서 시작
  position_y: 4.00,
  position_theta: 0.00,
  
  velocity_x: 0.00,
  velocity_y: 0.00,
  velocity_theta: 0.00,
  
  connection_status: true,
  
  order_status: 0,    // 0: 대기, 1: 작업 수신, 2: 작업 실행중, 3: 작업 완료, 4: 작업 실패
  path_status: [0, 0, 0, 0, 0],  // 경로 상태 배열
  
  battery_soc: 80.50,
  battery_voltage: 56.50,
  battery_soh: 100.0,
  charging_status: false,
  
  error_code: 0,
  error_msg: "",
  
  // 추가 내부 상태
  current_mission: null,
  target_node: null,
  mission_start_time: null,
  current_path: [],           // 현재 실행 중인 경로
  original_path_length: 0     // 원래 경로의 길이
};

// 노드 정보를 ID로 찾는 함수
function findNodeById(nodeId) {
  if (!mapData || !mapData.node) {
    console.log('맵 데이터가 없습니다.');
    return null;
  }
  
  console.log(`노드 찾기 시도: ${nodeId} (타입: ${typeof nodeId})`);
  
  const foundNode = mapData.node.find(node => 
    node.name === nodeId || 
    node.index === nodeId ||
    node.index.toString() === nodeId.toString() ||
    node.name === nodeId.toString()
  );
  
  if (foundNode) {
    console.log(`노드 찾음: ${foundNode.name} (index: ${foundNode.index})`);
  } else {
    console.log(`노드를 찾을 수 없음: ${nodeId}`);
    console.log(`사용 가능한 노드들:`, mapData.node.map(n => `${n.name}(${n.index})`).join(', '));
  }
  
  return foundNode;
}

// 두 지점 사이의 거리 계산
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// 가장 가까운 노드 찾기
function findNearestNode(x, y) {
  if (!mapData || !mapData.node) return null;
  
  let nearestNode = null;
  let minDistance = Infinity;
  
  for (const node of mapData.node) {
    const distance = calculateDistance(x, y, node.position.x, node.position.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearestNode = node;
    }
  }
  
  return nearestNode;
}

// DFS를 사용한 경로 찾기
function findPathDFS(startNodeId, targetNodeId) {
  if (!mapData || !mapData.node) return [];
  
  // 목표 노드의 실제 index 또는 name 찾기
  const targetNode = findNodeById(targetNodeId);
  if (!targetNode) return [];
  const actualTargetId = targetNode.index;
  
  const visited = new Set();
  const path = [];
  
  function dfs(currentNodeId) {
    if (visited.has(currentNodeId)) return false;
    
    visited.add(currentNodeId);
    path.push(currentNodeId);
    
    if (currentNodeId === actualTargetId) {
      return true; // 목표 도달
    }
    
    const currentNode = findNodeById(currentNodeId);
    if (!currentNode || !currentNode.connection) {
      path.pop();
      return false;
    }
    
    // 연결된 노드들을 탐색
    for (const connectedNodeId of currentNode.connection) {
      if (dfs(connectedNodeId)) {
        return true;
      }
    }
    
    path.pop();
    return false;
  }
  
  // 시작 노드에서 DFS 시작
  if (dfs(startNodeId)) {
    return path;
  }
  
  return []; // 경로를 찾지 못함
}

// 경로 생성 (현재 위치에서 목표까지)
function generatePath(targetNodeId) {
  console.log(`경로 생성 시작: 목표 노드 ${targetNodeId}`);
  
  // 목표 노드 찾기
  const targetNode = findNodeById(targetNodeId);
  if (!targetNode) {
    console.log(`목표 노드 ${targetNodeId}를 찾을 수 없습니다.`);
    return [];
  }
  
  // 1. 현재 위치에서 가장 가까운 노드 찾기
  const nearestNode = findNearestNode(robotState.position_x, robotState.position_y);
  if (!nearestNode) {
    console.log('가장 가까운 노드를 찾을 수 없습니다.');
    return [];
  }
  
  console.log(`가장 가까운 노드: ${nearestNode.name} (${nearestNode.index})`);
  
  // 2. DFS로 경로 찾기
  const path = findPathDFS(nearestNode.index, targetNode.index);
  
  if (path.length === 0) {
    console.log('경로를 찾을 수 없습니다.');
    return [];
  }
  
  // 3. 경로를 노드 객체로 변환
  const pathNodes = path.map(nodeId => findNodeById(nodeId)).filter(node => node !== null);
  
  console.log(`생성된 경로: ${pathNodes.map(n => n.name).join(' -> ')}`);
  
  return pathNodes;
}

// 로봇 위치 업데이트 (개선된 이동 시뮬레이션)
function updateRobotPosition() {
  if (robotState.order_status === 2 && robotState.current_path && robotState.current_path.length > 0) {
    const currentTarget = robotState.current_path[0]; // 현재 목표 노드
    const targetX = currentTarget.position.x;
    const targetY = currentTarget.position.y;
    
    const distance = calculateDistance(
      robotState.position_x, robotState.position_y,
      targetX, targetY
    );
    
    const ARRIVAL_THRESHOLD = 0.2; // 도착 판정 임계값 (0.2m)
    const MOVE_SPEED = 0.02; // 100ms당 0.005m 이동 (초당 0.05m로 더 느리게)
    
    if (distance > ARRIVAL_THRESHOLD) {
      // 아직 목표 지점에 도달하지 않음 - 계속 이동
      const directionX = (targetX - robotState.position_x) / distance;
      const directionY = (targetY - robotState.position_y) / distance;
      
      robotState.position_x += directionX * MOVE_SPEED;
      robotState.position_y += directionY * MOVE_SPEED;
      robotState.velocity_x = directionX * MOVE_SPEED;
      robotState.velocity_y = directionY * MOVE_SPEED;
      robotState.driving_status = 1; // 주행중
      
      // 경로 상태 업데이트
      const totalNodes = robotState.original_path_length || robotState.current_path.length;
      const completed = totalNodes - robotState.current_path.length;
      const progress = Math.floor((completed / totalNodes) * 5);
      robotState.path_status = Array(5).fill(0).map((_, i) => {
        if (i < progress) return 3; // 완료
        if (i === progress) return 2; // 진행중
        return 1; // 계획됨
      });
      
    } else {
      // 현재 목표 노드에 도달
      robotState.position_x = targetX;
      robotState.position_y = targetY;
      robotState.current_path.shift(); // 현재 목표 노드 제거
      
      console.log(`노드 ${currentTarget.name}에 도달했습니다. 남은 경로: ${robotState.current_path.length}개`);
      
      if (robotState.current_path.length === 0) {
        // 모든 경로 완료
        robotState.velocity_x = 0;
        robotState.velocity_y = 0;
        robotState.driving_status = 0; // 정지
        robotState.order_status = 3; // 작업 완료
        robotState.path_status = [3, 3, 3, 3, 3];
        
        console.log(`최종 목표 지점 ${robotState.target_node}에 도달했습니다!`);
        
        // 미션 완료 후 초기화
        setTimeout(() => {
          robotState.order_status = 0; // 대기 상태로 복귀
          robotState.current_mission = null;
          robotState.target_node = null;
          robotState.current_path = [];
          robotState.original_path_length = 0;
          robotState.path_status = [0, 0, 0, 0, 0];
          console.log('미션 완료 - 대기 상태로 복귀');
        }, 3000); // 3초 후 대기 상태로 복귀
      }
    }
  }
  
  // 배터리 소모 시뮬레이션 (100ms 주기에 맞춤)
  if (robotState.driving_status === 1) {
    robotState.battery_soc = Math.max(0, robotState.battery_soc - 0); // 100ms당 0.0001% 소모
  }
  
  // 타임스탬프 업데이트
  robotState.timestamp = new Date().toISOString();
}

// 2초마다 로봇 상태 업데이트 (더 천천히)
setInterval(updateRobotPosition, 50);

// API 엔드포인트들

// GET /api/v1/amr/status - 로봇 상태 조회
app.get('/api/v1/amr/status', (req, res) => {
  console.log('상태 조회 요청 수신');
  
  // 응답용 상태 객체 (내부 상태 제외)
  const responseState = {
    robot_id: robotState.robot_id,
    robot_name: robotState.robot_name,
    robot_model: robotState.robot_model,
    timestamp: robotState.timestamp,
    hw_version: robotState.hw_version,
    sw_version: robotState.sw_version,
    driving_status: robotState.driving_status,
    driving_mode: robotState.driving_mode,
    position_x: parseFloat(robotState.position_x.toFixed(2)),
    position_y: parseFloat(robotState.position_y.toFixed(2)),
    position_theta: parseFloat(robotState.position_theta.toFixed(2)),
    velocity_x: parseFloat(robotState.velocity_x.toFixed(2)),
    velocity_y: parseFloat(robotState.velocity_y.toFixed(2)),
    velocity_theta: parseFloat(robotState.velocity_theta.toFixed(2)),
    connection_status: robotState.connection_status,
    order_status: robotState.order_status,
    path_status: robotState.path_status,
    battery_soc: parseFloat(robotState.battery_soc.toFixed(2)),
    battery_voltage: robotState.battery_voltage,
    battery_soh: robotState.battery_soh,
    charging_status: robotState.charging_status,
    error_code: robotState.error_code,
    error_msg: robotState.error_msg
  };
  
  res.json(responseState);
});

// POST /api/v1/amr/command - 로봇 명령 실행
app.post('/api/v1/amr/command', (req, res) => {
  console.log('명령 요청 수신:', req.body);
  
  const { action, type, params } = req.body;
  
  // 기본 응답 객체
  let response = {
    robot_id: robotState.robot_id,
    order_status: robotState.order_status
  };
  
  try {
    if (action === 'execute' && type === 'navigate') {
      const { goto_node_id } = params;
      
      if (!goto_node_id) {
        return res.status(400).json({
          error: 'goto_node_id가 필요합니다.',
          robot_id: robotState.robot_id,
          order_status: robotState.order_status
        });
      }
      
      // 목표 노드 확인
      const targetNode = findNodeById(goto_node_id);
      if (!targetNode) {
        robotState.error_code = 404;
        robotState.error_msg = `노드 ${goto_node_id}를 찾을 수 없습니다.`;
        robotState.order_status = 4;  // 작업 실패
        
        return res.status(400).json({
          error: robotState.error_msg,
          robot_id: robotState.robot_id,
          order_status: robotState.order_status
        });
      }
      
      // 현재 다른 작업이 실행중이면 거부
      if (robotState.order_status === 2) {
        return res.status(409).json({
          error: '이미 다른 작업이 실행중입니다.',
          robot_id: robotState.robot_id,
          order_status: robotState.order_status
        });
      }
      
      // 경로 생성
      const pathNodes = generatePath(goto_node_id);
      
      if (pathNodes.length === 0) {
        robotState.error_code = 404;
        robotState.error_msg = `노드 ${goto_node_id}로의 경로를 찾을 수 없습니다.`;
        robotState.order_status = 4;  // 작업 실패
        
        return res.status(400).json({
          error: robotState.error_msg,
          robot_id: robotState.robot_id,
          order_status: robotState.order_status
        });
      }
      
      // 새로운 미션 시작
      robotState.current_mission = {
        action,
        type,
        params
      };
      robotState.target_node = goto_node_id;
      robotState.current_path = [...pathNodes]; // 경로 복사
      robotState.original_path_length = pathNodes.length;
      robotState.order_status = 2;  // 작업 실행중
      robotState.mission_start_time = new Date().toISOString();
      robotState.error_code = 0;
      robotState.error_msg = "";
      robotState.driving_mode = 1;  // 자동 모드
      
      console.log(`새로운 네비게이션 미션 시작: ${goto_node_id}, 경로 길이: ${pathNodes.length}`);
      
      response.order_status = 2;
      
    } else if (action === 'stop') {
      // 정지 명령
      robotState.order_status = 0;  // 대기
      robotState.driving_status = 0;  // 정지
      robotState.velocity_x = 0;
      robotState.velocity_y = 0;
      robotState.velocity_theta = 0;
      robotState.current_mission = null;
      robotState.target_node = null;
      robotState.current_path = [];  // 경로 초기화
      robotState.original_path_length = 0;
      robotState.path_status = [0, 0, 0, 0, 0];
      robotState.driving_mode = 0;  // 수동 모드
      
      console.log('로봇 정지 명령 실행');
      response.order_status = 0;
      
    } else {
      return res.status(400).json({
        error: '지원하지 않는 명령입니다.',
        robot_id: robotState.robot_id,
        order_status: robotState.order_status
      });
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('명령 처리 중 오류:', error);
    robotState.error_code = 500;
    robotState.error_msg = error.message;
    robotState.order_status = 4;  // 작업 실패
    
    res.status(500).json({
      error: '내부 서버 오류',
      robot_id: robotState.robot_id,
      order_status: 4
    });
  }
});

// 서버 상태 확인용 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    robot_id: robotState.robot_id
  });
});

// 맵 정보 조회용 엔드포인트 (디버깅용)
app.get('/api/v1/map/nodes', (req, res) => {
  if (!mapData) {
    return res.status(500).json({ error: '맵 데이터가 로드되지 않았습니다.' });
  }
  
  res.json({
    nodes: mapData.node.map(node => ({
      name: node.name,
      index: node.index,
      type: node.type,
      position: node.position,
      connections: node.connection || []
    }))
  });
});

// 현재 경로 정보 조회용 엔드포인트 (디버깅용)
app.get('/api/v1/debug/path', (req, res) => {
  res.json({
    robot_id: robotState.robot_id,
    current_position: {
      x: robotState.position_x,
      y: robotState.position_y
    },
    target_node: robotState.target_node,
    current_path: robotState.current_path.map(node => ({
      name: node.name,
      index: node.index,
      position: node.position
    })),
    original_path_length: robotState.original_path_length,
    path_progress: robotState.original_path_length > 0 ? 
      ((robotState.original_path_length - robotState.current_path.length) / robotState.original_path_length * 100).toFixed(1) + '%' : '0%'
  });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  res.status(500).json({
    error: '내부 서버 오류',
    robot_id: robotState.robot_id
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🤖 가상 AMR 로봇 노드가 시작되었습니다`);
  console.log(`📡 포트: ${PORT}`);
  console.log(`🆔 로봇 ID: ${robotState.robot_id}`);
  console.log(`📍 초기 위치: (${robotState.position_x}, ${robotState.position_y})`);
  console.log(`=================================`);
  console.log(`API 엔드포인트:`);
  console.log(`  GET  /api/v1/amr/status`);
  console.log(`  POST /api/v1/amr/command`);
  console.log(`  GET  /health`);
  console.log(`  GET  /api/v1/map/nodes (디버깅용)`);
  console.log(`  GET  /api/v1/debug/path (경로 디버깅용)`);
  console.log(`=================================`);
  console.log(`🔧 개선 사항:`);
  console.log(`  - 업데이트 주기: 100ms (빠른 응답)`);
  console.log(`  - 이동 속도: 0.05m/초 (더 현실적)`);
  console.log(`  - 도착 임계값: 0.2m`);
  console.log(`  - DFS 기반 경로 계획`);
  console.log(`  - 노드별 순차 이동`);
  console.log(`  - 향상된 디버깅 로그`);
  console.log(`=================================`);
});

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n🛑 AMR 로봇 노드를 종료합니다...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 AMR 로봇 노드를 종료합니다...');
  process.exit(0);
});

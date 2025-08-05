import { useState, useEffect } from 'react';

export const useSimulatedData = (liveDataEnabled = true) => {
  // 가상 실시간 데이터 시뮬레이션
  const [simulatedRobots, setSimulatedRobots] = useState([
    {
      id: 'Robot-001',
      name: 'AGV-Alpha',
      status: 'moving',
      location_x: -5,
      location_y: 3,
      angle: 0, // 동쪽 방향
      battery: 85,
      currentMission: '물품 운반 중',
      destination: '작업장 B',
      speed: 1.2,
      path: [[-5, 3], [-3, 3], [-1, 3], [1, 3], [3, 3], [5, 3]],
      currentPathIndex: 2,
      estimatedTime: '3분 15초'
    },
    {
      id: 'Robot-002',
      name: 'AGV-Beta',
      status: 'charging',
      location_x: -8,
      location_y: 8,
      angle: Math.PI / 2, // 북쪽 방향
      battery: 15,
      currentMission: '충전 중',
      destination: '충전소 A',
      speed: 0,
      path: [],
      currentPathIndex: 0,
      estimatedTime: '45분'
    },
    {
      id: 'Robot-003',
      name: 'AGV-Gamma',
      status: 'idle',
      location_x: 0,
      location_y: 0,
      angle: -Math.PI / 4, // 북서쪽 방향
      battery: 67,
      currentMission: '대기 중',
      destination: null,
      speed: 0,
      path: [],
      currentPathIndex: 0,
      estimatedTime: null
    },
    {
      id: 'Robot-004',
      name: 'AGV-Delta',
      status: 'moving',
      location_x: 6,
      location_y: -4,
      angle: Math.PI, // 서쪽 방향
      battery: 92,
      currentMission: '검수 작업',
      destination: '검수장 C',
      speed: 0.8,
      path: [[6, -4], [4, -4], [2, -4], [0, -4], [-2, -4], [-4, -4]],
      currentPathIndex: 1,
      estimatedTime: '7분 30초'
    },
    {
      id: 'Robot-005',
      name: 'AGV-Echo',
      status: 'error',
      location_x: 2,
      location_y: -6,
      angle: -Math.PI / 2, // 남쪽 방향
      battery: 43,
      currentMission: '오류 발생',
      destination: null,
      speed: 0,
      path: [],
      currentPathIndex: 0,
      estimatedTime: null
    }
  ]);

  // 가상 작업 목록 데이터
  const [simulatedMissions, setSimulatedMissions] = useState([
    {
      id: 'MISSION-001',
      title: '물품 운반 작업',
      status: 'in_progress',
      assignedRobot: 'Robot-001',
      robotName: 'AGV-Alpha',
      priority: 'high',
      type: 'transport',
      startLocation: 'A구역',
      endLocation: '작업장 B',
      startTime: new Date('2024-01-15 14:15:00'),
      estimatedCompletion: new Date('2024-01-15 14:35:00'),
      progress: 65,
      description: '전자부품 5박스를 A구역에서 작업장 B로 이송'
    },
    {
      id: 'MISSION-002',
      title: '검수 작업',
      status: 'in_progress',
      assignedRobot: 'Robot-004',
      robotName: 'AGV-Delta',
      priority: 'medium',
      type: 'inspection',
      startLocation: '검수장 C',
      endLocation: '검수장 C',
      startTime: new Date('2024-01-15 14:00:00'),
      estimatedCompletion: new Date('2024-01-15 14:40:00'),
      progress: 45,
      description: '완제품 50개 품질 검사'
    },
    {
      id: 'MISSION-003',
      title: '창고 정리',
      status: 'completed',
      assignedRobot: 'Robot-005',
      robotName: 'AGV-Echo',
      priority: 'low',
      type: 'organize',
      startLocation: 'D구역',
      endLocation: 'D구역',
      startTime: new Date('2024-01-15 13:30:00'),
      estimatedCompletion: new Date('2024-01-15 14:00:00'),
      progress: 100,
      description: 'D구역 물품 정리 및 재배치'
    },
    {
      id: 'MISSION-004',
      title: '포장 작업',
      status: 'completed',
      assignedRobot: 'Robot-005',
      robotName: 'AGV-Echo',
      priority: 'medium',
      type: 'packaging',
      startLocation: '포장실',
      endLocation: '출고대기실',
      startTime: new Date('2024-01-15 11:30:00'),
      estimatedCompletion: new Date('2024-01-15 12:30:00'),
      progress: 100,
      description: '완제품 30박스 포장 및 출고 준비'
    },
    {
      id: 'MISSION-005',
      title: '긴급 배송',
      status: 'pending',
      assignedRobot: null,
      robotName: null,
      priority: 'urgent',
      type: 'transport',
      startLocation: '긴급창고',
      endLocation: '출고구',
      startTime: null,
      estimatedCompletion: null,
      progress: 0,
      description: '긴급 주문 건 즉시 배송 필요'
    },
    {
      id: 'MISSION-006',
      title: '정기 점검',
      status: 'pending',
      assignedRobot: 'Robot-003',
      robotName: 'AGV-Gamma',
      priority: 'low',
      type: 'maintenance',
      startLocation: '점검소',
      endLocation: '점검소',
      startTime: new Date('2024-01-15 16:00:00'),
      estimatedCompletion: new Date('2024-01-15 16:30:00'),
      progress: 0,
      description: '정기 시스템 점검 및 센서 교정'
    }
  ]);

  // 로봇 위치 시뮬레이션 업데이트
  useEffect(() => {
    if (!liveDataEnabled) return;

    const interval = setInterval(() => {
      setSimulatedRobots(prev => prev.map(robot => {
        if (robot.status === 'moving' && robot.path.length > 0) {
          const nextIndex = (robot.currentPathIndex + 1) % robot.path.length;
          const nextPos = robot.path[nextIndex];
          return {
            ...robot,
            location_x: nextPos[0],
            location_y: nextPos[1],
            currentPathIndex: nextIndex
          };
        }
        return robot;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [liveDataEnabled]);

  return {
    simulatedRobots,
    simulatedMissions,
    setSimulatedRobots,
    setSimulatedMissions
  };
}; 
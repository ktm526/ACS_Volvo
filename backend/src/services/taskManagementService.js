const Robot = require('../models/Robot');
const Mission = require('../models/Mission');
const axios = require('axios');

class TaskManagementService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.pollInterval = 3000; // 3초마다 태스크 관리 (3초 주기)
    this.httpTimeout = 5000; // HTTP 요청 타임아웃 5초
  }

  // 서비스 시작
  start() {
    if (this.isRunning) {
      console.log('태스크 관리 서비스가 이미 실행 중입니다.');
      return;
    }

    console.log('태스크 관리 서비스를 시작합니다...');
    this.isRunning = true;
    
    // 즉시 한 번 실행
    this.manageTasks();
    
    // 주기적 실행 시작
    this.intervalId = setInterval(() => {
      this.manageTasks();
    }, this.pollInterval);

    console.log(`태스크 관리 서비스가 ${this.pollInterval/1000}초 간격으로 시작되었습니다.`);
  }

  // 서비스 중지
  stop() {
    if (!this.isRunning) {
      console.log('태스크 관리 서비스가 이미 중지되었습니다.');
      return;
    }

    console.log('태스크 관리 서비스를 중지합니다...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('태스크 관리 서비스가 중지되었습니다.');
  }

  // 메인 태스크 관리 로직
  async manageTasks() {
    try {
      console.log('태스크 관리 실행...');
      
      // 1. 대기 중인 로봇에 태스크 할당
      await this.assignTasksToIdleRobots();
      
      // 2. 실행 중인 태스크 진행 관리
      await this.manageExecutingTasks();
      
    } catch (error) {
      console.error('태스크 관리 중 오류 발생:', error);
    }
  }

  // 1. 대기 중인 로봇에 태스크 할당
  async assignTasksToIdleRobots() {
    try {
      // 대기 상태이고 할당된 태스크가 없는 로봇들 조회
      const idleRobots = await this.getIdleRobots();
      if (idleRobots.length === 0) {
        console.log('대기 중인 로봇이 없습니다.');
        return;
      }

      // 할당되지 않은 pending 상태의 태스크들 조회 (우선순위, 생성시간 순)
      const availableTasks = await this.getAvailableTasks();
      if (availableTasks.length === 0) {
        console.log('할당 가능한 태스크가 없습니다.');
        return;
      }

      console.log(`대기 중인 로봇 ${idleRobots.length}개, 할당 가능한 태스크 ${availableTasks.length}개`);

      // 태스크를 로봇에 할당
      for (let i = 0; i < Math.min(idleRobots.length, availableTasks.length); i++) {
        const robot = idleRobots[i];
        const task = availableTasks[i];
        
        await this.assignTaskToRobot(robot, task);
      }

    } catch (error) {
      console.error('태스크 할당 중 오류:', error);
    }
  }

  // 2. 실행 중인 태스크 진행 관리
  async manageExecutingTasks() {
    try {
      // 태스크를 수행 중인 로봇들 조회
      const busyRobots = await this.getBusyRobots();
      
      for (const robot of busyRobots) {
        await this.manageRobotTask(robot);
      }

    } catch (error) {
      console.error('실행 중인 태스크 관리 중 오류:', error);
    }
  }

  // 대기 중인 로봇들 조회
  async getIdleRobots() {
    try {
      const robots = await Robot.findAll();
      return robots.filter(robot => 
        robot.status === 'idle' && 
        robot.connection_status === true &&
        (!robot.current_task_id || robot.task_status === 'idle')
      );
    } catch (error) {
      console.error('대기 중인 로봇 조회 오류:', error);
      return [];
    }
  }

  // 태스크 수행 중인 로봇들 조회
  async getBusyRobots() {
    try {
      const robots = await Robot.findAll();
      return robots.filter(robot => 
        robot.current_task_id && 
        robot.task_status !== 'idle' && 
        robot.connection_status === true
      );
    } catch (error) {
      console.error('태스크 수행 중인 로봇 조회 오류:', error);
      return [];
    }
  }

  // 할당 가능한 태스크들 조회 (우선순위, 생성시간 순)
  async getAvailableTasks() {
    try {
      const missions = await Mission.findAll();
      
      // pending 상태이고 로봇이 할당되지 않은 태스크들
      const unassignedTasks = missions.filter(mission => 
        mission.status === 'pending' && !mission.robot_id
      );

      // 우선순위별 가중치 (high: 3, medium: 2, low: 1)
      const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };

      // 우선순위와 생성시간으로 정렬
      return unassignedTasks.sort((a, b) => {
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff; // 우선순위가 높은 것 먼저
        
        return new Date(a.created_at) - new Date(b.created_at); // 같은 우선순위면 먼저 생성된 것
      });

    } catch (error) {
      console.error('할당 가능한 태스크 조회 오류:', error);
      return [];
    }
  }

  // 특정 로봇에 할당된 태스크들 조회 (우선순위, 생성시간 순)
  async getAssignedTasksForRobot(robotId) {
    try {
      const missions = await Mission.findByRobotId(robotId);
      
      // pending 상태인 태스크들만
      const pendingTasks = missions.filter(mission => mission.status === 'pending');

      // 우선순위별 가중치
      const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };

      // 우선순위와 생성시간으로 정렬
      return pendingTasks.sort((a, b) => {
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(a.created_at) - new Date(b.created_at);
      });

    } catch (error) {
      console.error('로봇별 할당된 태스크 조회 오류:', error);
      return [];
    }
  }

  // 로봇에 태스크 할당
  async assignTaskToRobot(robot, task) {
    try {
      console.log(`로봇 ${robot.name}(ID: ${robot.id})에 태스크 "${task.name}"(ID: ${task.id}) 할당`);

      // 로봇에 태스크 정보 저장
      await robot.update({
        current_task_id: task.id,
        current_waypoint_index: 0,
        task_status: 'executing'
      });

      // 태스크 상태를 in_progress로 변경하고 로봇 할당
      await task.update({
        status: 'in_progress',
        robot_id: robot.id
      });

      // 첫 번째 웨이포인트로 이동 명령 전송
      if (task.waypoints && task.waypoints.length > 0) {
        await this.sendMoveCommand(robot, task.waypoints[0]);
      }

      console.log(`태스크 할당 완료: ${robot.name} -> ${task.name}`);

    } catch (error) {
      console.error(`태스크 할당 실패 (로봇: ${robot.name}, 태스크: ${task.name}):`, error);
    }
  }

  // 로봇의 태스크 진행 관리
  async manageRobotTask(robot) {
    try {
      // 현재 태스크 정보 가져오기
      const currentTask = await Mission.findById(robot.current_task_id);
      if (!currentTask) {
        console.log(`로봇 ${robot.name}의 현재 태스크를 찾을 수 없습니다.`);
        await this.resetRobotTask(robot);
        return;
      }

      // order_status가 0이면 이동 완료
      if (robot.order_status === 0) {
        await this.handleWaypointCompleted(robot, currentTask);
      }

    } catch (error) {
      console.error(`로봇 ${robot.name}의 태스크 관리 중 오류:`, error);
    }
  }

  // 웨이포인트 완료 처리
  async handleWaypointCompleted(robot, task) {
    try {
      const currentWaypointIndex = robot.current_waypoint_index;
      const waypoints = task.waypoints;

      console.log(`로봇 ${robot.name}: 웨이포인트 ${currentWaypointIndex + 1}/${waypoints.length} 완료`);

      // 진행률 업데이트
      const progress = Math.round(((currentWaypointIndex + 1) / waypoints.length) * 100);
      await task.updateProgress(progress);

      // 다음 웨이포인트가 있는지 확인
      if (currentWaypointIndex + 1 < waypoints.length) {
        // 다음 웨이포인트로 이동
        const nextWaypointIndex = currentWaypointIndex + 1;
        const nextWaypoint = waypoints[nextWaypointIndex];

        await robot.update({
          current_waypoint_index: nextWaypointIndex
        });

        await this.sendMoveCommand(robot, nextWaypoint);
        
        console.log(`로봇 ${robot.name}: 다음 웨이포인트 ${nextWaypointIndex + 1}로 이동 명령 전송`);

      } else {
        // 모든 웨이포인트 완료 - 태스크 종료
        await this.completeTask(robot, task);
      }

    } catch (error) {
      console.error(`웨이포인트 완료 처리 중 오류 (로봇: ${robot.name}):`, error);
    }
  }

  // 태스크 완료 처리
  async completeTask(robot, task) {
    try {
      console.log(`로봇 ${robot.name}: 태스크 "${task.name}" 완료`);

      // 로봇 상태 초기화
      await robot.update({
        current_task_id: null,
        current_waypoint_index: 0,
        task_status: 'idle'
      });

      // 태스크 상태를 완료로 변경
      await task.updateStatus('completed');

      // 해당 로봇에 할당된 다른 태스크가 있는지 확인
      const nextTasks = await this.getAssignedTasksForRobot(robot.id);
      if (nextTasks.length > 0) {
        // 다음 태스크 할당
        await this.assignTaskToRobot(robot, nextTasks[0]);
      }

    } catch (error) {
      console.error(`태스크 완료 처리 중 오류 (로봇: ${robot.name}):`, error);
    }
  }

  // 로봇 태스크 초기화
  async resetRobotTask(robot) {
    try {
      await robot.update({
        current_task_id: null,
        current_waypoint_index: 0,
        task_status: 'idle'
      });
      console.log(`로봇 ${robot.name}의 태스크 상태 초기화`);
    } catch (error) {
      console.error(`로봇 태스크 초기화 오류 (로봇: ${robot.name}):`, error);
    }
  }

  // AMR에 이동 명령 전송
  async sendMoveCommand(robot, waypoint) {
    try {
      if (!robot.ip_address) {
        console.error(`로봇 ${robot.name}의 IP 주소가 설정되지 않았습니다.`);
        return false;
      }

      const port = robot.port || 80;
      const url = `http://${robot.ip_address}:${port}/api/v1/amr/command`;
      
      // 실제 AMR API 스펙에 맞는 명령 데이터
      const commandData = {
        action: "execute",
        type: "navigate",
        params: {
          goto_node_id: waypoint.stationName || waypoint.name || `Node_${waypoint.stationId || waypoint.id}`
        }
      };

      console.log(`로봇 ${robot.name}에 이동 명령 전송:`, commandData);

      const response = await axios.post(url, commandData, {
        timeout: this.httpTimeout,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        console.log(`로봇 ${robot.name} 이동 명령 성공`);
        return true;
      } else {
        console.error(`로봇 ${robot.name} 이동 명령 실패: HTTP ${response.status}`);
        return false;
      }

    } catch (error) {
      console.error(`로봇 ${robot.name} 이동 명령 전송 오류:`, error.message);
      return false;
    }
  }

  // AMR 상태 조회 (참고용 - 현재는 robotStatusService에서 처리)
  async getRobotStatus(robot) {
    try {
      if (!robot.ip_address) {
        console.error(`로봇 ${robot.name}의 IP 주소가 설정되지 않았습니다.`);
        return null;
      }

      const port = robot.port || 80;
      const url = `http://${robot.ip_address}:${port}/api/v1/AMR/status`;

      const response = await axios.get(url, {
        timeout: this.httpTimeout,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.status === 200) {
        return response.data;
      } else {
        console.error(`로봇 ${robot.name} 상태 조회 실패: HTTP ${response.status}`);
        return null;
      }

    } catch (error) {
      console.error(`로봇 ${robot.name} 상태 조회 오류:`, error.message);
      return null;
    }
  }

  // 현재 실행 상태 정보
  getStatus() {
    return {
      isRunning: this.isRunning,
      pollInterval: this.pollInterval,
      httpTimeout: this.httpTimeout
    };
  }
}

// 싱글톤 인스턴스
const taskManagementService = new TaskManagementService();

module.exports = taskManagementService; 
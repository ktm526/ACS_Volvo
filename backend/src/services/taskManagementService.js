const Robot = require('../models/Robot');
const Mission = require('../models/Mission');
const axios = require('axios');
const Logger = require('../utils/logger');
const { query } = require('../database/connection');

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
      //Logger.info('태스크 관리 서비스가 이미 실행 중입니다.');
      return;
    }

    //Logger.info('🚀 태스크 관리 서비스를 시작합니다...');
    this.isRunning = true;
    
    // 즉시 한 번 실행
    this.manageTasks();
    
    // 주기적 실행 시작
    this.intervalId = setInterval(() => {
      this.manageTasks();
    }, this.pollInterval);

    //Logger.info(`✅ 태스크 관리 서비스가 ${this.pollInterval/1000}초 간격으로 시작되었습니다.`);
  }

  // 서비스 중지
  stop() {
    if (!this.isRunning) {
     // Logger.info('태스크 관리 서비스가 이미 중지되었습니다.');
      return;
    }

    //Logger.info('🛑 태스크 관리 서비스를 중지합니다...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    //Logger.info('✅ 태스크 관리 서비스가 중지되었습니다.');
  }

  // 메인 태스크 관리 로직
  async manageTasks() {
    try {
      //Logger.info('🔄 === 태스크 관리 사이클 시작 ===');
      
      // 1. 대기 중인 로봇에 태스크 할당
      await this.assignTasksToIdleRobots();
      
      // 2. 실행 중인 태스크 진행 관리
      await this.manageExecutingTasks();
      
      // 3. 완료/취소된 작업 정리 (1분 후)
      await this.cleanupCompletedTasks();
      
      //Logger.info('✅ === 태스크 관리 사이클 완료 ===\n');
      
    } catch (error) {
      //Logger.error('❌ 태스크 관리 중 오류 발생:', { error: error.message, stack: error.stack });
    }
  }

  // 1. 대기 중인 로봇에 태스크 할당
  async assignTasksToIdleRobots() {
    try {
     // Logger.info('📋 대기 중인 로봇에 태스크 할당 시작...');
      
      // 대기 상태이고 할당된 태스크가 없는 로봇들 조회
      const idleRobots = await this.getIdleRobots();
      //Logger.info(`🤖 대기 중인 로봇: ${idleRobots.length}개`);
      
      if (idleRobots.length > 0) {
        idleRobots.forEach(robot => {
         //Logger.info(`   - ${robot.name} (ID: ${robot.id}, 상태: ${robot.status}, 연결: ${robot.connection_status}, 태스크상태: ${robot.task_status})`);
        });
      }

      // 할당되지 않은 pending 상태의 태스크들 조회 (우선순위, 생성시간 순)
      const availableTasks = await this.getAvailableTasks();
      //Logger.info(`📝 할당 가능한 태스크: ${availableTasks.length}개`);
      
      if (availableTasks.length > 0) {
        availableTasks.forEach((task, index) => {
          //Logger.info(`   ${index + 1}. "${task.name}" (ID: ${task.id}, 우선순위: ${task.priority}, 상태: ${task.status}, 할당로봇: ${task.robot_id || 'none'})`);
        });
      }

      if (idleRobots.length === 0) {
        //Logger.info('⏸️  할당할 수 있는 대기 중인 로봇이 없습니다.');
        return;
      }

      if (availableTasks.length === 0) {
        //Logger.info('📭 할당 가능한 태스크가 없습니다.');
        return;
      }

      //Logger.info(`🎯 태스크 할당 시작: ${Math.min(idleRobots.length, availableTasks.length)}개 할당 예정`);

      // 태스크를 로봇에 할당
      for (let i = 0; i < Math.min(idleRobots.length, availableTasks.length); i++) {
        const robot = idleRobots[i];
        const task = availableTasks[i];
        
        await this.assignTaskToRobot(robot, task);
      }

    } catch (error) {
      //Logger.error('❌ 태스크 할당 중 오류:', { error: error.message, stack: error.stack });
    }
  }

  // 2. 실행 중인 태스크 진행 관리
  async manageExecutingTasks() {
    try {
      //Logger.info('⚡ 실행 중인 태스크 진행 관리 시작...');
      
      // 태스크를 수행 중인 로봇들 조회
      const busyRobots = await this.getBusyRobots();
      //Logger.info(`🏃 작업 중인 로봇: ${busyRobots.length}개`);
      
      if (busyRobots.length > 0) {
        busyRobots.forEach(robot => {
         // Logger.info(`   - ${robot.name} (태스크ID: ${robot.current_task_id}, order_status: ${robot.order_status}, 웨이포인트: ${robot.current_waypoint_index})`);
        });
      }
      
      for (const robot of busyRobots) {
        await this.manageRobotTask(robot);
      }

    } catch (error) {
      Logger.error('❌ 실행 중인 태스크 관리 중 오류:', { error: error.message, stack: error.stack });
    }
  }

  // 대기 중인 로봇들 조회
  async getIdleRobots() {
    try {
      const robots = await Robot.findAll();
      const idleRobots = robots.filter(robot => 
        // 태스크 할당 가능한 상태: idle (대기) 상태만
        robot.status === 'idle' && 
        (robot.connection_status === true || robot.connection_status === 1) &&
        (!robot.current_task_id || robot.task_status === 'idle')
      );
      
      //Logger.debug(`전체 로봇 ${robots.length}개 중 태스크 할당 가능한 로봇 ${idleRobots.length}개 발견`);
      //Logger.debug(`상태별 로봇: idle=${robots.filter(r => r.status === 'idle').length}, stop=${robots.filter(r => r.status === 'stop').length}, working=${robots.filter(r => r.status === 'working').length}, pause=${robots.filter(r => r.status === 'pause').length}`);
      return idleRobots;
    } catch (error) {
      Logger.error('❌ 대기 중인 로봇 조회 오류:', { error: error.message });
      return [];
    }
  }

  // 태스크 수행 중인 로봇들 조회
  async getBusyRobots() {
    try {
      const robots = await Robot.findAll();
              const busyRobots = robots.filter(robot => 
          robot.current_task_id && 
          robot.task_status !== 'idle' && 
          (robot.connection_status === true || robot.connection_status === 1)
        );
      
      //Logger.debug(`전체 로봇 ${robots.length}개 중 작업 중인 로봇 ${busyRobots.length}개 발견`);
      return busyRobots;
    } catch (error) {
      Logger.error('❌ 태스크 수행 중인 로봇 조회 오류:', { error: error.message });
      return [];
    }
  }

  // 할당 가능한 태스크들 조회 (우선순위, 생성시간 순)
  async getAvailableTasks() {
    try {
      const missions = await Mission.findAll();
      //Logger.debug(`전체 미션 ${missions.length}개 조회됨`);
      
      // pending 상태이고 로봇이 할당되지 않은 태스크들
      const unassignedTasks = missions.filter(mission => 
        mission.status === 'pending' && !mission.robot_id
      );

      //Logger.debug(`pending 상태이고 미할당 태스크 ${unassignedTasks.length}개 발견`);

      // 우선순위별 가중치 (high: 3, medium: 2, low: 1)
      const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };

      // 우선순위와 생성시간으로 정렬
      return unassignedTasks.sort((a, b) => {
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff; // 우선순위가 높은 것 먼저
        
        return new Date(a.created_at) - new Date(b.created_at); // 같은 우선순위면 먼저 생성된 것
      });

    } catch (error) {
      Logger.error('❌ 할당 가능한 태스크 조회 오류:', { error: error.message });
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
      Logger.error('❌ 로봇별 할당된 태스크 조회 오류:', { error: error.message });
      return [];
    }
  }

  // 로봇에 태스크 할당
  async assignTaskToRobot(robot, task) {
    try {
     // Logger.info(`🎯 로봇 ${robot.name}(ID: ${robot.id})에 태스크 "${task.name}"(ID: ${task.id}) 할당 시작`);

      // 로봇에 태스크 정보 저장 및 상태를 working으로 변경
      await robot.update({
        current_task_id: task.id,
        current_waypoint_index: 0,
        task_status: 'executing',
        status: 'working',  // 로봇 상태를 working으로 변경 (order_status: 2에 해당)
        last_command_sent: new Date()  // 명령 전송 시간 기록
      });

      // 태스크 상태를 in_progress로 변경하고 로봇 할당
      await task.update({
        status: 'in_progress',
        robot_id: robot.id
      });

      this.logTaskActivity('START', { robot, mission: task });

      //Logger.info(`✅ 데이터베이스 업데이트 완료: 로봇 상태 = working, 태스크 상태 = executing, 미션 상태 = in_progress`);

      // 첫 번째 웨이포인트로 이동 명령 전송
      if (task.waypoints && task.waypoints.length > 0) {
        //Logger.info(`📍 웨이포인트 ${task.waypoints.length}개 중 첫 번째로 이동 명령 전송`);
        const moveResult = await this.sendMoveCommand(robot, task.waypoints[0]);
        if (moveResult) {
          //Logger.info(`✅ 이동 명령 전송 성공`);
        } else {
          //Logger.warn(`⚠️  이동 명령 전송 실패 - 로봇이 응답하지 않음`);
        }
      } else {
        //Logger.warn(`⚠️  태스크에 웨이포인트가 없습니다.`);
      }

      //Logger.info(`🎉 태스크 할당 완료: ${robot.name} -> ${task.name}`);

    } catch (error) {
      Logger.error(`❌ 태스크 할당 실패 (로봇: ${robot.name}, 태스크: ${task.name}):`, { error: error.message, stack: error.stack });
    }
  }

  // 로봇의 태스크 진행 관리
  async manageRobotTask(robot) {
    try {
      // 현재 태스크 정보 가져오기
      const currentTask = await Mission.findById(robot.current_task_id);
      if (!currentTask) {
        //Logger.warn(`❓ 로봇 ${robot.name}의 현재 태스크(ID: ${robot.current_task_id})를 찾을 수 없습니다.`);
        await this.resetRobotTask(robot);
        return;
      }

      //Logger.debug(`🔍 로봇 ${robot.name}: 태스크 "${currentTask.name}" 진행 상황 확인 (order_status: ${robot.order_status})`);

      // 명령 전송 후 최소 대기 시간 (5초)을 확인하여 즉시 완료 방지
      const lastCommandTime = robot.last_command_sent ? new Date(robot.last_command_sent) : null;
      const timeSinceCommand = lastCommandTime ? Date.now() - lastCommandTime.getTime() : Infinity;
      const minWaitTime = 5000; // 5초

      // order_status가 0이고 충분한 시간이 지났으면 이동 완료
      if (robot.order_status === 0 && timeSinceCommand > minWaitTime) {
        //Logger.info(`✅ 로봇 ${robot.name}: 이동 완료 감지 (order_status = 0, 대기시간: ${Math.round(timeSinceCommand/1000)}초)`);
        await this.handleWaypointCompleted(robot, currentTask);
      } else if (robot.order_status === 0) {
        //Logger.debug(`⏱️  로봇 ${robot.name}: 이동 완료 감지했지만 대기 중... (경과시간: ${Math.round(timeSinceCommand/1000)}초/${minWaitTime/1000}초)`);
      } else {
        //Logger.debug(`🚶 로봇 ${robot.name}: 이동 중... (order_status: ${robot.order_status})`);
      }

    } catch (error) {
      Logger.error(`❌ 로봇 ${robot.name}의 태스크 관리 중 오류:`, { error: error.message, stack: error.stack });
    }
  }

  // 웨이포인트 완료 처리
  async handleWaypointCompleted(robot, task) {
    try {
      const currentWaypointIndex = robot.current_waypoint_index;
      const waypoints = task.waypoints;

      //Logger.info(`🎯 로봇 ${robot.name}: 웨이포인트 ${currentWaypointIndex + 1}/${waypoints.length} 완료`);

      // 진행률 업데이트
      const progress = Math.round(((currentWaypointIndex + 1) / waypoints.length) * 100);
      await task.updateProgress(progress);
      //Logger.info(`📊 진행률 업데이트: ${progress}%`);

      // 다음 웨이포인트가 있는지 확인
      if (currentWaypointIndex + 1 < waypoints.length) {
        // 다음 웨이포인트로 이동
        const nextWaypointIndex = currentWaypointIndex + 1;
        const nextWaypoint = waypoints[nextWaypointIndex];

        await robot.update({
          current_waypoint_index: nextWaypointIndex,
          last_command_sent: new Date()  // 새 명령 전송 시간 기록
        });

        await this.sendMoveCommand(robot, nextWaypoint);
        
        //Logger.info(`➡️  로봇 ${robot.name}: 다음 웨이포인트 ${nextWaypointIndex + 1}로 이동 명령 전송`);

      } else {
        // 모든 웨이포인트 완료 - 태스크 종료
        //Logger.info(`🏁 로봇 ${robot.name}: 모든 웨이포인트 완료! 태스크 종료 처리`);
        await this.completeTask(robot, task);
      }

    } catch (error) {
      //Logger.error(`❌ 웨이포인트 완료 처리 중 오류 (로봇: ${robot.name}):`, { error: error.message, stack: error.stack });
    }
  }

  // 태스크 완료 처리
  async completeTask(robot, task) {
    try {
      //Logger.info(`🎉 로봇 ${robot.name}: 태스크 "${task.name}" 완료 처리 시작`);

      // 로봇 상태 초기화
      await robot.update({
        current_task_id: null,
        current_waypoint_index: 0,
        task_status: 'idle',
        status: 'idle',  // 로봇 상태를 idle로 변경
        last_command_sent: null  // 명령 시간 초기화
      });

      // 태스크 상태를 완료로 변경
      await task.updateStatus('completed');

      this.logTaskActivity('DONE', { robot, mission: task });

      //Logger.info(`✅ 태스크 완료: ${robot.name} -> ${task.name}`);

      // 해당 로봇에 할당된 다른 태스크가 있는지 확인
      const nextTasks = await this.getAssignedTasksForRobot(robot.id);
      if (nextTasks.length > 0) {
        //Logger.info(`📋 로봇 ${robot.name}에 대기 중인 다음 태스크 ${nextTasks.length}개 발견`);
        // 다음 태스크 할당
        await this.assignTaskToRobot(robot, nextTasks[0]);
        return;
      }

      // 시스템 전역 대기 태스크가 있다면 복귀 미션을 만들지 않고 종료
      const availableTasks = await this.getAvailableTasks();
      if (availableTasks.length > 0) {
        //Logger.info(`📝 대기 중인 다른 작업이 있어 HOME 복귀 미션을 생성하지 않습니다.`);
        return;
      }

      // 이미 HOME 복귀 미션을 수행 중이거나 방금 완료했다면 중복 생성 방지
      if (task.mission_type === 'return_home') {
        //Logger.info(`🏠 로봇 ${robot.name}: HOME 복귀 미션 완료, 추가 미션 없음`);
        return;
      }

      const hasReturnHomeMission = await this.hasActiveReturnHomeMission(robot.id);
      if (hasReturnHomeMission) {
        //Logger.info(`🏠 로봇 ${robot.name}: 진행 중인 HOME 복귀 미션 존재`);
        return;
      }

      await this.createReturnHomeMission(robot);

    } catch (error) {
      Logger.error(`❌ 태스크 완료 처리 중 오류 (로봇: ${robot.name}):`, { error: error.message, stack: error.stack });
    }
  }

  // 로봇 태스크 초기화
  async resetRobotTask(robot) {
    try {
      await robot.update({
        current_task_id: null,
        current_waypoint_index: 0,
        task_status: 'idle',
        status: 'idle',  // 로봇 상태를 idle로 변경
        last_command_sent: null  // 명령 시간 초기화
      });
      //Logger.info(`🔄 로봇 ${robot.name}의 태스크 상태 초기화`);
    } catch (error) {
      Logger.error(`❌ 로봇 태스크 초기화 오류 (로봇: ${robot.name}):`, { error: error.message });
    }
  }

  // AMR에 이동 명령 전송
  async sendMoveCommand(robot, waypoint) {
    try {
      if (!robot.ip_address) {
        Logger.error(`❌ 로봇 ${robot.name}의 IP 주소가 설정되지 않았습니다.`);
        return false;
      }

      const port = robot.port || 80;
      const url = `http://${robot.ip_address}:${port}/api/v1/amr/command`;
      
      // 실제 AMR API 스펙에 맞는 명령 데이터 (station index를 문자열로 전송)
      const commandData = {
        action: "execute",
        type: "navigate",
        params: {
          goto_node_id: String(waypoint.stationId) // 이제 stationId는 node_index 값
        }
      };

      // Logger.info(`📍 웨이포인트 정보:`, {
      //   stationId: waypoint.stationId,
      //   stationName: waypoint.stationName,
      //   stepType: waypoint.stepType,
      //   coordinates: { x: waypoint.x, y: waypoint.y }
      // });

      // Logger.info(`📡 로봇 ${robot.name}에 이동 명령 전송:`, commandData);
      // Logger.info(`🌐 요청 URL: ${url}`);

      const response = await axios.post(url, commandData, {
        timeout: this.httpTimeout,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // Logger.info(`📥 응답 수신: HTTP ${response.status}`);
      // Logger.info(`📄 응답 데이터: ${JSON.stringify(response.data, null, 2)}`);

      if (response.status === 200) {
        //Logger.info(`✅ 로봇 ${robot.name} 이동 명령 성공`);
        return true;
      } else {
        Logger.error(`❌ 로봇 ${robot.name} 이동 명령 실패: HTTP ${response.status}`);
        return false;
      }

    } catch (error) {
      Logger.error(`❌ 로봇 ${robot.name} 이동 명령 전송 오류: ${error.message}`);
      if (error.response) {
        Logger.error(`📊 HTTP 상태: ${error.response.status}`);
        Logger.error(`📄 응답 데이터: ${JSON.stringify(error.response.data)}`);
      } else if (error.code) {
        Logger.error(`🔢 오류 코드: ${error.code}`);
      }
      return false;
    }
  }

  // AMR 상태 조회 (참고용 - 현재는 robotStatusService에서 처리)
  async getRobotStatus(robot) {
    try {
      if (!robot.ip_address) {
        Logger.error(`❌ 로봇 ${robot.name}의 IP 주소가 설정되지 않았습니다.`);
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
        Logger.error(`❌ 로봇 ${robot.name} 상태 조회 실패: HTTP ${response.status}`);
        return null;
      }

    } catch (error) {
      Logger.error(`❌ 로봇 ${robot.name} 상태 조회 오류:`, { error: error.message });
      return null;
    }
  }

  // 3. 완료/취소된 작업 정리 (1분 후 자동 삭제)
  async cleanupCompletedTasks() {
    try {
      //Logger.debug('🧹 완료/취소된 작업 정리 시작...');
      
      // 1분(60초) 전 시간 계산
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      
      // 완료/취소된 상태이고 1분이 지난 미션들 조회
      const completedMissions = await Mission.findCompletedBefore(oneMinuteAgo);
      
      if (completedMissions && completedMissions.length > 0) {
        //Logger.info(`🗑️  ${completedMissions.length}개의 완료/취소된 작업을 정리합니다:`);
        
        for (const mission of completedMissions) {
          try {
            const timeAgo = Math.floor((Date.now() - new Date(mission.updated_at).getTime()) / 1000);
            //Logger.info(`   - "${mission.name}" (ID: ${mission.id}, 상태: ${mission.status}, ${timeAgo}초 전 완료)`);
            
            await mission.delete();
            //Logger.debug(`   ✅ 미션 ${mission.id} 삭제 완료`);
            
          } catch (deleteError) {
            //Logger.error(`   ❌ 미션 ${mission.id} 삭제 실패: ${deleteError.message}`);
          }
        }
        
        //Logger.info(`✅ ${completedMissions.length}개 작업 정리 완료`);
      } else {
        //Logger.debug('🧹 정리할 완료/취소된 작업이 없습니다.');
      }
      
    } catch (error) {
      Logger.error('❌ 완료된 작업 정리 중 오류:', { error: error.message, stack: error.stack });
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

  async hasActiveReturnHomeMission(robotId) {
    try {
      const missions = await Mission.findByRobotId(robotId);
      return missions.some(mission =>
        mission.mission_type === 'return_home' &&
        (mission.status === 'pending' || mission.status === 'in_progress')
      );
    } catch (error) {
      Logger.error('❌ HOME 복귀 미션 상태 확인 중 오류:', { error: error.message });
      return false;
    }
  }

  async createReturnHomeMission(robot) {
    try {
      const homeNode = await this.getHomeNode();
      if (!homeNode) {
        this.logTaskActivity('HOME_DISPATCH', {
          robot,
          info: 'HOME 노드를 찾을 수 없어 복귀 미션을 생성하지 못했습니다.'
        });
        return;
      }

      const waypoint = {
        stationId: homeNode.node_index !== undefined ? String(homeNode.node_index) : String(homeNode.id),
        stationName: homeNode.name,
        stepType: 'navigate',
        mapId: homeNode.map_id,
        x: homeNode.position_x,
        y: homeNode.position_y,
        yaw: homeNode.yaw
      };

      const mission = await Mission.create({
        name: `${robot.name} HOME 복귀`,
        mission_type: 'return_home',
        priority: 'high',
        waypoints: [waypoint],
        description: '작업 완료 후 자동 생성된 HOME 복귀 임무'
      });

      this.logTaskActivity('HOME_DISPATCH', {
        robot,
        mission,
        info: `target:${waypoint.stationName || 'HOME'} (#${waypoint.stationId})`
      });

      await this.assignTaskToRobot(robot, mission);
    } catch (error) {
      Logger.error('❌ HOME 복귀 미션 생성 중 오류:', { error: error.message, stack: error.stack });
    }
  }

  async getHomeNode() {
    try {
      const rows = await query(
        'SELECT * FROM map_nodes WHERE LOWER(name) = LOWER(?) ORDER BY id DESC LIMIT 1',
        ['HOME']
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      Logger.error('❌ HOME 노드 조회 중 오류:', { error: error.message });
      return null;
    }
  }

  logTaskActivity(type, { robot, mission, info }) {
    const timestamp = new Date().toISOString();
    let label = '';
    switch (type) {
      case 'START':
        label = '작업 시작';
        break;
      case 'DONE':
        label = mission?.mission_type === 'return_home' ? 'HOME 복귀 완료' : '작업 완료';
        break;
      case 'HOME_DISPATCH':
        label = 'HOME 복귀 요청';
        break;
      default:
        label = type;
        break;
    }

    const parts = [
      `[${timestamp}] ${label}`,
      robot ? `로봇:${robot.name || robot.id}` : null,
      mission ? `미션:${mission.name || mission.id}${mission.mission_type ? ` (${mission.mission_type})` : ''}` : null,
      info || null
    ].filter(Boolean);

    if (parts.length > 0) {
      console.log(parts.join(' | '));
    }
  }
}

// 싱글톤 인스턴스
const taskManagementService = new TaskManagementService();

module.exports = taskManagementService; 
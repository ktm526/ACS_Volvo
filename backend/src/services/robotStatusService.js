const axios = require('axios');
const Robot = require('../models/Robot');

class RobotStatusService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.pollInterval = 500; // 1초마다 상태 수집 (1Hz)
    this.httpTimeout = 5000; // HTTP 요청 타임아웃 5초
  }

  // 서비스 시작
  start() {
    if (this.isRunning) {
      
      return;
    }

    
    this.isRunning = true;
    
    // 즉시 한 번 실행
    this.collectAllRobotStatus();
    
    // 주기적 실행 시작
    this.intervalId = setInterval(() => {
      this.collectAllRobotStatus();
    }, this.pollInterval);

    
  }

  // 서비스 중지
  stop() {
    if (!this.isRunning) {
      
      return;
    }

    
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    
  }

  // 모든 로봇의 상태 수집
  async collectAllRobotStatus() {
    try {
      // 모든 로봇 정보 가져오기
      const robots = await Robot.findAll();
      
      if (robots.length === 0) {
        
        return;
      }

      

      // 병렬로 모든 로봇의 상태 수집
      const promises = robots.map(robot => this.collectRobotStatus(robot));
      const results = await Promise.allSettled(promises);

      // 결과 통계
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      

    } catch (error) {
      
    }
  }

  // 개별 로봇의 상태 수집
  async collectRobotStatus(robot) {
    if (!robot.ip_address) {
      const errorMsg = `로봇 ${robot.name}의 IP 주소가 설정되지 않았습니다.`;
      await robot.markAsDisconnected(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const port = robot.port || 80;
      const url = `http://${robot.ip_address}:${port}/api/v1/amr/status`;
      

      const response = await axios.get(url, {
        timeout: this.httpTimeout,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 && response.data) {
        // 로봇이 보낸 전체 JSON 응답 출력
        console.log(`\n🤖 [상태수집] 로봇 ID: ${robot.id} | 이름: ${robot.name}`);
        console.log(`URL: ${url}`);
        console.log(`시간: ${new Date().toISOString()}`);
        console.log('=== 로봇이 보낸 전체 JSON 응답 ===');
        console.log(JSON.stringify(response.data, null, 2));
        
        // order_status를 기반으로 status 매핑
        let mappedStatus = response.data.status; // 기본값은 로봇이 보낸 status
        
        if (response.data.order_status !== undefined) {
          switch (response.data.order_status) {
            case 0:
              mappedStatus = 'idle';
              break;
            case 1:
              mappedStatus = 'stop';
              break;
            case 2:
              mappedStatus = 'working';
              break;
            case 3:
              mappedStatus = 'pause';
              break;
            default:
              mappedStatus = response.data.status || 'unknown';
              break;
          }
          
          console.log(`Order Status 매핑: ${response.data.order_status} → "${mappedStatus}"`);
        }
        
        console.log(`원본 Status: "${response.data.status}" | 매핑된 Status: "${mappedStatus}"`);
        
        // 연결 성공 - 상태 정보 업데이트 (매핑된 status 사용)
        const updateData = {
          ...response.data,
          status: mappedStatus, // 매핑된 status로 덮어쓰기
          connection_status: true,
          error_code: 0,
          error_msg: null
        };
        
        console.log(`🔄 [상태수집] DB 업데이트 데이터:`, {
          robot_id: robot.id,
          robot_name: robot.name,
          old_status: robot.status,
          new_status: mappedStatus,
          order_status: response.data.order_status
        });
        console.log('─────────────────────────────────────\n');
        
        await robot.updateAmrStatus(updateData);
        
        return response.data;
      } else {
        throw new Error(`잘못된 응답: HTTP ${response.status}`);
      }

    } catch (error) {
      const port = robot.port || 80;
      
      
      // 연결 실패 - 상태 업데이트
      const errorMsg = `연결 실패: ${error.message}`;
      await robot.markAsDisconnected(errorMsg);
      
      throw error;
    }
  }

  // 특정 로봇의 상태만 수집
  async collectSingleRobotStatus(robotId) {
    try {
      const robot = await Robot.findById(robotId);
      if (!robot) {
        throw new Error(`로봇 ID ${robotId}를 찾을 수 없습니다.`);
      }

      return await this.collectRobotStatus(robot);
    } catch (error) {
      
      throw error;
    }
  }

  // 설정 변경
  setPollInterval(intervalMs) {
    if (intervalMs < 1000) {
      throw new Error('폴링 간격은 최소 1초 이상이어야 합니다.');
    }
    
    this.pollInterval = intervalMs;
    
    
    // 실행 중이면 재시작
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  setHttpTimeout(timeoutMs) {
    if (timeoutMs < 1000) {
      throw new Error('HTTP 타임아웃은 최소 1초 이상이어야 합니다.');
    }
    
    this.httpTimeout = timeoutMs;
    
  }

  // 서비스 상태 확인
  getStatus() {
    return {
      isRunning: this.isRunning,
      pollInterval: this.pollInterval,
      httpTimeout: this.httpTimeout,
      intervalId: this.intervalId !== null
    };
  }

  // 연결된 로봇 수 확인
  async getConnectedRobotsCount() {
    try {
      const robots = await Robot.findAll();
      return robots.filter(robot => robot.connection_status === true || robot.connection_status === 1).length;
    } catch (error) {
      
      return 0;
    }
  }

  // 로봇 상태 통계
  async getRobotStatusStats() {
    try {
      const robots = await Robot.findAll();
      const stats = {
        total: robots.length,
        connected: 0,
        disconnected: 0,
        idle: 0,
        stop: 0,
        working: 0,
        pause: 0,
        charging: 0,
        error: 0
      };

      robots.forEach(robot => {
        if (robot.connection_status) {
          stats.connected++;
        } else {
          stats.disconnected++;
        }

        switch (robot.status) {
          case 'idle':
            stats.idle++;
            break;
          case 'stop':
            stats.stop++;
            break;
          case 'working':
            stats.working++;
            break;
          case 'pause':
            stats.pause++;
            break;
          case 'charging':
            stats.charging++;
            break;
          case 'error':
          case 'disconnected':
            stats.error++;
            break;
        }
      });

      return stats;
    } catch (error) {
      
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const robotStatusService = new RobotStatusService();

module.exports = robotStatusService; 